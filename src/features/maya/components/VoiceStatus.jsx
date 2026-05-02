/**
 * Voice Status Banner — shows what Maya is currently using to speak.
 * Visible at the top of Profile page so the user can debug at a glance.
 */
import { useState, useEffect } from 'react'
import { loadProfile } from '../lib/profile'
import { getApiKey } from '../lib/secrets'
import { speak, cancelSpeech } from '../lib/voice'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  green: '#34D399', amber: '#FBBF24', red: '#F87171', teal: '#2DD4BF',
  mono: "'IBM Plex Mono', monospace",
}

export default function VoiceStatus() {
  const [status, setStatus] = useState(getStatus())
  const [testing, setTesting] = useState(false)
  const [lastError, setLastError] = useState('')

  useEffect(() => {
    setStatus(getStatus())
  }, [])

  const test = async () => {
    setTesting(true)
    setLastError('')
    cancelSpeech()
    try {
      // Clear any previous error
      try { delete window.__mayaVoiceError } catch {}
      await speak("Test test. This is Maya. If I sound robotic, it means ElevenLabs is not active.", {
        onEnd: () => {
          setTimeout(() => {
            const err = window.__mayaVoiceError
            if (err) setLastError(err)
            setTesting(false)
          }, 200)
        },
        onError: (e) => {
          setLastError(e?.message || String(e))
          setTesting(false)
        },
      })
    } catch (e) {
      setLastError(e?.message || String(e))
      setTesting(false)
    }
  }

  const c = status.color
  return (
    <div style={{
      padding: 14,
      background: C.surface,
      borderRadius: 12,
      border: `2px solid ${c}55`,
      borderLeft: `4px solid ${c}`,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 10, height: 10, borderRadius: 5,
          background: c, boxShadow: `0 0 8px ${c}aa`,
        }} />
        <div style={{ fontSize: 10, color: c, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
          Voice status
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{status.label}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{status.detail}</div>

      {lastError && (
        <div style={{
          marginTop: 8, padding: 8,
          background: C.red + '15', border: `1px solid ${C.red}44`, borderRadius: 6,
          fontSize: 10, color: C.red, fontFamily: 'monospace',
        }}>
          {lastError}
        </div>
      )}

      <button
        onClick={test}
        disabled={testing}
        style={{
          marginTop: 10, padding: '8px 14px',
          background: testing ? C.muted : c,
          border: 'none', borderRadius: 8,
          color: C.bg, fontSize: 11, fontWeight: 700,
          fontFamily: C.mono, cursor: testing ? 'wait' : 'pointer',
        }}
      >{testing ? 'Speaking...' : '▶ Test voice now'}</button>
    </div>
  )
}

function getStatus() {
  const profile = loadProfile()
  const hasKey = !!getApiKey('elevenlabs')
  const hasVoice = !!profile?.elevenLabsVoiceId?.trim()

  if (hasKey && hasVoice) {
    return {
      color: '#34D399',
      label: '✓ ElevenLabs ACTIVE',
      detail: `Voice ID: ${profile.elevenLabsVoiceId.slice(0, 8)}... — Maya will sound human. If she still sounds robotic, the API call may be failing — tap Test below.`,
    }
  }
  if (hasKey && !hasVoice) {
    return {
      color: '#FBBF24',
      label: '⚠ Key set but NO VOICE picked',
      detail: 'You have an API key but no voice ID. Default Drew voice will be used. Tap a voice preset below to pick one explicitly.',
    }
  }
  return {
    color: '#F87171',
    label: '✗ Using SYSTEM voice (robotic)',
    detail: 'No ElevenLabs API key set. Maya is using your laptop\'s built-in voice. Add a key from elevenlabs.io below to make her sound human.',
  }
}
