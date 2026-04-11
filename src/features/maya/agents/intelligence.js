/**
 * Intelligence Layer — Maya's predictive brain.
 *
 * 1. Procrastination detection (idle time on app)
 * 2. Pattern prediction (what will he skip today?)
 * 3. Excuse tracking (why he skips, patterns over time)
 * 4. Focus scoring (actual time vs scheduled per task)
 * 5. Energy-based task reordering
 * 6. Comprehension depth per subject
 * 7. Accountability contracts
 */

const INTEL_KEY = 'maya_intelligence'

function loadIntel() {
  try { return JSON.parse(localStorage.getItem(INTEL_KEY)) || defaultIntel() }
  catch { return defaultIntel() }
}
function saveIntel(data) {
  try { localStorage.setItem(INTEL_KEY, JSON.stringify(data)) } catch {}
}
function defaultIntel() {
  return {
    skipReasons: [],          // { taskType, reason, day, date }
    focusScores: [],          // { taskId, taskType, scheduledMin, actualMin, date }
    energyLogs: [],           // { level: 1-5, time, date }
    idlePings: [],            // { duration, date }
    contracts: [],            // { text, weekId, met: bool }
    subjectScores: {},        // { subject: [score, score, ...] }
    predictions: {},          // { dayOfWeek_taskType: { skipCount, totalCount } }
  }
}

// ─── Procrastination Detection ───
function logIdleTime(seconds) {
  const intel = loadIntel()
  intel.idlePings.push({ duration: seconds, date: new Date().toISOString() })
  intel.idlePings = intel.idlePings.slice(-100)
  saveIntel(intel)
}

function getIdleStats() {
  const intel = loadIntel()
  const recent = intel.idlePings.slice(-30)
  if (!recent.length) return { avg: 0, worst: 0, count: 0 }
  const avg = Math.round(recent.reduce((s, p) => s + p.duration, 0) / recent.length)
  const worst = Math.max(...recent.map(p => p.duration))
  return { avg, worst, count: recent.length }
}

// ─── Pattern Prediction ───
function recordTaskOutcome(taskType, completed) {
  const intel = loadIntel()
  const dow = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const key = `${dow}_${taskType}`
  if (!intel.predictions[key]) intel.predictions[key] = { skipCount: 0, totalCount: 0 }
  intel.predictions[key].totalCount++
  if (!completed) intel.predictions[key].skipCount++
  saveIntel(intel)
}

function getPredictions(tasks) {
  const intel = loadIntel()
  const dow = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const results = []
  for (const task of tasks) {
    const key = `${dow}_${task.type}`
    const data = intel.predictions[key]
    if (data && data.totalCount >= 3) {
      const skipRate = data.skipCount / data.totalCount
      if (skipRate >= 0.4) {
        results.push({
          taskName: task.name,
          taskType: task.type,
          skipRate: Math.round(skipRate * 100),
          message: skipRate >= 0.7
            ? `You skip ${task.name} on ${dow}s ${Math.round(skipRate * 100)}% of the time. Prove me wrong.`
            : `${task.name} on ${dow}s — you've skipped it ${data.skipCount} out of ${data.totalCount} times. Pattern.`,
        })
      }
    }
  }
  return results.sort((a, b) => b.skipRate - a.skipRate)
}

// ─── Excuse Tracking ───
const EXCUSE_OPTIONS = [
  { id: 'tired', label: 'Tired', icon: '😴' },
  { id: 'bored', label: 'Bored', icon: '🥱' },
  { id: 'forgot', label: 'Forgot', icon: '🤷' },
  { id: 'too_hard', label: 'Too hard', icon: '😤' },
  { id: 'no_time', label: 'No time', icon: '⏰' },
  { id: 'not_feeling_it', label: 'Not feeling it', icon: '😐' },
  { id: 'other', label: 'Other', icon: '💬' },
]

function logSkipReason(taskType, reason) {
  const intel = loadIntel()
  const dow = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  intel.skipReasons.push({ taskType, reason, day: dow, date: new Date().toISOString() })
  intel.skipReasons = intel.skipReasons.slice(-200)
  saveIntel(intel)
}

function getSkipPatterns() {
  const intel = loadIntel()
  const reasonCounts = {}
  const dayReasons = {}
  intel.skipReasons.forEach(s => {
    reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1
    const k = `${s.day}_${s.reason}`
    dayReasons[k] = (dayReasons[k] || 0) + 1
  })
  return {
    topReasons: Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
    total: intel.skipReasons.length,
    dayReasons,
  }
}

// ─── Focus Scoring ───
function logFocusScore(taskId, taskType, scheduledMin, actualMin) {
  const intel = loadIntel()
  const score = scheduledMin > 0 ? Math.round((Math.min(actualMin, scheduledMin * 1.2) / scheduledMin) * 100) : 100
  intel.focusScores.push({ taskId, taskType, scheduledMin, actualMin, score, date: new Date().toISOString() })
  intel.focusScores = intel.focusScores.slice(-200)
  saveIntel(intel)
  return score
}

function getFocusStats() {
  const intel = loadIntel()
  const scores = intel.focusScores
  if (!scores.length) return { avg: 0, byType: {}, trend: [] }
  const avg = Math.round(scores.reduce((s, f) => s + f.score, 0) / scores.length)
  const byType = {}
  scores.forEach(f => {
    if (!byType[f.taskType]) byType[f.taskType] = []
    byType[f.taskType].push(f.score)
  })
  Object.keys(byType).forEach(k => {
    byType[k] = Math.round(byType[k].reduce((s, v) => s + v, 0) / byType[k].length)
  })
  // Last 7 days trend
  const last7 = scores.slice(-14).map(f => ({ date: f.date?.slice(0, 10), score: f.score }))
  return { avg, byType, trend: last7 }
}

// ─── Energy Tracking ───
function logEnergy(level) {
  const intel = loadIntel()
  intel.energyLogs.push({ level, time: new Date().toISOString(), date: new Date().toISOString().slice(0, 10) })
  intel.energyLogs = intel.energyLogs.slice(-100)
  saveIntel(intel)
}

function getOptimalOrder(tasks) {
  const intel = loadIntel()
  const hour = new Date().getHours()
  // Simple heuristic: hard tasks when energy is high (morning), easy tasks later
  const hardTypes = new Set(['maths', 'science', 'homework', 'writing', 'revision'])
  const isMorning = hour < 13
  const sorted = [...tasks].sort((a, b) => {
    const aHard = hardTypes.has(a.type) ? 1 : 0
    const bHard = hardTypes.has(b.type) ? 1 : 0
    return isMorning ? bHard - aHard : aHard - bHard
  })
  return sorted
}

// ─── Comprehension Depth ───
function logSubjectScore(subject, score) {
  const intel = loadIntel()
  if (!intel.subjectScores[subject]) intel.subjectScores[subject] = []
  intel.subjectScores[subject].push({ score, date: new Date().toISOString() })
  intel.subjectScores[subject] = intel.subjectScores[subject].slice(-50)
  saveIntel(intel)
}

function getSubjectDepth() {
  const intel = loadIntel()
  const result = {}
  Object.entries(intel.subjectScores).forEach(([subject, scores]) => {
    const recent = scores.slice(-10)
    const avg = Math.round(recent.reduce((s, x) => s + x.score, 0) / recent.length)
    const trend = recent.length >= 3
      ? recent.slice(-3).reduce((s, x) => s + x.score, 0) / 3 - recent.slice(0, 3).reduce((s, x) => s + x.score, 0) / 3
      : 0
    result[subject] = { avg, count: scores.length, trend: Math.round(trend), scores: recent.map(s => s.score) }
  })
  return result
}

// ─── Accountability Contracts ───
function getWeekId() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function setContract(text) {
  const intel = loadIntel()
  intel.contracts.push({ text, weekId: getWeekId(), met: false, setAt: new Date().toISOString() })
  intel.contracts = intel.contracts.slice(-50)
  saveIntel(intel)
}

function getActiveContract() {
  const intel = loadIntel()
  return intel.contracts.find(c => c.weekId === getWeekId()) || null
}

function markContractMet() {
  const intel = loadIntel()
  const c = intel.contracts.find(c => c.weekId === getWeekId())
  if (c) c.met = true
  saveIntel(intel)
}

function getContractHistory() {
  return loadIntel().contracts.slice(-20)
}

// ─── Maya Intelligence Summary ───
function getIntelSummary(tasks) {
  const predictions = getPredictions(tasks)
  const skipPatterns = getSkipPatterns()
  const focusStats = getFocusStats()
  const subjectDepth = getSubjectDepth()
  const idleStats = getIdleStats()
  const contract = getActiveContract()

  return {
    predictions,
    skipPatterns,
    focusStats,
    subjectDepth,
    idleStats,
    contract,
    // Generate a "Maya knows" insight
    insights: buildInsights(predictions, skipPatterns, focusStats, subjectDepth),
  }
}

function buildInsights(predictions, skipPatterns, focusStats, subjectDepth) {
  const insights = []

  if (predictions.length > 0) {
    insights.push({
      icon: '🔮',
      text: predictions[0].message,
      type: 'prediction',
    })
  }

  if (skipPatterns.topReasons.length > 0) {
    const [reason, count] = skipPatterns.topReasons[0]
    insights.push({
      icon: '📊',
      text: `Your #1 excuse for skipping: "${reason}" (${count} times). Maya sees the pattern.`,
      type: 'pattern',
    })
  }

  if (focusStats.avg > 0) {
    insights.push({
      icon: '🎯',
      text: focusStats.avg >= 85
        ? `Average focus score: ${focusStats.avg}%. That's elite consistency.`
        : focusStats.avg >= 60
          ? `Average focus score: ${focusStats.avg}%. Decent but there's more in the tank.`
          : `Average focus score: ${focusStats.avg}%. You're rushing through tasks. Slow down.`,
      type: 'focus',
    })
  }

  const weakSubject = Object.entries(subjectDepth).sort((a, b) => a[1].avg - b[1].avg)[0]
  if (weakSubject && weakSubject[1].avg < 70) {
    insights.push({
      icon: '⚠️',
      text: `Weakest subject: ${weakSubject[0]} (avg ${weakSubject[1].avg}/100). Maya's watching this one.`,
      type: 'comprehension',
    })
  }

  return insights
}

export {
  logIdleTime, getIdleStats,
  recordTaskOutcome, getPredictions,
  logSkipReason, getSkipPatterns, EXCUSE_OPTIONS,
  logFocusScore, getFocusStats,
  logEnergy, getOptimalOrder,
  logSubjectScore, getSubjectDepth,
  setContract, getActiveContract, markContractMet, getContractHistory,
  getIntelSummary,
}
