/**
 * Insights Agent — derives weekly trends from raw activity data.
 * Pulls from lesson history + maya_state dayLog.
 */

import { loadHistory } from './lessonAnalyst'
import { loadMemory } from './memory'

function loadDayLog() {
  try {
    const state = JSON.parse(localStorage.getItem('maya_state') || '{}')
    return state.dayLog || []
  } catch { return [] }
}

function dateKey(d) { return new Date(d).toISOString().slice(0, 10) }
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function weeklyInsights() {
  const lessons = loadHistory()
  const memory = loadMemory()
  const dayLog = loadDayLog()

  // Build last 7 day buckets
  const days = []
  for (let i = 6; i >= 0; i--) {
    const key = daysAgo(i)
    days.push({
      date: key,
      label: new Date(key).toLocaleDateString('en-US', { weekday: 'short' }),
      xp: 0, tasks: 0, skips: 0, lessonMin: 0, lessonCount: 0,
    })
  }
  const dayMap = Object.fromEntries(days.map(d => [d.date, d]))

  // Aggregate lessons
  lessons.forEach(l => {
    const k = dateKey(l.startedAt)
    if (dayMap[k]) {
      dayMap[k].lessonCount += 1
      dayMap[k].lessonMin += l.durationMin || 0
      dayMap[k].xp += l.xpEarned || 0
    }
  })

  // Aggregate task completions
  dayLog.forEach(e => {
    const k = dateKey(e.time)
    if (!dayMap[k]) return
    if (e.type === 'task_complete') {
      dayMap[k].tasks += 1
      dayMap[k].xp += e.xp || 0
    } else if (e.type === 'task_skip') {
      dayMap[k].skips += 1
    }
  })

  // Subject totals
  const subjectXP = {}
  const subjectMin = {}
  lessons.forEach(l => {
    const s = l.subject || 'Other'
    subjectXP[s] = (subjectXP[s] || 0) + (l.xpEarned || 0)
    subjectMin[s] = (subjectMin[s] || 0) + (l.durationMin || 0)
  })

  // Memory mastery
  const concepts = memory.concepts || []
  const recentConcepts = concepts.filter(c => {
    const learned = new Date(c.learnedAt).getTime()
    return Date.now() - learned <= 7 * 24 * 3600 * 1000
  })

  const totalXP = days.reduce((s, d) => s + d.xp, 0)
  const totalMin = days.reduce((s, d) => s + d.lessonMin, 0)
  const totalTasks = days.reduce((s, d) => s + d.tasks, 0)
  const totalLessons = days.reduce((s, d) => s + d.lessonCount, 0)
  const bestDay = [...days].sort((a, b) => b.xp - a.xp)[0]

  // Streak: count consecutive days from today going backward with any activity
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if ((days[i].xp + days[i].tasks + days[i].lessonCount) > 0) streak++
    else break
  }

  return {
    days,
    totals: { xp: totalXP, min: totalMin, tasks: totalTasks, lessons: totalLessons },
    bestDay,
    streak,
    subjectXP,
    subjectMin,
    newConcepts: recentConcepts.length,
    masteredConcepts: concepts.filter(c => c.box === 4).length,
    totalConcepts: concepts.length,
  }
}

export { weeklyInsights }
