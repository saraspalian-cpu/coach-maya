/**
 * Mood Board — mood history, trends, patterns.
 * Reads from maya_moods localStorage (written by mood picker on dashboard).
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', pink: '#F472B6',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  red: '#EF4444', blue: '#7db8e8', purple: '#A78BFA',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const MOOD_KEY = 'maya_moods'

const MOOD_CONFIG = {
  'Fired up':    { emoji: '🔥', color: C.gold,   score: 5 },
  'Good':        { emoji: '😊', color: C.green,  score: 4 },
  'Meh':         { emoji: '😐', color: C.amber,  score: 3 },
  'Frustrated':  { emoji: '😤', color: C.red,    score: 2 },
  'Tired':       { emoji: '😴', color: C.purple, score: 1 },
}

export function loadMoods() {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY)) || [] } catch { return [] }
}
export function saveMood(mood) {
  try {
    const moods = loadMoods()
    const today = new Date().toISOString().slice(0, 10)
    // Only one mood per day — replace if exists
    const filtered = moods.filter(m => m.date !== today)
    filtered.unshift({ mood, date: today, time: new Date().toISOString() })
    localStorage.setItem(MOOD_KEY, JSON.stringify(filtered.slice(0, 365)))
  } catch {}
}

export default function MayaMoodBoard() {
  const navigate = useNavigate()
  const moods = useMemo(() => loadMoods(), [])

  const today = new Date().toISOString().slice(0, 10)
  const todayMood = moods.find(m => m.date === today)

  // Last 30 days
  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i))
      const key = d.toISOString().slice(0, 10)
      const entry = moods.find(m => m.date === key)
      return {
        date: key,
        day: d.getDate(),
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
        mood: entry?.mood || null,
      }
    })
  }, [moods])

  // Last 7 days for trend
  const last7 = last30.slice(-7)

  // Stats
  const moodCounts = {}
  moods.slice(0, 90).forEach(m => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
  })
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
  const totalLogged = moods.length

  // Average score (last 14 days)
  const recentMoods = moods.slice(0, 14).filter(m => MOOD_CONFIG[m.mood])
  const avgScore = recentMoods.length
    ? Math.round(recentMoods.reduce((s, m) => s + MOOD_CONFIG[m.mood].score, 0) / recentMoods.length * 10) / 10
    : 0

  // Streak of logged moods
  let logStreak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (moods.some(m => m.date === key)) logStreak++; else break
  }

  // Day-of-week pattern
  const dowScores = {}
  const dowCounts = {}
  moods.forEach(m => {
    if (!MOOD_CONFIG[m.mood]) return
    const d = new Date(m.date)
    const dow = d.toLocaleDateString('en-US', { weekday: 'short' })
    dowScores[dow] = (dowScores[dow] || 0) + MOOD_CONFIG[m.mood].score
    dowCounts[dow] = (dowCounts[dow] || 0) + 1
  })
  const dowAvg = {}
  Object.keys(dowScores).forEach(d => {
    dowAvg[d] = Math.round(dowScores[d] / dowCounts[d] * 10) / 10
  })
  const bestDay = Object.entries(dowAvg).sort((a, b) => b[1] - a[1])[0]
  const worstDay = Object.entries(dowAvg).sort((a, b) => a[1] - b[1])[0]

  const commentary = avgScore >= 4.5 ? "You've been on fire lately. Momentum is real."
    : avgScore >= 3.5 ? "Mostly good vibes. Your consistency is building."
    : avgScore >= 2.5 ? "Mixed bag recently. That's normal — but let's tip the scale."
    : avgScore >= 1.5 ? "Rough stretch. Talk to someone you trust. Maya's here too."
    : totalLogged === 0 ? "No moods logged yet. Start checking in daily — patterns emerge fast."
    : "Track more days to see the picture."

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Today's mood */}
        {todayMood && (
          <div style={{
            textAlign: 'center', padding: 20, background: C.surface,
            borderRadius: 16, border: `1px solid ${MOOD_CONFIG[todayMood.mood]?.color || C.border}44`,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 48 }}>{MOOD_CONFIG[todayMood.mood]?.emoji || '❓'}</div>
            <div style={{ fontSize: 14, color: MOOD_CONFIG[todayMood.mood]?.color || C.text, fontWeight: 600, marginTop: 8 }}>
              {todayMood.mood}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Today's mood</div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <StatBox label="Avg" value={avgScore || '—'} color={avgScore >= 4 ? C.green : avgScore >= 3 ? C.amber : C.red} />
          <StatBox label="Streak" value={`${logStreak}d`} color={logStreak > 0 ? C.gold : C.muted} />
          <StatBox label="Top mood" value={topMood ? MOOD_CONFIG[topMood[0]]?.emoji || '—' : '—'} color={C.pink} />
        </div>

        {/* Maya commentary */}
        <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, borderLeft: `3px solid ${C.pink}`, marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
          {commentary}
        </div>

        {/* 7-day trend */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Last 7 days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 8 }}>
            {last7.map((d, i) => {
              const cfg = MOOD_CONFIG[d.mood]
              const h = cfg ? (cfg.score / 5) * 100 : 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 16 }}>{cfg?.emoji || '·'}</div>
                  <div style={{
                    width: '100%', height: `${h}%`, minHeight: cfg ? 6 : 0,
                    background: cfg?.color || 'transparent', borderRadius: 4, opacity: 0.7,
                  }} />
                  <div style={{ fontSize: 8, color: d.date === today ? C.teal : C.dim }}>{d.dow}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 30-day calendar grid */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Last 30 days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {last30.map((d, i) => {
              const cfg = MOOD_CONFIG[d.mood]
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 6,
                  background: cfg ? cfg.color + '33' : C.surfaceLight,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: d.date === today ? `1px solid ${C.teal}` : `1px solid transparent`,
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 12 }}>{cfg?.emoji || ''}</div>
                  <div style={{ fontSize: 7, color: C.dim, position: 'absolute', bottom: 1 }}>{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day-of-week pattern */}
        {Object.keys(dowAvg).length >= 3 && (
          <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Patterns</div>
            {bestDay && (
              <div style={{ fontSize: 12, color: C.green, marginBottom: 4 }}>
                Best day: {bestDay[0]} (avg {bestDay[1]}/5)
              </div>
            )}
            {worstDay && (
              <div style={{ fontSize: 12, color: C.red }}>
                Hardest day: {worstDay[0]} (avg {worstDay[1]}/5)
              </div>
            )}
          </div>
        )}

        {/* Mood distribution */}
        {totalLogged > 0 && (
          <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Distribution</div>
            {Object.entries(MOOD_CONFIG).map(([name, cfg]) => {
              const count = moodCounts[name] || 0
              const pct = totalLogged > 0 ? Math.round((count / totalLogged) * 100) : 0
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{cfg.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: C.dim, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 4 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: C.muted, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.pink, letterSpacing: 2 }}>MOOD BOARD</div>
    </div>
  )
}
