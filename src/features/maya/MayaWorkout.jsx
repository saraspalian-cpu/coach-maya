/**
 * Workout Tracker — log exercises, reps, sets. Track streaks.
 * Presets for bodyweight + tennis warmups.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', orange: '#FF6B35',
  green: '#22C55E', gold: '#FFD700', red: '#EF4444',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const WORKOUT_KEY = 'maya_workouts'

const PRESETS = [
  { id: 'pushups', name: 'Push-ups', icon: '💪', unit: 'reps', defaultCount: 10, category: 'upper' },
  { id: 'squats', name: 'Squats', icon: '🦵', unit: 'reps', defaultCount: 15, category: 'lower' },
  { id: 'plank', name: 'Plank', icon: '🧘', unit: 'sec', defaultCount: 30, category: 'core' },
  { id: 'burpees', name: 'Burpees', icon: '🔥', unit: 'reps', defaultCount: 8, category: 'full' },
  { id: 'jumpingjacks', name: 'Jumping Jacks', icon: '⭐', unit: 'reps', defaultCount: 20, category: 'cardio' },
  { id: 'lunges', name: 'Lunges', icon: '🏃', unit: 'reps', defaultCount: 12, category: 'lower' },
  { id: 'situps', name: 'Sit-ups', icon: '🔄', unit: 'reps', defaultCount: 15, category: 'core' },
  { id: 'mountainclimbers', name: 'Mountain Climbers', icon: '⛰️', unit: 'reps', defaultCount: 20, category: 'cardio' },
  { id: 'tennis_warmup', name: 'Tennis Warmup', icon: '🎾', unit: 'min', defaultCount: 10, category: 'sport' },
  { id: 'stretching', name: 'Stretching', icon: '🤸', unit: 'min', defaultCount: 10, category: 'recovery' },
  { id: 'running', name: 'Running', icon: '🏃‍♂️', unit: 'min', defaultCount: 15, category: 'cardio' },
  { id: 'cycling', name: 'Cycling', icon: '🚴', unit: 'min', defaultCount: 20, category: 'cardio' },
]

function loadWorkouts() {
  try { return JSON.parse(localStorage.getItem(WORKOUT_KEY)) || [] } catch { return [] }
}
function saveWorkouts(data) {
  try { localStorage.setItem(WORKOUT_KEY, JSON.stringify(data.slice(0, 500))) } catch {}
}

export default function MayaWorkout() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState(loadWorkouts())
  const [selected, setSelected] = useState(null)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [sessionExercises, setSessionExercises] = useState([])
  const [view, setView] = useState('log') // 'log' | 'history'

  const persist = (next) => { setWorkouts(next); saveWorkouts(next) }

  const selectPreset = (preset) => {
    setSelected(preset)
    setReps(preset.defaultCount)
    setSets(preset.unit === 'min' || preset.unit === 'sec' ? 1 : 3)
  }

  const addToSession = () => {
    if (!selected) return
    setSessionExercises([...sessionExercises, {
      id: selected.id,
      name: selected.name,
      icon: selected.icon,
      unit: selected.unit,
      sets,
      reps,
      total: sets * reps,
    }])
    sfx.ding()
    setSelected(null)
  }

  const finishSession = () => {
    if (sessionExercises.length === 0) return
    const session = {
      id: `wo_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toISOString(),
      exercises: sessionExercises,
      exerciseCount: sessionExercises.length,
      totalVolume: sessionExercises.reduce((s, e) => s + e.total, 0),
    }
    persist([session, ...workouts])
    setSessionExercises([])
    sfx.levelUp?.() || sfx.ding()
  }

  const removeFromSession = (i) => {
    setSessionExercises(sessionExercises.filter((_, idx) => idx !== i))
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayWorkouts = workouts.filter(w => w.date === today)
  const todayExercises = todayWorkouts.reduce((s, w) => s + w.exerciseCount, 0)

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const dayWorkouts = workouts.filter(w => w.date === key)
    return {
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayWorkouts.reduce((s, w) => s + w.exerciseCount, 0),
      volume: dayWorkouts.reduce((s, w) => s + w.totalVolume, 0),
    }
  })

  // Streak
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (workouts.some(w => w.date === key)) streak++; else break
  }

  // Favorite exercise
  const exCounts = {}
  workouts.slice(0, 60).forEach(w => w.exercises?.forEach(e => {
    exCounts[e.name] = (exCounts[e.name] || 0) + 1
  }))
  const fav = Object.entries(exCounts).sort((a, b) => b[1] - a[1])[0]

  const commentary = todayExercises >= 6 ? "Beast mode. Your body is adapting — keep this up."
    : todayExercises >= 3 ? "Solid session. Consistency beats intensity."
    : todayExercises >= 1 ? "Good start. Even 10 minutes moves the needle."
    : streak > 0 ? "You haven't trained today yet. Don't break the streak."
    : "No workout logged yet. Your future self will thank you."

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Today" value={todayExercises || '0'} color={todayExercises >= 3 ? C.green : C.muted} />
          <Stat label="Streak" value={`${streak}d`} color={streak > 0 ? C.gold : C.muted} />
          <Stat label="Fav" value={fav ? fav[0].split(' ')[0] : '—'} color={C.orange} small />
        </div>

        {/* Maya says */}
        <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, borderLeft: `3px solid ${C.orange}`, marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
          {commentary}
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['log', 'history'].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              flex: 1, padding: '10px', background: view === t ? C.orange + '22' : C.surface,
              border: `1px solid ${view === t ? C.orange : C.border}`, borderRadius: 10,
              color: view === t ? C.orange : C.muted, fontSize: 11, fontFamily: C.mono,
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        {view === 'log' && (
          <>
            {/* Current session */}
            {sessionExercises.length > 0 && (
              <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.orange}44`, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Current session ({sessionExercises.length} exercises)
                </div>
                {sessionExercises.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: i < sessionExercises.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 12 }}>{e.icon} {e.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{e.sets}×{e.reps} {e.unit}</span>
                      <button onClick={() => removeFromSession(i)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
                    </div>
                  </div>
                ))}
                <button onClick={finishSession} style={{
                  width: '100%', padding: 12, marginTop: 10,
                  background: C.orange, color: C.bg, border: 'none', borderRadius: 10,
                  fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
                }}>Finish Workout</button>
              </div>
            )}

            {/* Exercise picker */}
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Pick an exercise</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => selectPreset(p)} style={{
                  padding: '12px 8px', background: selected?.id === p.id ? C.orange + '22' : C.surface,
                  border: `1px solid ${selected?.id === p.id ? C.orange : C.border}`, borderRadius: 10,
                  color: C.text, fontFamily: C.mono, cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22 }}>{p.icon}</div>
                  <div style={{ fontSize: 9, color: selected?.id === p.id ? C.orange : C.muted, marginTop: 4 }}>{p.name}</div>
                </button>
              ))}
            </div>

            {/* Sets/Reps config */}
            {selected && (
              <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginBottom: 10 }}>
                  {selected.icon} {selected.name}
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {selected.unit !== 'min' && selected.unit !== 'sec' && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Sets</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setSets(Math.max(1, sets - 1))} style={stepBtn}>−</button>
                        <span style={{ fontSize: 18, fontWeight: 700, color: C.orange, minWidth: 30, textAlign: 'center' }}>{sets}</span>
                        <button onClick={() => setSets(sets + 1)} style={stepBtn}>+</button>
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                      {selected.unit === 'min' ? 'Minutes' : selected.unit === 'sec' ? 'Seconds' : 'Reps'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setReps(Math.max(1, reps - (selected.unit === 'sec' ? 5 : 1)))} style={stepBtn}>−</button>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.orange, minWidth: 30, textAlign: 'center' }}>{reps}</span>
                      <button onClick={() => setReps(reps + (selected.unit === 'sec' ? 5 : 1))} style={stepBtn}>+</button>
                    </div>
                  </div>
                </div>
                <button onClick={addToSession} style={{
                  width: '100%', padding: 12, background: C.orange + '22',
                  border: `1px solid ${C.orange}`, borderRadius: 10,
                  color: C.orange, fontSize: 12, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
                }}>Add to Session</button>
              </div>
            )}
          </>
        )}

        {view === 'history' && (
          <>
            {/* Weekly chart */}
            <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>This week</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 6 }}>
                {last7.map((d, i) => {
                  const maxCount = Math.max(...last7.map(x => x.count), 1)
                  const h = Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 0)
                  const isToday = d.date === today
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 9, color: C.muted }}>{d.count || ''}</div>
                      <div style={{
                        width: '100%', height: `${h}%`, minHeight: d.count > 0 ? 4 : 0,
                        background: d.count > 0 ? C.orange : 'transparent', borderRadius: 3,
                        border: isToday ? `1px solid ${C.teal}` : 'none',
                      }} />
                      <div style={{ fontSize: 8, color: isToday ? C.teal : C.dim }}>{d.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* History list */}
            {workouts.length > 0 && (
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Past sessions</div>
            )}
            {workouts.slice(0, 20).map(w => (
              <div key={w.id} style={{
                padding: 12, background: C.surface, borderRadius: 10,
                border: `1px solid ${C.border}`, marginBottom: 8,
                borderLeft: `3px solid ${C.orange}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{w.exerciseCount} exercises</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{w.date}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {w.exercises?.map((e, i) => (
                    <span key={i} style={{
                      padding: '3px 8px', background: C.surfaceLight, borderRadius: 6,
                      fontSize: 10, color: C.muted,
                    }}>{e.icon} {e.sets}×{e.reps}</span>
                  ))}
                </div>
              </div>
            ))}
            {workouts.length === 0 && (
              <div style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 32 }}>
                No workouts yet. Start your first session above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color, small }) {
  return (
    <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.orange, letterSpacing: 2 }}>WORKOUT</div>
    </div>
  )
}

const stepBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: C.surfaceLight, border: `1px solid ${C.border}`,
  color: C.text, fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: C.mono,
}
