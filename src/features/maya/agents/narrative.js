/**
 * Agent 8: Narrative Engine
 * Tells Vasco's growth story back to him using real data.
 * Compares past vs present with specific numbers. Frames growth as identity.
 *
 * Example output:
 *   "Two weeks ago you couldn't sit through maths without your phone.
 *    Today you did 52 minutes and nailed a quadratic quiz. That's not luck."
 */

import { loadHistory } from './lessonAnalyst'
import { weeklyInsights } from './insights'
import { loadMemory } from './memory'

function loadDayLog() {
  try {
    const state = JSON.parse(localStorage.getItem('maya_state') || '{}')
    return Array.isArray(state?.dayLog) ? state.dayLog : []
  } catch { return [] }
}

function dayDiff(a, b) {
  return Math.round((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24))
}

/**
 * Build a growth story. Requires at least 7 days of data for meaningful comparison.
 * Returns an array of story beats — each an object { title, body, icon }.
 */
function generateStory({ profile } = {}) {
  const lessons = loadHistory()
  const dayLog = loadDayLog()
  const memory = loadMemory()
  const now = Date.now()

  const beats = []

  // Beat 1: Total lesson minutes
  const totalMin = lessons.reduce((s, l) => s + (l.durationMin || 0), 0)
  if (totalMin >= 30) {
    beats.push({
      icon: '🎙',
      title: `${totalMin} minutes of focused learning`,
      body: `That's ${Math.round(totalMin / 60 * 10) / 10} hours of Maya sitting with you through ${lessons.length} lesson${lessons.length > 1 ? 's' : ''}. Not watching TV. Not scrolling. Actually learning.`,
    })
  }

  // Beat 2: Concepts mastered
  const concepts = memory.concepts || []
  const mastered = concepts.filter(c => c.box === 4).length
  if (concepts.length >= 5) {
    beats.push({
      icon: '🧠',
      title: `${concepts.length} concepts in your memory bank`,
      body: mastered > 0
        ? `${mastered} are fully mastered. These aren't just words you heard — they're permanent. You earned them.`
        : `Keep reviewing. In a few days these start moving up the boxes and become yours forever.`,
    })
  }

  // Beat 3: Streak identity
  const streak = profile?.currentStreak || 0
  const longest = profile?.longestStreak || 0
  if (streak >= 3) {
    beats.push({
      icon: '🔥',
      title: `${streak}-day streak`,
      body: streak >= 7
        ? `A week straight. That's not discipline anymore — that's who you are now. Most people can't do what you're doing.`
        : `You've shown up ${streak} days in a row. Do 4 more and your brain stops asking "should I" and just does.`,
    })
  }

  // Beat 4: XP earned
  const totalTasks = dayLog.filter(e => e.type === 'task_complete').length
  const totalXP = dayLog.reduce((s, e) => s + (e.xp || 0), 0)
  if (totalTasks >= 5) {
    beats.push({
      icon: '⚡',
      title: `${totalTasks} tasks done · ${totalXP} XP earned`,
      body: `Every single one of these was a choice to do the thing instead of avoiding it. Count them. That's your receipt.`,
    })
  }

  // Beat 5: Subject depth
  const insights = weeklyInsights()
  const topSubject = Object.entries(insights.subjectMin).sort((a, b) => b[1] - a[1])[0]
  if (topSubject && topSubject[1] >= 30) {
    beats.push({
      icon: '📚',
      title: `Your strongest subject this week: ${topSubject[0]}`,
      body: `${topSubject[1]} minutes on it. That's not random — that's a pattern. That's identity forming in real time.`,
    })
  }

  // Beat 6: Biggest win
  const bestDay = insights.bestDay
  if (bestDay && bestDay.xp >= 50) {
    beats.push({
      icon: '🏆',
      title: `Your best day: ${new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })}`,
      body: `${bestDay.xp} XP in a single day. ${bestDay.tasks} tasks, ${bestDay.lessonCount} lessons. Remember this day. You did that.`,
    })
  }

  // Beat 7: First-time events
  if (lessons.length === 1) {
    beats.push({
      icon: '🌱',
      title: `First lesson ever`,
      body: `This is where the story starts. Look at this moment in a month and remember: you chose to begin.`,
    })
  }
  if (lessons.length === 10) {
    beats.push({
      icon: '🔟',
      title: `10 lessons deep`,
      body: `Double digits. Most kids never get here.`,
    })
  }

  // Closing beat — the frame
  if (beats.length > 0) {
    const closingLine = beats.length >= 4
      ? "This isn't a report. This is evidence. Evidence that you're building something. Keep going."
      : beats.length >= 2
        ? "Early chapters. But the story is real. Keep writing it."
        : "We're just getting started. This is chapter one."
    beats.push({
      icon: '→',
      title: "And the story continues...",
      body: closingLine,
    })
  } else {
    beats.push({
      icon: '🌱',
      title: 'Chapter one',
      body: "Not enough data yet. Do a lesson, finish some tasks, and come back. Your story starts when you do.",
    })
  }

  return beats
}

export { generateStory }
