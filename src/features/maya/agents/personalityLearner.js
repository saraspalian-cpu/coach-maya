/**
 * Agent 5: Personality Learner
 * Watches every interaction and quietly updates Vasco's profile.
 * Lightweight rule-based now; can be upgraded to LLM-driven later.
 */

import { loadProfile, saveProfile } from '../lib/profile'

/**
 * Record a user interaction. The learner extracts signal from it.
 * event: { type, payload }
 *  - task_complete: { taskType, durationMin?, mood? }
 *  - task_skip: { taskType }
 *  - chat_user: { text }
 *  - mood: { mood }
 *  - reflection: { text }
 */
function recordEvent(event) {
  const profile = loadProfile()
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const dow = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  let changed = false

  // Track active streak
  if (event.type === 'task_complete') {
    if (profile.lastActiveDay !== day) {
      const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10)
      if (profile.lastActiveDay === yesterday) {
        profile.currentStreak = (profile.currentStreak || 0) + 1
      } else {
        profile.currentStreak = 1
      }
      profile.lastActiveDay = day
      profile.longestStreak = Math.max(profile.longestStreak || 0, profile.currentStreak)
      changed = true
    }
  }

  // Pattern detection: skips on a particular day
  if (event.type === 'task_skip' && event.payload?.taskType) {
    const key = `${dow}_${event.payload.taskType}`
    profile.patterns = profile.patterns || {}
    profile.patterns[key] = (profile.patterns[key] || 0) + 1
    if (profile.patterns[key] >= 2) {
      // Surface as a learned tactic to avoid (Maya knows!)
      const note = `Tends to skip ${event.payload.taskType} on ${dow}s`
      if (!profile.avoids?.includes(note)) {
        profile.avoids = [...(profile.avoids || []), note].slice(-10)
      }
    }
    changed = true
  }

  // Humor signal from chat: "lol", "haha", emoji laughter → tactic worked
  if (event.type === 'chat_user' && event.payload?.text) {
    const t = event.payload.text.toLowerCase()
    if (/(lol|haha|lmao|funny|🤣|😂|😅)/.test(t)) {
      const note = 'Humor lands when Maya is irreverent'
      if (!profile.worksOn?.includes(note)) {
        profile.worksOn = [...(profile.worksOn || []), note].slice(-10)
        changed = true
      }
    }
    // Resistance signals
    if (/(stop|whatever|annoying|boring|shut up)/.test(t)) {
      const note = 'Pushed too hard — back off when this tone appears'
      if (!profile.avoids?.includes(note)) {
        profile.avoids = [...(profile.avoids || []), note].slice(-10)
        changed = true
      }
    }
  }

  // Mood tracking
  if (event.type === 'mood' && event.payload?.mood) {
    profile.recentMoods = [
      ...((profile.recentMoods || []).slice(-13)),
      { day, mood: event.payload.mood },
    ]
    changed = true
  }

  if (changed) saveProfile(profile)
  return profile
}

/**
 * Daily summary — called once per day to compress the learned signal.
 * Returns highlights for the parent intelligence agent.
 */
function dailySummary(dayLog = []) {
  const profile = loadProfile()
  const completes = dayLog.filter(e => e.type === 'task_complete')
  const skips = dayLog.filter(e => e.type === 'task_skip')
  const reflection = dayLog.find(e => e.type === 'reflection')
  const mood = dayLog.find(e => e.type === 'mood')

  return {
    profile,
    tasksCompleted: completes.length,
    tasksSkipped: skips.length,
    totalXPToday: completes.reduce((sum, e) => sum + (e.xp || 0), 0),
    bestSubject: completes[0]?.task,
    skippedSubjects: skips.map(s => s.task),
    reflection: reflection?.text,
    mood: mood?.mood,
  }
}

export { recordEvent, dailySummary }
