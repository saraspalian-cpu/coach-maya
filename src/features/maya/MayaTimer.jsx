/**
 * Study Timer — configurable timer with ambient sound options.
 * White noise / rain / lo-fi generated via Web Audio. No audio files needed.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const AMBIENT = {
  none: { label: 'Silent', icon: '🔇' },
  white: { label: 'White noise', icon: '📻' },
  brown: { label: 'Brown noise', icon: '🌊' },
  pink: { label: 'Pink noise', icon: '🌸' },
}

let noiseCtx = null
let noiseNode = null
let noiseGain = null

function startNoise(type) {
  stopNoise()
  if (type === 'none') return
  noiseCtx = new (window.AudioContext || window.webkitAudioContext)()
  const bufferSize = 2 * noiseCtx.sampleRate
  const buffer = noiseCtx.createBuffer(1, bufferSize, noiseCtx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      data[i] = (last + (0.02 * w)) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }

  noiseNode = noiseCtx.createBufferSource()
  noiseNode.buffer = buffer
  noiseNode.loop = true
  noiseGain = noiseCtx.createGain()
  noiseGain.gain.value = 0.15
  noiseNode.connect(noiseGain)
  noiseGain.connect(noiseCtx.destination)
  noiseNode.start()
}

function stopNoise() {
  try { noiseNode?.stop() } catch {}
  try { noiseCtx?.close() } catch {}
  noiseNode = null; noiseGain = null; noiseCtx = null
}

export default function MayaTimer() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [ambient, setAmbient] = useState('none')
  const tickRef = useRef(null)

  useEffect(() => {
    if (!running) return
    tickRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { finish(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running])

  useEffect(() => () => stopNoise(), [])

  const start = () => {
    setRemaining(duration * 60)
    setRunning(true)
    setDone(false)
    startNoise(ambient)
  }

  const stop = () => {
    setRunning(false)
    if (tickRef.current) clearInterval(tickRef.current)
    stopNoise()
  }

  const finish = () => {
    setRunning(false)
    setDone(true)
    if (tickRef.current) clearInterval(tickRef.current)
    stopNoise()
    sfx.achievement()
  }

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const pct = running ? (1 - remaining / (duration * 60)) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => { stopNoise(); stop(); navigate('/') }} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {!running && !done && (
          <>
            <div style={{ textAlign: 'center', padding: 20, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontFamily: C.display, fontSize: 100, color: C.teal, lineHeight: 1 }}>{duration}</div>
              <div style={{ fontSize: 10, color: C.muted }}>minutes</div>
              <input type="range" min={5} max={120} step={5} value={duration} onChange={e => setDuration(parseInt(e.target.value))} style={{ width: '80%', marginTop: 12, accentColor: C.teal }} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {[15, 25, 45, 60, 90].map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10,
                    border: `1px solid ${duration === d ? C.teal : C.border}`,
                    background: duration === d ? C.teal + '22' : 'transparent',
                    color: duration === d ? C.teal : C.muted,
                    fontFamily: C.mono, cursor: 'pointer',
                  }}>{d}m</button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ambient sound</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Object.entries(AMBIENT).map(([key, { label, icon }]) => (
                <button key={key} onClick={() => setAmbient(key)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                  background: ambient === key ? C.teal + '22' : C.surface,
                  border: `1px solid ${ambient === key ? C.teal : C.border}`,
                  color: ambient === key ? C.teal : C.muted,
                  fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ marginTop: 2 }}>{label}</div>
                </button>
              ))}
            </div>

            <button onClick={start} style={btn}>Start study session</button>
          </>
        )}

        {running && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontFamily: C.display, fontSize: 140, lineHeight: 1, color: C.teal, textShadow: `0 0 40px ${C.teal}66` }}>
              {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
            </div>
            <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: 'hidden', marginTop: 24 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.teal}, #7db8e8)`, transition: 'width 1s linear' }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>
              {ambient !== 'none' ? `${AMBIENT[ambient].icon} ${AMBIENT[ambient].label} playing` : 'Silent mode'}
            </div>
            <button onClick={stop} style={{ marginTop: 24, padding: '10px 20px', background: 'transparent', border: `1px solid ${C.red}44`, borderRadius: 8, color: C.red, fontSize: 11, fontFamily: C.mono, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontFamily: C.display, fontSize: 32, color: C.gold, marginTop: 12, letterSpacing: 1.5 }}>SESSION DONE</div>
            <div style={{ fontSize: 13, color: C.text, marginTop: 8 }}>{duration} minutes. Locked in.</div>
            <button onClick={() => navigate('/')} style={{ ...btn, marginTop: 20 }}>Back to dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>STUDY TIMER</div>
    </div>
  )
}
const btn = { width: '100%', padding: '14px 20px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }
