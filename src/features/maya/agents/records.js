/**
 * Personal Records — Vasco's all-time bests.
 * Derived from existing localStorage data.
 */

import { loadHistory } from './lessonAnalyst'
import { loadMemory } from './memory'

function loadDayLog() {
  try {
    const log = JSON.parse(localStorage.getItem('maya_state') || '{}').dayLog
    return Array.isArray(log) ? log : []
  } catch { return [] }
}
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem('maya_profile') || '{}')
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {}
  } catch { return {} }
}

function getRecords() {
  const lessons = loadHistory()
  const memory = loadMemory()
  const profile = loadProfile()
  const dayLog = loadDayLog()

  const records = []

  // Longest streak
  records.push({
    icon: '🔥', label: 'Longest streak',
    value: `${profile.longestStreak || 0} days`,
    detail: profile.currentStreak > 0 ? `Current: ${profile.currentStreak}d` : 'Streak not active',
  })

  // Highest combo
  const gamState = (() => {
    try {
      const g = JSON.parse(localStorage.getItem('maya_state') || '{}').gamification
      return g && typeof g === 'object' && !Array.isArray(g) ? g : {}
    } catch { return {} }
  })()
  records.push({
    icon: '⚡', label: 'Highest combo',
    value: `${gamState.combo || 0}×`,
    detail: 'Consecutive task completions',
  })

  // Most XP in a day
  const xpByDay = {}
  dayLog.forEach(e => {
    if (e.xp) {
      const d = (e.time || '').slice(0, 10)
      xpByDay[d] = (xpByDay[d] || 0) + e.xp
    }
  })
  lessons.forEach(l => {
    if (l.xpEarned) {
      const d = (l.startedAt || '').slice(0, 10)
      xpByDay[d] = (xpByDay[d] || 0) + l.xpEarned
    }
  })
  const bestXPDay = Object.entries(xpByDay).sort((a, b) => b[1] - a[1])[0]
  records.push({
    icon: '💰', label: 'Most XP in a day',
    value: bestXPDay ? `${bestXPDay[1]} XP` : '0 XP',
    detail: bestXPDay ? bestXPDay[0] : 'No data yet',
  })

  // Longest lesson
  const longestLesson = [...lessons].sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0))[0]
  records.push({
    icon: '🎙', label: 'Longest lesson',
    value: longestLesson ? `${longestLesson.durationMin}m` : '0m',
    detail: longestLesson ? longestLesson.subject : 'No lessons yet',
  })

  // Total lessons
  records.push({
    icon: '📚', label: 'Total lessons',
    value: `${lessons.length}`,
    detail: `${Math.round(lessons.reduce((s, l) => s + (l.durationMin || 0), 0) / 60 * 10) / 10} hours`,
  })

  // Total concepts learned
  const concepts = memory.concepts || []
  records.push({
    icon: '🧠', label: 'Concepts learned',
    value: `${concepts.length}`,
    detail: `${concepts.filter(c => c.box === 4).length} mastered`,
  })

  // Best quiz score
  const quizScores = lessons.filter(l => l.grading?.overallScore).map(l => l.grading.overallScore)
  const bestQuiz = quizScores.length ? Math.max(...quizScores) : null
  records.push({
    icon: '🏆', label: 'Best quiz score',
    value: bestQuiz !== null ? `${bestQuiz}/100` : '—',
    detail: bestQuiz !== null ? 'From lesson quiz' : 'Take a quiz first',
  })

  // Total XP
  records.push({
    icon: '⭐', label: 'Total XP',
    value: `${gamState.totalXP || 0}`,
    detail: `Level ${gamState.level?.level || 1}: ${gamState.level?.title || 'Rookie'}`,
  })

  return records
}

export { getRecords }
