/**
 * Agent 6: Parent Intelligence
 * Generates structured daily reports for Vasco's parent.
 */

import { dailySummary } from './personalityLearner'

function generateDailyReport({ dayLog, gamification, tasks, mood, reflection, spotChecks }) {
  const summary = dailySummary(dayLog)
  const completed = tasks.filter(t => t.completed)
  const skipped = tasks.filter(t => t.skipped)
  const pending = tasks.filter(t => !t.completed && !t.skipped)

  // MVP moment: highest combo or first task done
  const mvpMoment = (() => {
    if (gamification.combo >= 5) return `${gamification.combo}× combo streak — that's elite focus.`
    if (gamification.combo >= 3) return `Hit a ${gamification.combo}× combo today.`
    if (completed.length > 0) return `Completed ${completed[0].name} first.`
    return 'Nothing to highlight yet.'
  })()

  // One concern
  const concern = (() => {
    if (skipped.length >= 2) return `Skipped ${skipped.length} tasks: ${skipped.map(s => s.name).join(', ')}.`
    if (mood === 'Frustrated' || mood === 'Tired') return `Mood was "${mood}" — energy may be low.`
    const shallow = spotChecks?.filter(s => s.depth === 'shallow' || s.depth === 'minimal')
    if (shallow?.length) return `${shallow.length} spot-check answer(s) were shallow — comprehension to verify.`
    return null
  })()

  // One recommendation
  const recommendation = (() => {
    if (skipped.length >= 2) return `Consider front-loading the hard tasks earlier in the day.`
    if (gamification.combo === 0 && completed.length > 0) return `Combo was reset — small wins help build momentum.`
    if (gamification.dayGrade?.grade === 'S') return `Perfect day. Ride this momentum into tomorrow.`
    return `Stay the course — consistency over intensity.`
  })()

  return {
    date: new Date().toISOString().slice(0, 10),
    grade: gamification.dayGrade?.grade || '-',
    gradeLabel: gamification.dayGrade?.label || '',
    xpEarned: gamification.totalXP || 0,
    level: gamification.level?.title || 'Rookie',
    tasksCompleted: completed.length,
    tasksSkipped: skipped.length,
    tasksPending: pending.length,
    combo: gamification.combo,
    mood,
    reflection,
    mvpMoment,
    concern,
    recommendation,
    timeline: dayLog.map(e => ({
      time: e.time,
      type: e.type,
      label: e.task || e.type,
      xp: e.xp,
    })),
  }
}

function generateWeeklyReport(history) {
  // history: array of past daily reports
  if (!history?.length) return null
  const last7 = history.slice(-7)
  const avgXP = Math.round(last7.reduce((s, d) => s + (d.xpEarned || 0), 0) / last7.length)
  const grades = last7.map(d => d.grade).filter(Boolean)
  const sCount = grades.filter(g => g === 'S').length
  const aCount = grades.filter(g => g === 'A').length
  return {
    weekOf: last7[0]?.date,
    daysLogged: last7.length,
    avgXP,
    grades,
    sDays: sCount,
    aDays: aCount,
    bestDay: last7.reduce((best, d) => (d.xpEarned > (best?.xpEarned || 0) ? d : best), null),
  }
}

export { generateDailyReport, generateWeeklyReport }
