/**
 * Weekly Challenge System
 * Maya issues a new challenge each Monday. Bonus XP on completion.
 */

const CHALLENGE_KEY = 'maya_challenges'

const CHALLENGE_TEMPLATES = [
  { title: '5 lessons this week', desc: 'Sit through 5 lessons with Maya', target: 5, metric: 'lessons', xp: 100, icon: '🎙' },
  { title: '3-day combo streak', desc: 'Keep a 3× combo alive for 3 days', target: 3, metric: 'combo_days', xp: 80, icon: '🔥' },
  { title: 'Read 50 pages', desc: 'Log 50 pages of reading this week', target: 50, metric: 'pages', xp: 75, icon: '📖' },
  { title: 'Memory master', desc: 'Review 20 concepts in the memory bank', target: 20, metric: 'reviews', xp: 60, icon: '🧠' },
  { title: 'Focus beast', desc: 'Complete 3 focus blocks (25+ min)', target: 3, metric: 'focus', xp: 90, icon: '⏱' },
  { title: 'All tasks for 3 days', desc: 'Finish every task 3 days this week', target: 3, metric: 'perfect_days', xp: 120, icon: '💎' },
  { title: 'Tennis 3x', desc: '3 tennis sessions this week', target: 3, metric: 'tennis', xp: 70, icon: '🎾' },
  { title: 'Journal streak', desc: 'Write a journal entry 4 days', target: 4, metric: 'journal', xp: 60, icon: '📓' },
  { title: 'Quiz ace', desc: 'Score 80+ on 3 lesson quizzes', target: 3, metric: 'quiz_80', xp: 100, icon: '🏆' },
  { title: 'Morning ritual 5x', desc: 'Do the morning ritual 5 times', target: 5, metric: 'morning', xp: 70, icon: '☀️' },
]

function loadChallenges() {
  try { return JSON.parse(localStorage.getItem(CHALLENGE_KEY)) || { active: null, history: [] } }
  catch { return { active: null, history: [] } }
}

function saveChallenges(data) {
  try { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(data)) } catch {}
}

function getWeekId() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function getActiveChallenge() {
  const data = loadChallenges()
  const weekId = getWeekId()
  if (data.active && data.active.weekId === weekId) return data.active
  // New week — issue a new challenge
  const used = new Set(data.history.slice(-5).map(h => h.title))
  const available = CHALLENGE_TEMPLATES.filter(t => !used.has(t.title))
  const pick = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)]
  const challenge = { ...pick, weekId, progress: 0, completed: false, issuedAt: new Date().toISOString() }
  data.active = challenge
  saveChallenges(data)
  return challenge
}

function updateProgress(progress) {
  const data = loadChallenges()
  if (!data.active) return null
  data.active.progress = Math.min(progress, data.active.target)
  if (data.active.progress >= data.active.target && !data.active.completed) {
    data.active.completed = true
    data.active.completedAt = new Date().toISOString()
    // Move to history
    data.history.push({ ...data.active })
  }
  saveChallenges(data)
  return data.active
}

function getChallengeHistory() {
  return loadChallenges().history || []
}

export { getActiveChallenge, updateProgress, getChallengeHistory, CHALLENGE_TEMPLATES }
