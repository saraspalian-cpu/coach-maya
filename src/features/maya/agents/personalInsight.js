/**
 * Personal Insight Agent
 * Picks ONE most-relevant insight to surface in the dashboard "For You" card.
 *
 * Returns: { headline, sub, icon, action, color, kind }
 *   kind: 'pattern' | 'streak' | 'comp' | 'mood' | 'rate' | 'wins'
 *   color: hex string
 */

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

function getPersonalInsight({ profile = {}, gamification = {} } = {}) {
  const today = todayStr()
  const sevenAgo = daysAgo(7)
  const state = loadLS('maya_state') || {}
  const dayLog = Array.isArray(state.dayLog) ? state.dayLog : []
  const moods = loadLS('maya_moods') || []
  const comps = loadLS('maya_competitions') || []

  // ── 1. Imminent competition (highest priority) ──
  const upcoming = comps
    .filter(c => c?.date && c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const nextComp = upcoming[0]
  if (nextComp) {
    const daysOut = Math.ceil((new Date(nextComp.date) - new Date(today)) / 86400000)
    if (daysOut === 0) {
      return {
        headline: `${nextComp.name} — TODAY`,
        sub: 'Trust the prep. Go perform.',
        icon: '🏆', action: '/competitions', color: '#FFD700', kind: 'comp',
      }
    }
    if (daysOut <= 7) {
      return {
        headline: `${nextComp.name} in ${daysOut}d`,
        sub: 'Sharpen up. Every session matters.',
        icon: '🎯', action: '/prep', color: '#F87171', kind: 'comp',
      }
    }
  }

  // ── 2. Mood pattern: 3+ tired in a row ──
  const recentMoods = moods.slice(-5)
  if (recentMoods.length >= 3) {
    const last3 = recentMoods.slice(-3).map(m => m.mood)
    if (last3.every(m => m === 'Tired')) {
      return {
        headline: 'Three tired days in a row',
        sub: 'Sleep audit. The streak isn\'t worth burnout.',
        icon: '😴', action: '/sleep', color: '#A78BFA', kind: 'mood',
      }
    }
    if (last3.every(m => m === 'Frustrated')) {
      return {
        headline: 'Frustration is stacking',
        sub: 'Pick one easy task. Reset the rhythm.',
        icon: '🔄', action: '/', color: '#FBBF24', kind: 'mood',
      }
    }
  }

  // ── 3. Skip pattern by task type ──
  const sevenDayEvents = dayLog.filter(e => (e.time || '').slice(0, 10) >= sevenAgo)
  const skipsByType = {}
  for (const e of sevenDayEvents) {
    if (e.type === 'task_skip' && e.taskType) {
      skipsByType[e.taskType] = (skipsByType[e.taskType] || 0) + 1
    }
  }
  const worstSkip = Object.entries(skipsByType).sort((a, b) => b[1] - a[1])[0]
  if (worstSkip && worstSkip[1] >= 3) {
    return {
      headline: `${capitalize(worstSkip[0])} skipped ${worstSkip[1]}× this week`,
      sub: 'Pattern Maya sees. What\'s the fix?',
      icon: '⚠️', action: '/insights', color: '#F87171', kind: 'pattern',
    }
  }

  // ── 4. Strong streak ──
  const streak = profile.currentStreak || 0
  if (streak >= 14) {
    return {
      headline: `Day ${streak} streak`,
      sub: streak >= 30 ? 'Identity-level discipline.' : 'You\'re building a different version of yourself.',
      icon: '🔥', action: '/insights', color: '#FFD700', kind: 'streak',
    }
  }

  // ── 5. Perfect category this week ──
  const completesByType = {}
  const skipsTotal = sevenDayEvents.filter(e => e.type === 'task_skip').length
  for (const e of sevenDayEvents) {
    if (e.type === 'task_complete' && e.taskType) {
      completesByType[e.taskType] = (completesByType[e.taskType] || 0) + 1
    }
  }
  const bestType = Object.entries(completesByType).sort((a, b) => b[1] - a[1])[0]
  if (bestType && bestType[1] >= 5 && (skipsByType[bestType[0]] || 0) === 0) {
    return {
      headline: `${capitalize(bestType[0])}: ${bestType[1]}/${bestType[1]} this week`,
      sub: 'Zero misses. Bank that confidence.',
      icon: '✅', action: '/insights', color: '#34D399', kind: 'wins',
    }
  }

  // ── 6. 7-day finish rate ──
  const done = sevenDayEvents.filter(e => e.type === 'task_complete').length
  if (done + skipsTotal >= 5) {
    const pct = Math.round((done / (done + skipsTotal)) * 100)
    if (pct >= 90) {
      return {
        headline: `${pct}% finish rate this week`,
        sub: 'Olympiad-level consistency. Don\'t let up.',
        icon: '📈', action: '/insights', color: '#34D399', kind: 'rate',
      }
    }
    if (pct < 60) {
      return {
        headline: `${pct}% finish rate this week`,
        sub: `${skipsTotal} skips. Diagnose: too many tasks, or wrong tasks?`,
        icon: '📉', action: '/insights', color: '#FBBF24', kind: 'rate',
      }
    }
  }

  // ── 7. Mood not logged today ──
  const todayMood = moods.find(m => m.date === today)
  if (!todayMood) {
    return {
      headline: 'Mood check-in?',
      sub: 'Takes 5 seconds. Helps Maya read the room.',
      icon: '🎭', action: '/moods', color: '#A78BFA', kind: 'mood',
    }
  }

  // ── 8. Default — gentle level nudge ──
  const level = gamification?.level?.level || 1
  return {
    headline: `Level ${level}`,
    sub: 'Steady progress. Pick the next task.',
    icon: '⚡', action: '/', color: '#2DD4BF', kind: 'rate',
  }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

export { getPersonalInsight }
