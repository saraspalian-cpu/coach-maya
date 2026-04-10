/**
 * Screen Time Calculator — tied to daily grade.
 * S = unlimited, A = 2hr, B = 1hr, C = 30min, F = 0.
 * Visual timer tracks earned vs used.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const GRADE_MINUTES = { S: Infinity, A: 120, B: 60, C: 30, F: 0, '-': 0 }
const SCREEN_KEY = 'maya_screen_time'

function loadScreenTime() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCREEN_KEY) || '{}')
    const today = new Date().toISOString().slice(0, 10)
    if (raw.date !== today) return { date: today, usedMin: 0, timerActive: false, timerStart: null }
    return raw
  } catch { return { date: new Date().toISOString().slice(0, 10), usedMin: 0, timerActive: false, timerStart: null } }
}
function saveScreenTime(data) {
  try { localStorage.setItem(SCREEN_KEY, JSON.stringify(data)) } catch {}
}

export default function MayaScreenTime() {
  const navigate = useNavigate()
  const { gamification } = useMaya()
  const grade = gamification?.dayGrade?.grade || '-'
  const earnedMin = GRADE_MINUTES[grade] ?? 0
  const isUnlimited = earnedMin === Infinity

  const [st, setSt] = useState(loadScreenTime())
  const [elapsed, setElapsed] = useState(0)
  const tickRef = useRef(null)

  const persist = (next) => { setSt(next); saveScreenTime(next) }

  // Timer tick
  useEffect(() => {
    if (!st.timerActive || !st.timerStart) return
    tickRef.current = setInterval(() => {
      const mins = (Date.now() - st.timerStart) / 60000
      setElapsed(mins)
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [st.timerActive, st.timerStart])

  const totalUsed = st.usedMin + (st.timerActive ? elapsed : 0)
  const remaining = isUnlimited ? Infinity : Math.max(0, earnedMin - totalUsed)
  const overBudget = !isUnlimited && totalUsed > earnedMin
  const pct = isUnlimited ? 0 : earnedMin > 0 ? Math.min(100, (totalUsed / earnedMin) * 100) : 100

  const startTimer = () => {
    if (!isUnlimited && remaining <= 0) return
    persist({ ...st, timerActive: true, timerStart: Date.now() })
    setElapsed(0)
  }

  const stopTimer = () => {
    const mins = st.timerStart ? (Date.now() - st.timerStart) / 60000 : 0
    persist({ ...st, timerActive: false, timerStart: null, usedMin: st.usedMin + mins })
    setElapsed(0)
  }

  const resetDay = () => {
    if (!confirm('Reset screen time for today?')) return
    persist({ date: new Date().toISOString().slice(0, 10), usedMin: 0, timerActive: false, timerStart: null })
    setElapsed(0)
  }

  const fmt = (mins) => {
    if (mins === Infinity) return '∞'
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Grade → earned */}
        <div style={{
          padding: 24, background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Today's grade
          </div>
          <div style={{
            fontFamily: C.display, fontSize: 72, lineHeight: 1, marginTop: 4,
            color: grade === 'S' ? C.gold : grade === 'A' ? C.green : grade === 'B' ? '#7db8e8' : grade === 'C' ? C.amber : C.red,
          }}>{grade}</div>
          <div style={{ fontSize: 13, color: C.text, marginTop: 8 }}>
            {isUnlimited ? '= Unlimited screen time 🎉' : earnedMin > 0 ? `= ${fmt(earnedMin)} screen time earned` : '= No screen time earned'}
          </div>
        </div>

        {/* Grade scale */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>How it works</div>
          {[
            { g: 'S', mins: '∞', desc: 'Full freedom', color: C.gold },
            { g: 'A', mins: '2 hrs', desc: 'Great day', color: C.green },
            { g: 'B', mins: '1 hr', desc: 'Solid day', color: '#7db8e8' },
            { g: 'C', mins: '30 min', desc: 'OK day', color: C.amber },
            { g: 'F', mins: '0', desc: 'Nothing earned', color: C.red },
          ].map(r => (
            <div key={r.g} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
              opacity: r.g === grade ? 1 : 0.4,
            }}>
              <div style={{ width: 24, fontWeight: 700, color: r.color, fontSize: 14 }}>{r.g}</div>
              <div style={{ flex: 1, fontSize: 11, color: C.text }}>{r.desc}</div>
              <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.mins}</div>
            </div>
          ))}
        </div>

        {/* Usage meter */}
        {earnedMin > 0 && (
          <div style={{
            padding: 18, background: C.surface, borderRadius: 16,
            border: `1px solid ${overBudget ? C.red + '55' : C.border}`, marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: overBudget ? C.red : C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              {overBudget ? '⚠️ Over budget' : st.timerActive ? '● Counting...' : 'Screen time used'}
            </div>
            <div style={{
              fontFamily: C.display, fontSize: 56, lineHeight: 1, marginTop: 8,
              color: overBudget ? C.red : remaining < 10 && !isUnlimited ? C.amber : C.teal,
            }}>{fmt(totalUsed)}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {isUnlimited ? 'Unlimited today' : `${fmt(remaining)} remaining of ${fmt(earnedMin)}`}
            </div>

            {!isUnlimited && (
              <div style={{ height: 8, background: C.dim, borderRadius: 4, overflow: 'hidden', marginTop: 12 }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  background: overBudget ? C.red : pct > 80 ? C.amber : C.teal,
                  transition: 'width 1s linear',
                }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {!st.timerActive ? (
                <button onClick={startTimer} disabled={!isUnlimited && remaining <= 0} style={{
                  flex: 1, padding: '12px', background: remaining <= 0 && !isUnlimited ? C.dim : C.teal,
                  border: 'none', borderRadius: 10, color: C.bg, fontSize: 13,
                  fontWeight: 700, fontFamily: C.mono, cursor: remaining <= 0 && !isUnlimited ? 'not-allowed' : 'pointer',
                }}>▶ Start screen time</button>
              ) : (
                <button onClick={stopTimer} style={{
                  flex: 1, padding: '12px', background: C.red,
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 13,
                  fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
                }}>⏹ Stop</button>
              )}
            </div>
          </div>
        )}

        {earnedMin === 0 && (
          <div style={{
            padding: 24, background: C.surface, borderRadius: 16,
            border: `1px solid ${C.red}44`, textAlign: 'center', marginBottom: 16,
          }}>
            <div style={{ fontSize: 32 }}>🚫</div>
            <div style={{ fontSize: 13, color: C.red, marginTop: 8, fontWeight: 600 }}>No screen time today</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Upgrade your grade to unlock it. Complete tasks + do a reflection.</div>
          </div>
        )}

        <button onClick={resetDay} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.muted, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
        }}>Reset today's timer</button>
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>SCREEN TIME</div>
    </div>
  )
}
