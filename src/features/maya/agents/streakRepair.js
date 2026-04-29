/**
 * Streak Repair Agent
 * Detects when a meaningful streak has broken and surfaces a low-friction
 * comeback plan so the kid can get back on the horse without shame.
 *
 * Returns null when there's nothing to repair, otherwise:
 *   { active: true, daysGone, lostStreak, headline, sub, plan: [task, task, task] }
 */

const MS_DAY = 86400000

function daysBetween(aISO, bISO) {
  if (!aISO || !bISO) return null
  const a = new Date(aISO)
  const b = new Date(bISO)
  if (isNaN(a) || isNaN(b)) return null
  return Math.floor((b - a) / MS_DAY)
}

/**
 * @param {object} profile  loaded profile object
 * @returns {object|null}
 */
function getStreakRepairPlan(profile) {
  if (!profile) return null
  const today = new Date().toISOString().slice(0, 10)
  const lastActive = profile.lastActiveDay
  const longest = profile.longestStreak || 0
  const current = profile.currentStreak || 0

  // No history yet — nothing to repair
  if (!lastActive) return null

  const daysGone = daysBetween(lastActive, today)
  if (daysGone == null) return null

  // Same day or yesterday — streak is fine, don't surface
  if (daysGone <= 1) return null

  // Only repair if there was a meaningful streak to lose
  // (current OR longest reached at least 3 days)
  const lostStreak = Math.max(current, longest)
  if (lostStreak < 3) return null

  // ── Headline scales with what was lost ──
  let headline, sub
  if (lostStreak >= 30) {
    headline = `${lostStreak}-day streak is paused`
    sub = `${daysGone} days off won't erase what you built. One small win today.`
  } else if (lostStreak >= 14) {
    headline = `${lostStreak} days down — let's restart`
    sub = `Don't try to reclaim it. Just one task today rebuilds the muscle.`
  } else {
    headline = `Off ${daysGone} days — easy reset`
    sub = `Pick the smallest thing on your list. Momentum first, intensity later.`
  }

  // ── Comeback plan: 3 micro-actions, each <15 minutes ──
  const plan = [
    { label: 'Mood check-in', minutes: 1, why: 'Tells Maya where you are.' },
    { label: 'One easy task', minutes: 10, why: 'Restarts the streak counter.' },
    { label: 'Tomorrow plan', minutes: 3, why: 'Pick 2 tasks for tomorrow now.' },
  ]

  return {
    active: true,
    daysGone,
    lostStreak,
    headline,
    sub,
    plan,
  }
}

/**
 * Quick boolean — used by For-You card prioritisation.
 */
function shouldShowStreakRepair(profile) {
  return !!getStreakRepairPlan(profile)
}

export { getStreakRepairPlan, shouldShowStreakRepair }
