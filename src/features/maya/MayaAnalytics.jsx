/**
 * Performance Analytics — deep cross-domain trends.
 * Activity heatmap, category breakdown, peak hours, improvement velocity.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMoods } from './lib/moods'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', glassBorder: 'rgba(255,255,255,0.14)',
  text: '#f0f0f5', muted: '#6b6b8a', dim: '#3a3a55',
  teal: '#2DD4BF', gold: '#FFD700', amber: '#FBBF24',
  green: '#34D399', red: '#F87171', blue: '#93C5FD',
  purple: '#A78BFA', pink: '#F472B6', orange: '#FB923C',
  glass: 'rgba(255,255,255,0.08)', blur: 'blur(20px)',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export default function MayaAnalytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState(30) // 7, 30, 90

  const data = useMemo(() => {
    const state = loadLS('maya_state') || {}
    const sleep = loadLS('maya_sleep') || []
    const water = loadLS('maya_water') || {}
    const workouts = loadLS('maya_workouts') || []
    const moods = loadMoods()
    const comps = loadLS('maya_competitions') || []
    const preps = loadLS('maya_prep_plans') || []
    const habits = loadLS('maya_habits') || {}
    const intel = loadLS('maya_intelligence') || {}
    const profile = loadLS('maya_profile') || {}

    return { state, sleep, water, workouts, moods, comps, preps, habits, intel, profile }
  }, [])

  const today = new Date()

  // ─── Activity Heatmap (last N days) ───
  const heatmap = useMemo(() => {
    const days = []
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      let score = 0

      // Sleep logged
      if (data.sleep.some(s => s.date === key)) score += 1
      // Water logged
      if ((data.water[key] || 0) > 0) score += 1
      // Workout logged
      if (data.workouts.some(w => w.date === key)) score += 1
      // Mood logged
      if (data.moods.some(m => m.date === key)) score += 1
      // Prep plan activity
      const prepActive = (loadLS('maya_prep_plans') || []).some(p => (p.log?.[key] || 0) > 0)
      if (prepActive) score += 1

      days.push({ date: key, day: d.getDate(), dow: d.getDay(), score })
    }
    return days
  }, [period, data])

  // ─── Category breakdown ───
  const categories = useMemo(() => {
    const cats = []
    const sleepDays = data.sleep.filter(s => {
      const d = new Date(s.date)
      return (today - d) / 86400000 <= period
    }).length
    const waterDays = Object.entries(data.water).filter(([k, v]) => {
      return v > 0 && (today - new Date(k)) / 86400000 <= period
    }).length
    const workoutDays = new Set(data.workouts.filter(w => {
      return (today - new Date(w.date)) / 86400000 <= period
    }).map(w => w.date)).size
    const moodDays = data.moods.filter(m => {
      return (today - new Date(m.date)) / 86400000 <= period
    }).length

    cats.push({ name: 'Sleep', icon: '😴', days: sleepDays, color: C.purple, target: period })
    cats.push({ name: 'Water', icon: '💧', days: waterDays, color: C.blue, target: period })
    cats.push({ name: 'Workout', icon: '🏋️', days: workoutDays, color: C.orange, target: Math.round(period * 5 / 7) })
    cats.push({ name: 'Mood', icon: '💜', days: moodDays, color: C.pink, target: period })

    return cats
  }, [period, data])

  // ─── Competition stats ───
  const compStats = useMemo(() => {
    const all = data.comps
    const medals = all.filter(c => ['gold', 'silver', 'bronze'].includes(c.result))
    const byYear = {}
    all.forEach(c => {
      const yr = c.date?.slice(0, 4)
      if (yr) { byYear[yr] = (byYear[yr] || 0) + 1 }
    })
    const byCat = {}
    all.forEach(c => { byCat[c.category] = (byCat[c.category] || 0) + 1 })

    return { total: all.length, medals: medals.length, byYear, byCat }
  }, [data.comps])

  // ─── Streak ───
  const streak = data.profile?.currentStreak || 0
  const longestStreak = data.profile?.longestStreak || 0

  // ─── Sleep average ───
  const recentSleep = data.sleep.filter(s => (today - new Date(s.date)) / 86400000 <= period)
  const avgSleep = recentSleep.length ? Math.round(recentSleep.reduce((s, l) => s + l.hours, 0) / recentSleep.length * 10) / 10 : 0

  // ─── Overall consistency score ───
  const activeDays = heatmap.filter(d => d.score >= 2).length
  const consistencyPct = Math.round((activeDays / period) * 100)

  const commentary = consistencyPct >= 80 ? "Elite consistency. This is what compound growth looks like."
    : consistencyPct >= 60 ? "Good baseline. The gaps are where your competitors gain ground."
    : consistencyPct >= 40 ? "Inconsistent. The talent's there — the system isn't. Fix the routine."
    : "Too many empty days. Talent without consistency is just potential."

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: C.mono, paddingBottom: 80, position: 'relative' }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[7, 30, 90].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: 10,
              background: period === p ? C.teal + '15' : C.surface,
              border: `1px solid ${period === p ? C.teal : C.border}`, borderRadius: 10,
              color: period === p ? C.teal : C.muted, fontSize: 11, fontFamily: C.mono, cursor: 'pointer',
            }}>{p}d</button>
          ))}
        </div>

        {/* Consistency score */}
        <div style={{
          textAlign: 'center', padding: 20,
          background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
          borderRadius: 20, border: `1px solid ${C.glassBorder}`, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Consistency score</div>
          <div style={{ fontFamily: C.display, fontSize: 64, color: consistencyPct >= 80 ? C.green : consistencyPct >= 60 ? C.teal : consistencyPct >= 40 ? C.amber : C.red, lineHeight: 1, marginTop: 8 }}>
            {consistencyPct}%
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{activeDays} active days out of {period}</div>
        </div>

        {/* Maya says */}
        <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, borderLeft: `3px solid ${C.teal}`, marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
          {commentary}
        </div>

        {/* Activity Heatmap */}
        <div style={{
          padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
          borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Activity heatmap — last {period} days
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {heatmap.map((d, i) => {
              const intensity = d.score === 0 ? 0 : d.score <= 1 ? 0.2 : d.score <= 2 ? 0.4 : d.score <= 3 ? 0.65 : 0.9
              return (
                <div key={i} title={`${d.date}: ${d.score} activities`} style={{
                  width: period <= 30 ? 14 : period <= 90 ? 10 : 8,
                  height: period <= 30 ? 14 : period <= 90 ? 10 : 8,
                  borderRadius: 3,
                  background: d.score === 0 ? 'rgba(255,255,255,0.04)' : `rgba(45,212,191,${intensity})`,
                }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: C.dim }}>Less</span>
            {[0, 0.2, 0.4, 0.65, 0.9].map((o, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: o === 0 ? 'rgba(255,255,255,0.04)' : `rgba(45,212,191,${o})` }} />
            ))}
            <span style={{ fontSize: 8, color: C.dim }}>More</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{
          padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
          borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Tracking consistency
          </div>
          {categories.map(cat => {
            const pct = Math.round((cat.days / cat.target) * 100)
            return (
              <div key={cat.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>{cat.icon} {cat.name}</span>
                  <span style={{ color: pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red }}>{cat.days}/{cat.target}d ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: cat.color, borderRadius: 3, transition: 'width 400ms' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <MetricCard icon="🔥" label="Current streak" value={`${streak}d`} color={streak >= 7 ? C.gold : C.muted} />
          <MetricCard icon="🏆" label="Longest streak" value={`${longestStreak}d`} color={C.amber} />
          <MetricCard icon="😴" label="Avg sleep" value={avgSleep ? `${avgSleep}h` : '—'} color={avgSleep >= 8 ? C.green : avgSleep >= 7 ? C.amber : C.red} />
          <MetricCard icon="🥇" label="Medals" value={compStats.medals} color={C.gold} />
        </div>

        {/* Competition history by year */}
        {Object.keys(compStats.byYear).length > 0 && (
          <div style={{
            padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
            borderRadius: 14, border: `1px solid ${C.glassBorder}`,
          }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Competitions by year
            </div>
            {Object.entries(compStats.byYear).sort((a, b) => b[0].localeCompare(a[0])).map(([year, count]) => (
              <div key={year} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: C.muted }}>{year}</span>
                <span style={{ color: C.gold, fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div style={{
      padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
      borderRadius: 14, border: `1px solid ${C.glassBorder}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.glassBorder}`,
      background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>ANALYTICS</div>
    </div>
  )
}
