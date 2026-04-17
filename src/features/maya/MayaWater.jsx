/**
 * Water Intake Tracker — tap to log glasses. Target 8/day.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', blue: '#93C5FD',
  green: '#34D399', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const WATER_KEY = 'maya_water'
const TARGET = 8

function loadWater() {
  try {
    const data = JSON.parse(localStorage.getItem(WATER_KEY)) || {}
    const today = new Date().toISOString().slice(0, 10)
    return { today: data[today] || 0, history: data }
  } catch { return { today: 0, history: {} } }
}
function saveWater(count) {
  try {
    const data = JSON.parse(localStorage.getItem(WATER_KEY)) || {}
    data[new Date().toISOString().slice(0, 10)] = count
    localStorage.setItem(WATER_KEY, JSON.stringify(data))
  } catch {}
}

export default function MayaWater() {
  const navigate = useNavigate()
  const initial = loadWater()
  const [count, setCount] = useState(initial.today)
  const [history] = useState(initial.history)

  const add = () => {
    const next = count + 1
    setCount(next)
    saveWater(next)
    sfx.ding()
  }

  const remove = () => {
    if (count <= 0) return
    const next = count - 1
    setCount(next)
    saveWater(next)
  }

  const pct = Math.min(100, Math.round((count / TARGET) * 100))
  const done = count >= TARGET

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return { date: key, count: history[key] || 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) }
  })

  // Streak
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const val = i === 0 ? count : (history[key] || 0)
    if (val >= TARGET) streak++; else break
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Big counter */}
        <div style={{
          padding: 32, background: C.surface, borderRadius: 20,
          border: `2px solid ${done ? C.gold + '55' : C.blue + '33'}`,
          textAlign: 'center', marginBottom: 16, position: 'relative',
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Today</div>
          <div style={{
            fontFamily: C.display, fontSize: 100, lineHeight: 1, marginTop: 8,
            color: done ? C.gold : C.blue,
          }}>{count}</div>
          <div style={{ fontSize: 12, color: done ? C.gold : C.muted, marginTop: 4 }}>
            {done ? 'Target hit! Stay hydrated.' : `of ${TARGET} glasses`}
          </div>

          {/* Progress ring */}
          <div style={{ marginTop: 16, height: 8, background: C.dim, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: done ? C.gold : `linear-gradient(90deg, ${C.blue}, ${C.teal})`,
              transition: 'width 300ms',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={remove} style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'transparent', border: `2px solid ${C.border}`,
              color: C.muted, fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <button onClick={add} style={{
              width: 72, height: 72, borderRadius: 36,
              background: done ? C.gold : C.blue,
              border: 'none', color: C.bg, fontSize: 32,
              cursor: 'pointer', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 20px ${done ? C.gold : C.blue}44`,
            }}>💧</button>
            <div style={{ width: 56 }} />
          </div>
        </div>

        {streak > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 12, color: C.gold }}>
            💧 {streak}-day hydration streak
          </div>
        )}

        {/* Weekly chart */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>This week</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 6 }}>
            {last7.map((d, i) => {
              const h = Math.min((d.count / 10) * 100, 100)
              const isToday = i === 6
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: C.muted }}>{d.count}</div>
                  <div style={{
                    width: '100%', height: `${Math.max(h, 4)}%`,
                    background: d.count >= TARGET ? C.gold : C.blue,
                    borderRadius: 3, minHeight: 4,
                    border: isToday ? `1px solid ${C.teal}` : 'none',
                  }} />
                  <div style={{ fontSize: 8, color: isToday ? C.teal : C.dim }}>{d.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.blue, letterSpacing: 2 }}>WATER</div>
    </div>
  )
}
