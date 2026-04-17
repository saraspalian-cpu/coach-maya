/**
 * Mood data persistence — separated from MayaMoodBoard component
 * so it can be statically imported without pulling in React.
 */

const MOOD_KEY = 'maya_moods'

export function loadMoods() {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY)) || [] } catch { return [] }
}

export function saveMood(mood) {
  try {
    const moods = loadMoods()
    const today = new Date().toISOString().slice(0, 10)
    const filtered = moods.filter(m => m.date !== today)
    filtered.unshift({ mood, date: today, time: new Date().toISOString() })
    localStorage.setItem(MOOD_KEY, JSON.stringify(filtered.slice(0, 365)))
  } catch {}
}
