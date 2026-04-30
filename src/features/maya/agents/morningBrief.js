/**
 * Morning Brief Agent
 * One-shot briefing card surfaced on the dashboard the first time a kid
 * opens the app each morning.
 *
 * Returns null when it's already been seen today, or when it's not morning.
 *
 *   { greeting, yesterdayWin, today: { count, firstTask }, focus, mayaLine }
 */

import { loadProfile } from '../lib/profile'

const MORNING_KEY_PREFIX = 'maya_morning_seen_'
const MS_DAY = 86400000

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function yesterdayStr() {
  return new Date(Date.now() - MS_DAY).toISOString().slice(0, 10)
}

/**
 * @param {object} args
 * @param {Array} args.tasks - today's tasks
 * @param {object} [args.now]
 * @returns {object|null}
 */
function getMorningBrief({ tasks = [], now } = {}) {
  const t = now || new Date()
  const hour = t.getHours()
  if (hour < 5 || hour >= 11) return null

  const today = todayStr()
  const seenKey = MORNING_KEY_PREFIX + today
  if (localStorage.getItem(seenKey)) return null

  const profile = loadProfile() || {}
  const name = profile.name || 'Champ'
  const yesterday = yesterdayStr()

  // ── Yesterday's win: best report or biggest XP day ──
  const reports = loadLS('maya_daily_reports') || []
  const yReport = Array.isArray(reports) ? reports.find(r => r?.date === yesterday) : null

  let yesterdayWin = null
  if (yReport) {
    if (yReport.grade === 'S' || yReport.grade === 'A') {
      yesterdayWin = `${yReport.grade}-grade day · ${yReport.xpEarned} XP`
    } else if ((yReport.tasksCompleted || 0) >= 3) {
      yesterdayWin = `${yReport.tasksCompleted} tasks completed`
    } else if ((yReport.combo || 0) >= 3) {
      yesterdayWin = `${yReport.combo}× combo built`
    }
  }

  // ── Today's load ──
  const pending = tasks.filter(t => !t.completed && !t.skipped)
  const firstTask = pending[0] || tasks[0] || null

  // ── Today's focus: one specific thing to nail ──
  const focus = (() => {
    if (!firstTask) return 'No tasks loaded — set up your schedule first.'
    if (pending.length >= 5) return `Big day. Knock out ${firstTask.name} first to set the tone.`
    if (pending.length >= 3) return `Open with ${firstTask.name}. Build momentum.`
    if (pending.length >= 1) return `Quick day. ${firstTask.name} is the one that matters.`
    return 'All done already? Plan tomorrow then.'
  })()

  // ── Maya's line — one short, character-rich sentence ──
  const mayaLine = (() => {
    const streak = profile.currentStreak || 0
    if (streak >= 14) return `Day ${streak + 1} starts now. Don't get cute — just go.`
    if (streak >= 3) return `${streak} days running. Today makes it ${streak + 1}.`
    if (streak === 0 && (profile.longestStreak || 0) >= 5) return `Comeback day. Just one task — that's all you need.`
    if (yReport?.grade === 'S') return `Yesterday was a clean S. Match it.`
    if ((yReport?.tasksSkipped || 0) >= 2) return `Yesterday slipped. Today's a fresh sheet.`
    return `Let's go, ${name}.`
  })()

  // ── Greeting based on hour ──
  const greeting = hour < 7 ? 'Early start' : hour < 9 ? 'Good morning' : 'Late morning, let\'s move'

  return {
    greeting: `${greeting}, ${name}`,
    yesterdayWin,
    today: {
      count: pending.length,
      firstTask: firstTask?.name || null,
    },
    focus,
    mayaLine,
  }
}

function dismissMorningBrief() {
  try {
    localStorage.setItem(MORNING_KEY_PREFIX + todayStr(), '1')
  } catch {}
}

export { getMorningBrief, dismissMorningBrief }
