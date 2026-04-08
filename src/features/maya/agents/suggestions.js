/**
 * Smart Suggestions Engine
 * Looks at the live state and recommends what Vasco should do next.
 */

import { getMemoryStats } from './memory'
import { loadHistory } from './lessonAnalyst'

function getSuggestion({ tasks = [], gamification = {}, todayMood, profile }) {
  const hour = new Date().getHours()
  const completed = tasks.filter(t => t.completed)
  const remaining = tasks.filter(t => !t.completed && !t.skipped)
  const memStats = getMemoryStats()
  const today = new Date().toISOString().slice(0, 10)
  const todayLessons = loadHistory().filter(l => (l.startedAt || '').startsWith(today))

  // Priority order — return first matching
  const candidates = []

  // 1. Morning + nothing done → morning ritual
  if (hour < 11 && completed.length === 0 && tasks.length > 0) {
    candidates.push({
      title: 'Start with a morning ritual',
      sub: 'Set your one thing for the day',
      action: '/ritual?mode=morning',
      icon: '☀️',
      priority: 90,
    })
  }

  // 2. Combo at risk
  if (gamification.combo >= 3) {
    candidates.push({
      title: `Protect that ${gamification.combo}× combo`,
      sub: 'Knock out the next task',
      action: '/',
      icon: '🔥',
      priority: 85,
    })
  }

  // 3. Lessons due today and none done
  if (todayLessons.length === 0 && hour >= 9 && hour <= 18) {
    candidates.push({
      title: 'Sit through a lesson with me',
      sub: "I'll listen and quiz you after",
      action: '/lesson',
      icon: '🎙',
      priority: 80,
    })
  }

  // 4. Memory drill due
  if (memStats.dueToday > 0) {
    candidates.push({
      title: `${memStats.dueToday} concept${memStats.dueToday > 1 ? 's' : ''} due for review`,
      sub: 'Quick memory drill — 2 min',
      action: '/memory',
      icon: '🧠',
      priority: 75,
    })
  }

  // 5. Remaining tasks midday
  if (remaining.length > 0 && hour >= 12 && hour < 18) {
    candidates.push({
      title: `${remaining.length} task${remaining.length > 1 ? 's' : ''} left`,
      sub: `Next up: ${remaining[0].name}`,
      action: '/',
      icon: '🎯',
      priority: 70,
    })
  }

  // 6. Evening wrap
  if (hour >= 18 && hour < 23 && completed.length > 0) {
    candidates.push({
      title: 'Time to wrap the day',
      sub: 'Reflect + reveal your grade',
      action: '/ritual?mode=evening',
      icon: '🌙',
      priority: 88,
    })
  }

  // 7. Tired/frustrated mood → soft suggestion
  if (todayMood === 'Tired' || todayMood === 'Frustrated') {
    candidates.push({
      title: 'Take a break, then come back',
      sub: 'I\'ll be here. No pressure.',
      action: '/',
      icon: '☕',
      priority: 95,
    })
  }

  // 8. All done celebration
  if (tasks.length > 0 && remaining.length === 0) {
    candidates.push({
      title: 'Crushed it all',
      sub: 'Spend that XP in the shop',
      action: '/shop',
      icon: '🏆',
      priority: 92,
    })
  }

  // 9. Default — journal
  if (candidates.length === 0) {
    candidates.push({
      title: 'Journal something',
      sub: 'Quick reflection',
      action: '/journal',
      icon: '📓',
      priority: 50,
    })
  }

  candidates.sort((a, b) => b.priority - a.priority)
  return candidates[0]
}

export { getSuggestion }
