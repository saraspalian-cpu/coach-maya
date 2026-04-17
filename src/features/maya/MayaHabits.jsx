/**
 * Habit Tracker — daily habits with per-habit streaks.
 * Visual 7-day grid. Tap to check off. Maya sees consistency.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const HABIT_KEY = 'maya_habits'
const DEFAULT_HABITS = [
  { id: 'exercise', name: 'Exercise', icon: '💪' },
  { id: 'reading', name: 'Read 20min', icon: '📖' },
  { id: 'water', name: '8 glasses water', icon: '💧' },
  { id: 'sleep8', name: 'Sleep 8+ hrs', icon: '😴' },
  { id: 'nophone', name: 'No phone before tasks', icon: '📵' },
]

function loadHabits() {
  try {
    const raw = JSON.parse(localStorage.getItem(HABIT_KEY))
    return raw || { habits: DEFAULT_HABITS, checks: {} }
  } catch { return { habits: DEFAULT_HABITS, checks: {} } }
}
function saveHabits(data) {
  try { localStorage.setItem(HABIT_KEY, JSON.stringify(data)) } catch {}
}

function dateKey(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
function dayLabel(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function getStreak(habitId, checks) {
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const key = `${habitId}_${dateKey(-i)}`
    if (checks[key]) streak++
    else break
  }
  return streak
}

export default function MayaHabits() {
  const navigate = useNavigate()
  const [data, setData] = useState(loadHabits())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('✅')

  const persist = (next) => { setData(next); saveHabits(next) }

  const toggle = (habitId, day) => {
    const key = `${habitId}_${day}`
    const checks = { ...data.checks }
    checks[key] = !checks[key]
    persist({ ...data, checks })
  }

  const addHabit = () => {
    if (!newName.trim()) return
    const h = { id: `h_${Date.now()}`, name: newName.trim(), icon: newIcon || '✅' }
    persist({ ...data, habits: [...data.habits, h] })
    setNewName(''); setNewIcon('✅'); setAdding(false)
  }

  const removeHabit = (id) => {
    if (!confirm('Remove this habit?')) return
    persist({ ...data, habits: data.habits.filter(h => h.id !== id) })
  }

  const days = Array.from({ length: 7 }, (_, i) => -6 + i)
  const todayChecked = data.habits.filter(h => data.checks[`${h.id}_${dateKey(0)}`]).length
  const totalToday = data.habits.length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          padding: 16, background: C.surface, borderRadius: 14,
          border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Today</div>
          <div style={{ fontFamily: C.display, fontSize: 48, color: todayChecked === totalToday && totalToday > 0 ? C.gold : C.teal, lineHeight: 1, marginTop: 4 }}>
            {todayChecked}/{totalToday}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            {todayChecked === totalToday && totalToday > 0 ? 'All habits done. Machine.' : 'habits checked off'}
          </div>
        </div>

        {/* Habit rows with 7-day grid */}
        {data.habits.map(h => {
          const streak = getStreak(h.id, data.checks)
          return (
            <div key={h.id} style={{
              padding: 12, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{h.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{h.name}</div>
                    <div style={{ fontSize: 9, color: streak > 0 ? C.gold : C.muted }}>
                      {streak > 0 ? `🔥 ${streak}-day streak` : 'No streak'}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeHabit(h.id)} style={{
                  background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14,
                }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {days.map(offset => {
                  const day = dateKey(offset)
                  const checked = !!data.checks[`${h.id}_${day}`]
                  const isToday = offset === 0
                  return (
                    <button
                      key={offset}
                      onClick={() => toggle(h.id, day)}
                      style={{
                        flex: 1, padding: '6px 2px',
                        background: checked ? C.green + '33' : 'transparent',
                        border: `1.5px solid ${isToday ? C.teal : checked ? C.green + '55' : C.dim}`,
                        borderRadius: 6, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <div style={{ fontSize: 8, color: isToday ? C.teal : C.muted }}>{dayLabel(offset)}</div>
                      <div style={{ fontSize: 14 }}>{checked ? '✅' : '·'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!adding ? (
          <button onClick={() => setAdding(true)} style={btn}>+ Add habit</button>
        ) : (
          <div style={{ padding: 14, background: C.surfaceLight, borderRadius: 12, border: `1px solid ${C.border}`, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="🎯" style={{ ...inp, width: 50, textAlign: 'center' }} />
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit name" autoFocus style={{ ...inp, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={secBtn}>Cancel</button>
              <button onClick={addHabit} style={btn}>Save</button>
            </div>
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
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>HABITS</div>
    </div>
  )
}
const inp = { padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box' }
const btn = { width: '100%', padding: '12px 18px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }
const secBtn = { flex: 1, padding: '12px 18px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: C.mono, cursor: 'pointer' }
