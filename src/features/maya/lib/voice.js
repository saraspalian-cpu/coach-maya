/**
 * Voice Service — Maya speaks and listens.
 * TTS: ElevenLabs (premium) → Web Speech API (free fallback)
 * STT: Web Speech webkitSpeechRecognition
 */

import { loadProfile } from './profile'

// ─── TTS: Maya Speaking ───
let voicesCache = null
let currentUtterance = null

function getVoices() {
  if (voicesCache) return voicesCache
  const voices = window.speechSynthesis?.getVoices() || []
  voicesCache = voices
  return voices
}

// Wait for voices to load (Chrome async loads them)
function waitForVoices() {
  return new Promise((resolve) => {
    const v = window.speechSynthesis?.getVoices() || []
    if (v.length) { voicesCache = v; resolve(v); return }
    const handler = () => {
      voicesCache = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', handler)
      resolve(voicesCache)
    }
    window.speechSynthesis?.addEventListener('voiceschanged', handler)
    // Failsafe timeout
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() || []), 1000)
  })
}

function pickMayaVoice() {
  const profile = loadProfile()
  const voices = getVoices()
  if (!voices.length) return null

  // 1. User-picked voice from profile
  if (profile?.systemVoice) {
    const picked = voices.find(v => v.name === profile.systemVoice)
    if (picked) return picked
  }

  // 2. Premium English voices, ranked
  const preferences = [
    'Samantha',           // macOS premium female
    'Ava (Premium)',      // macOS premium
    'Allison',            // macOS premium
    'Karen',              // macOS Australian
    'Moira',              // macOS Irish
    'Tessa',              // macOS S. African
    'Google US English',  // Chrome
    'Microsoft Aria',     // Edge premium
    'Microsoft Jenny',
  ]
  for (const name of preferences) {
    const v = voices.find(v => v.name.includes(name))
    if (v) return v
  }
  return voices.find(v => v.lang?.startsWith('en') && /female|woman|samantha|aria|jenny|karen/i.test(v.name))
    || voices.find(v => v.lang?.startsWith('en'))
    || voices[0]
}

function listAllVoices() {
  return getVoices().filter(v => v.lang?.startsWith('en'))
}

// ─── ElevenLabs (premium) ───
async function speakElevenLabs(text, profile, callbacks = {}) {
  const apiKey = profile.elevenLabsApiKey
  const voiceId = profile.elevenLabsVoiceId || 'EXAVITQu4vr4xnSDxMaL' // Sarah default
  if (!apiKey) throw new Error('No ElevenLabs API key')

  callbacks.onStart?.()
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  currentAudio = audio
  audio.onended = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    callbacks.onEnd?.()
  }
  audio.onerror = (e) => {
    currentAudio = null
    callbacks.onError?.(e)
  }
  await audio.play()
}

let currentAudio = null

/**
 * Speak text as Maya. Returns a promise that resolves when finished.
 * Calls onBoundary(charIndex) and onEnd() so the avatar can lip-sync.
 */
async function speak(text, { onStart, onBoundary, onEnd, onError } = {}) {
  cancelSpeech()
  const profile = loadProfile()

  // Try ElevenLabs first if configured
  if (profile?.elevenLabsApiKey) {
    try {
      await speakElevenLabs(text, profile, { onStart, onEnd, onError })
      return
    } catch (e) {
      console.warn('ElevenLabs failed, falling back to system voice:', e)
    }
  }

  if (!('speechSynthesis' in window)) {
    onError?.(new Error('SpeechSynthesis not supported'))
    return
  }
  await waitForVoices()

  // Add subtle natural pauses + slight randomization for human feel
  const humanizedText = text
    .replace(/([.!?])\s+/g, '$1 ... ')   // longer pause after sentences
    .replace(/,\s+/g, ', ')                // tighter commas

  const utter = new SpeechSynthesisUtterance(humanizedText)
  const voice = pickMayaVoice()
  if (voice) utter.voice = voice
  // Slightly slower + natural pitch + small variation per call
  utter.rate = 0.96 + (Math.random() * 0.06)
  utter.pitch = 1.02 + (Math.random() * 0.06)
  utter.volume = 1

  utter.onstart = () => onStart?.()
  utter.onboundary = (e) => onBoundary?.(e.charIndex, e.charLength)
  utter.onend = () => { currentUtterance = null; onEnd?.() }
  utter.onerror = (e) => { currentUtterance = null; onError?.(e) }

  currentUtterance = utter
  window.speechSynthesis.speak(utter)
}

function cancelSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
  if (currentAudio) {
    try { currentAudio.pause() } catch {}
    currentAudio = null
  }
}

function isSpeaking() {
  return !!(window.speechSynthesis?.speaking)
}

// ─── STT: Maya Listening ───
function isSTTSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Start listening. Returns a stop() function.
 * Creates a FRESH recognition instance every call so the auto-restart loop
 * doesn't reuse a dead object.
 */
function listen({ onStart, onResult, onEnd, onError, continuous = false } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError?.(new Error('SpeechRecognition not supported'))
    return () => {}
  }

  const r = new SR()
  r.continuous = continuous
  r.interimResults = true
  r.lang = 'en-US'
  r.maxAlternatives = 1

  let stopped = false

  r.onstart = () => onStart?.()
  r.onresult = (ev) => {
    let transcript = ''
    let isFinal = false
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      transcript += ev.results[i][0].transcript
      if (ev.results[i].isFinal) isFinal = true
    }
    onResult?.(transcript.trim(), isFinal)
  }
  r.onend = () => { if (!stopped) onEnd?.() }
  r.onerror = (e) => {
    // Surface real errors. 'no-speech' means silence — let onEnd handle restart.
    if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') {
      onError?.(e)
    } else {
      onEnd?.()
    }
  }

  try { r.start() } catch (e) { onError?.(e) }

  return () => {
    stopped = true
    try { r.stop() } catch {}
    try { r.abort() } catch {}
  }
}

export {
  speak,
  cancelSpeech,
  isSpeaking,
  listen,
  isSTTSupported,
  pickMayaVoice,
  listAllVoices,
  waitForVoices,
}
