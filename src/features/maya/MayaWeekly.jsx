/**
 * Weekly Report Card — aggregates the week's data into one view.
 * Pulls from: gamification, sleep, water, moods, workouts, intelligence.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import { loadMoods } from './MayaMoodBoard'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', gold: '#FFD700',
  green: '#22C55E', red: '#EF4444', amber: '#FFA500',
  blue: '#7db8e8', purple: '#A78BFA', pink: '#F472B6',
  orange: '#FF6B35',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const MOOD_SCORES = { 'Fired up': 5, 'Good': 4, 'Meh': 3, 'Frustrated': 2, 'Tired': 1 }
const MOOD_EMOJI = { 'Fired up': '🔥', 'Good': '😊', 'Meh': '😐', 'Frustrated': '😤', 'Tired': '😴' }

function getWeekDates() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export default function MayaWeekly() {
  const navigate = useNavigate()
  const maya = useMaya()
  const weekDates = useMemo(() => getWeekDates(), [])
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  // ─── Sleep data ───
  const sleepData = useMemo(() => {
    const logs = loadLS('maya_sleep') || []
    const weekLogs = logs.filter(l => weekDates.includes(l.date))
    const avg = weekLogs.length ? Math.round(weekLogs.reduce((s, l) => s + l.hours, 0) / weekLogs.length * 10) / 10 : 0
    const met9h = weekLogs.filter(l => l.hours >= 9).length
    return { logs: weekLogs, avg, daysLogged: weekLogs.length, met9h }
  }, [weekDates])

  // ─── Water data ───
  const waterData = useMemo(() => {
    const data = loadLS('maya_water') || {}
    let total = 0, daysHit = 0, daysLogged = 0
    weekDates.forEach(d => {
      const count = data[d] || 0
      if (count > 0) daysLogged++
      total += count
      if (count >= 8) daysHit++
    })
    return { total, daysHit, daysLogged, avg: daysLogged > 0 ? Math.round(total / daysLogged * 10) / 10 : 0 }
  }, [weekDates])

  // ─── Mood data ───
  const moodData = useMemo(() => {
    const moods = loadMoods()
    const weekMoods = moods.filter(m => weekDates.includes(m.date))
    const scores = weekMoods.map(m => MOOD_SCORES[m.mood] || 3)
    const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10 : 0
    return { entries: weekMoods, avg, daysLogged: weekMoods.length }
  }, [weekDates])

  // ─── Workout data ───
  const workoutData = useMemo(() => {
    const workouts = loadLS('maya_workouts') || []
    const weekWorkouts = workouts.filter(w => weekDates.includes(w.date))
    const totalExercises = weekWorkouts.reduce((s, w) => s + w.exerciseCount, 0)
    return { sessions: weekWorkouts.length, totalExercises, daysActive: new Set(weekWorkouts.map(w => w.date)).size }
  }, [weekDates])

  // ─── XP & gamification ───
  const gam = maya.gamification
  const profile = maya.profile

  // ─── Overall grade ───
  const scores = []
  if (sleepData.daysLogged > 0) scores.push(Math.min(sleepData.avg / 9, 1))
  if (waterData.daysLogged > 0) scores.push(Math.min(waterData.avg / 8, 1))
  if (moodData.daysLogged > 0) scores.push(moodData.avg / 5)
  if (workoutData.sessions > 0) scores.push(Math.min(workoutData.daysActive / 5, 1))
  // Task completion from streak
  if (profile?.currentStreak > 0) scores.push(Math.min(profile.currentStreak / 7, 1))

  const overallScore = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 100) : 0
  const overallGrade = overallScore >= 90 ? 'S' : overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : overallScore >= 50 ? 'C' : 'F'
  const gradeColors = { S: C.gold, A: C.green, B: C.blue, C: C.amber, F: C.red }

  const commentary = overallGrade === 'S' ? "This is what elite weeks look like. Don't get comfortable — sustain it."
    : overallGrade === 'A' ? "Strong week. You're building something. Push the weak spots."
    : overallGrade === 'B' ? "Decent week but inconsistent. Pick one area and lock it in next week."
    : overallGrade === 'C' ? "Below your potential. You know it. I know it. Reset and attack next week."
    : scores.length === 0 ? "No data this week. Start tracking and the picture will come together."
    : "Rough week. Doesn't define you. What matters is what you do next."

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Week range */}
        <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, marginBottom: 16 }}>
          {weekStart} → {weekEnd}
        </div>

        {/* Overall grade — big */}
        <div style={{
          textAlign: 'center', padding: 24, background: C.surface,
          borderRadius: 20, border: `2px solid ${gradeColors[overallGrade]}44`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly grade</div>
          <div style={{
            fontFamily: C.display, fontSize: 80, lineHeight: 1,
            color: gradeColors[overallGrade], marginTop: 8,
          }}>{overallGrade}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{overallScore}/100</div>
        </div>

        {/* Maya commentary */}
        <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, borderLeft: `3px solid ${C.teal}`, marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
          {commentary}
        </div>

        {/* Category cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <CategoryCard
            icon="😴" title="Sleep" color={C.purple}
            main={sleepData.avg ? `${sleepData.avg}h avg` : 'No data'}
            sub={sleepData.daysLogged > 0 ? `${sleepData.met9h}/7 days at 9h+` : 'Not tracked'}
            score={sleepData.avg >= 9 ? 'A' : sleepData.avg >= 8 ? 'B' : sleepData.avg >= 7 ? 'C' : sleepData.daysLogged > 0 ? 'F' : '—'}
            onClick={() => navigate('/sleep')}
          />
          <CategoryCard
            icon="💧" title="Water" color={C.blue}
            main={waterData.avg ? `${waterData.avg} avg` : 'No data'}
            sub={waterData.daysLogged > 0 ? `${waterData.daysHit}/7 days at 8+` : 'Not tracked'}
            score={waterData.daysHit >= 6 ? 'A' : waterData.daysHit >= 4 ? 'B' : waterData.daysHit >= 2 ? 'C' : waterData.daysLogged > 0 ? 'F' : '—'}
            onClick={() => navigate('/water')}
          />
          <CategoryCard
            icon="🏋️" title="Workout" color={C.orange}
            main={workoutData.sessions > 0 ? `${workoutData.sessions} sessions` : 'No data'}
            sub={workoutData.daysActive > 0 ? `${workoutData.daysActive} active days` : 'Not tracked'}
            score={workoutData.daysActive >= 5 ? 'A' : workoutData.daysActive >= 3 ? 'B' : workoutData.daysActive >= 1 ? 'C' : '—'}
            onClick={() => navigate('/workout')}
          />
          <CategoryCard
            icon="🧠" title="Mood" color={C.pink}
            main={moodData.avg ? `${moodData.avg}/5 avg` : 'No data'}
            sub={moodData.daysLogged > 0 ? `${moodData.daysLogged} days logged` : 'Not tracked'}
            score={moodData.avg >= 4 ? 'A' : moodData.avg >= 3 ? 'B' : moodData.avg >= 2 ? 'C' : moodData.daysLogged > 0 ? 'F' : '—'}
            onClick={() => navigate('/moods')}
          />
        </div>

        {/* Gamification summary */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <MiniStat label="XP" value={gam.totalXP || 0} color={C.teal} />
            <MiniStat label="Level" value={gam.level?.level || 1} color={C.gold} />
            <MiniStat label="Streak" value={`${profile?.currentStreak || 0}d`} color={C.amber} />
            <MiniStat label="Best combo" value={`${gam.bestCombo || 0}×`} color={C.purple} />
          </div>
        </div>

        {/* Day-by-day breakdown */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Day by day</div>
          {weekDates.map((date, i) => {
            const d = new Date(date + 'T12:00:00')
            const label = d.toLocaleDateString('en-US', { weekday: 'short' })
            const isToday = date === new Date().toISOString().slice(0, 10)
            const isFuture = date > new Date().toISOString().slice(0, 10)
            const sleepLog = (loadLS('maya_sleep') || []).find(l => l.date === date)
            const waterCount = (loadLS('maya_water') || {})[date] || 0
            const moodEntry = loadMoods().find(m => m.date === date)
            const workoutLog = (loadLS('maya_workouts') || []).find(w => w.date === date)

            return (
              <div key={date} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < 6 ? `1px solid ${C.border}` : 'none',
                opacity: isFuture ? 0.3 : 1,
              }}>
                <div style={{
                  width: 36, fontSize: 11, fontWeight: isToday ? 700 : 400,
                  color: isToday ? C.teal : C.muted,
                }}>{label}</div>
                <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                  {sleepLog && <Pill icon="😴" text={`${sleepLog.hours}h`} color={sleepLog.hours >= 8 ? C.green : C.amber} />}
                  {waterCount > 0 && <Pill icon="💧" text={waterCount} color={waterCount >= 8 ? C.blue : C.dim} />}
                  {moodEntry && <Pill icon={MOOD_EMOJI[moodEntry.mood] || '❓'} text="" color={C.pink} />}
                  {workoutLog && <Pill icon="🏋️" text={workoutLog.exerciseCount} color={C.orange} />}
                  {!sleepLog && !waterCount && !moodEntry && !workoutLog && !isFuture && (
                    <span style={{ fontSize: 10, color: C.dim }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ icon, title, color, main, sub, score, onClick }) {
  const gradeColors = { S: C.gold, A: C.green, B: C.blue, C: C.amber, F: C.red, '—': C.dim }
  return (
    <div onClick={onClick} style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${color}33`, cursor: 'pointer',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20 }}>{icon}</div>
          <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 6 }}>{title}</div>
        </div>
        <div style={{
          fontSize: 18, fontWeight: 700, fontFamily: C.display,
          color: gradeColors[score] || C.dim, letterSpacing: 1,
        }}>{score}</div>
      </div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 6 }}>{main}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

function Pill({ icon, text, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 6px', background: color + '22', borderRadius: 6,
      fontSize: 10, color,
    }}>
      <span style={{ fontSize: 11 }}>{icon}</span>{text}
    </span>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>WEEKLY REPORT</div>
    </div>
  )
}
