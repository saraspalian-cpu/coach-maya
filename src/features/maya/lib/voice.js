/**
 * Voice Service — Maya speaks and listens.
 * Uses Web Speech API: speechSynthesis (TTS) + webkitSpeechRecognition (STT).
 * Free, native, works on iPad/Mac/Chrome.
 */

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
  const voices = getVoices()
  if (!voices.length) return null
  // Preferred: female English voices, in order of quality
  const preferences = [
    'Samantha',           // macOS premium
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
  // Fallback: any English female-ish voice
  return voices.find(v => v.lang?.startsWith('en') && /female|woman|samantha|aria|jenny|karen/i.test(v.name))
    || voices.find(v => v.lang?.startsWith('en'))
    || voices[0]
}

/**
 * Speak text as Maya. Returns a promise that resolves when finished.
 * Calls onBoundary(charIndex) and onEnd() so the avatar can lip-sync.
 */
async function speak(text, { onStart, onBoundary, onEnd, onError } = {}) {
  if (!('speechSynthesis' in window)) {
    onError?.(new Error('SpeechSynthesis not supported'))
    return
  }
  await waitForVoices()
  // Stop anything currently speaking
  cancelSpeech()

  const utter = new SpeechSynthesisUtterance(text)
  const voice = pickMayaVoice()
  if (voice) utter.voice = voice
  utter.rate = 1.05
  utter.pitch = 1.1
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
}

function isSpeaking() {
  return !!(window.speechSynthesis?.speaking)
}

// ─── STT: Maya Listening ───
let recognition = null

function getRecognition() {
  if (recognition) return recognition
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  recognition = new SR()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = 'en-US'
  return recognition
}

function isSTTSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Start listening. Returns a stop() function.
 * onResult(transcript, isFinal)
 */
function listen({ onStart, onResult, onEnd, onError } = {}) {
  const r = getRecognition()
  if (!r) { onError?.(new Error('SpeechRecognition not supported')); return () => {} }

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
  r.onerror = (e) => onError?.(e)

  try { r.start() } catch (e) { onError?.(e) }

  return () => {
    stopped = true
    try { r.stop() } catch {}
  }
}

export {
  speak,
  cancelSpeech,
  isSpeaking,
  listen,
  isSTTSupported,
  pickMayaVoice,
  waitForVoices,
}
