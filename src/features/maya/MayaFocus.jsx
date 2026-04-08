/**
 * Focus Mode — 25-min Pomodoro timer.
 * Maya stays silent. Bell rings at end. XP bonus.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import sfx from './lib/sfx'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const PRESETS = [
  { min: 15, label: 'Quick' },
  { min: 25, label: 'Pomodoro' },
  { min: 45, label: 'Deep' },
  { min: 60, label: 'Marathon' },
]

export default function MayaFocus() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [duration, setDuration] = useState(25)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(25 * 60)
  const [done, setDone] = useState(false)
  const tickRef = useRef(null)

  useEffect(() => {
    if (!running) return
    tickRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          finish()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running])

  const start = () => {
    setRemaining(duration * 60)
    setRunning(true)
    setDone(false)
    maya.speakText(`Focus mode. ${duration} minutes. I'll be quiet. Go.`)
    // Block tab close warning
    window.onbeforeunload = () => 'Focus session in progress. Are you sure?'
  }

  const stop = () => {
    setRunning(false)
    if (tickRef.current) clearInterval(tickRef.current)
    window.onbeforeunload = null
  }

  const finish = () => {
    setRunning(false)
    setDone(true)
    if (tickRef.current) clearInterval(tickRef.current)
    window.onbeforeunload = null
    sfx.achievement()
    sfx.achievement()
    maya.speakText(`That's ${duration} minutes of pure focus. Locked in. Plus 50 XP.`)
    // Award XP via a synthetic task complete (cheating a little — direct gamification)
    // Easier: log a manual event the user can see
    try {
      const state = JSON.parse(localStorage.getItem('maya_state') || '{}')
      state.dayLog = state.dayLog || []
      state.dayLog.push({
        type: 'task_complete',
        task: `${duration}m focus block`,
        taskType: 'focus',
        xp: 50,
        time: new Date().toISOString(),
      })
      if (state.gamification) {
        state.gamification.totalXP = (state.gamification.totalXP || 0) + 50
      }
      localStorage.setItem('maya_state', JSON.stringify(state))
    } catch {}
  }

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const pct = running ? (1 - remaining / (duration * 60)) * 100 : 0

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at center, ${running ? C.teal + '11' : 'transparent'}, ${C.bg} 70%)`,
      color: C.text, fontFamily: C.mono,
      paddingBottom: 80,
    }}>
      <Header onBack={() => { stop(); navigate('/') }} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {!running && !done && (
          <>
            <div style={{
              padding: 18, background: C.surface, borderRadius: 16,
              border: `1px solid ${C.border}`, marginBottom: 14,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Pick your block
              </div>
              <div style={{
                fontFamily: C.display, fontSize: 100, lineHeight: 1,
                color: C.teal, marginTop: 8,
              }}>{duration}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: -4 }}>minutes</div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {PRESETS.map(p => (
                <button
                  key={p.min}
                  onClick={() => setDuration(p.min)}
                  style={{
                    flex: 1, padding: '10px 4px', borderRadius: 10,
                    background: duration === p.min ? C.teal + '22' : C.surface,
                    border: `1px solid ${duration === p.min ? C.teal : C.border}`,
                    color: duration === p.min ? C.teal : C.text,
                    fontSize: 11, fontFamily: C.mono, cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{p.min}m</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{p.label}</div>
                </button>
              ))}
            </div>

            <div style={{
              padding: 12, background: C.surfaceLight, borderRadius: 10,
              fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 14,
            }}>
              💡 No phone. No tabs. Just the work. I'll be silent until you're done — then 50 XP bonus.
            </div>

            <button onClick={start} style={primary}>Start focus</button>
          </>
        )}

        {running && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              fontFamily: C.display, fontSize: 140, lineHeight: 1,
              color: C.teal,
              textShadow: `0 0 40px ${C.teal}66`,
            }}>
              {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
            </div>
            <div style={{
              height: 6, background: C.dim, borderRadius: 3,
              overflow: 'hidden', marginTop: 24,
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, ${C.teal}, #7db8e8)`,
                transition: 'width 1s linear',
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 16 }}>
              Locked in. Focus mode active.
            </div>
            <button
              onClick={stop}
              style={{
                marginTop: 30, padding: '10px 20px',
                background: 'transparent', border: `1px solid ${C.red}44`,
                borderRadius: 8, color: C.red, fontSize: 11,
                fontFamily: C.mono, cursor: 'pointer',
              }}
            >Bail (no XP)</button>
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56 }}>🏆</div>
            <div style={{ fontFamily: C.display, fontSize: 32, color: C.gold, marginTop: 12, letterSpacing: 1.5 }}>
              FOCUS COMPLETE
            </div>
            <div style={{ fontSize: 13, color: C.text, marginTop: 8 }}>
              {duration} min locked in.<br/>+50 XP.
            </div>
            <button onClick={() => navigate('/')} style={{ ...primary, marginTop: 24 }}>
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
      background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>FOCUS</div>
    </div>
  )
}

const primary = {
  width: '100%', padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
}
