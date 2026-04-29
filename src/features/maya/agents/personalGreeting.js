/**
 * Personal Greeting Agent
 * Composes a context-aware headline + subline based on time, profile, streak,
 * mood, upcoming competitions, and today's first task.
 *
 * Returns: { headline, subline, tone }
 *   tone: 'energized' | 'focused' | 'gentle' | 'celebratory' | 'urgent'
 */

const HOUR_BUCKETS = [
  { max: 5,  label: 'late',     headline: (n) => `Late one, ${n}.` },
  { max: 11, label: 'morning',  headline: (n) => `Morning, ${n}.` },
  { max: 14, label: 'midday',   headline: (n) => `Midday, ${n}.` },
  { max: 17, label: 'afternoon',headline: (n) => `Afternoon, ${n}.` },
  { max: 21, label: 'evening',  headline: (n) => `Evening, ${n}.` },
  { max: 24, label: 'night',    headline: (n) => `${n}, still up?` },
]

function bucket(hour) {
  return HOUR_BUCKETS.find(b => hour < b.max) || HOUR_BUCKETS[HOUR_BUCKETS.length - 1]
}

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function getPersonalGreeting({ profile = {}, tasks = [], todayMood = null, gamification = {} } = {}) {
  const name = profile.name || 'champ'
  const hour = new Date().getHours()
  const dow = new Date().getDay() // 0 Sun ... 6 Sat
  const b = bucket(hour)
  const today = new Date().toISOString().slice(0, 10)

  const remaining = tasks.filter(t => !t.completed && !t.skipped)
  const completed = tasks.filter(t => t.completed)
  const firstTodo = remaining[0]
  const allDone = tasks.length > 0 && remaining.length === 0
  const streak = profile.currentStreak || 0
  const level = gamification?.level?.level || 1

  // Next competition
  const comps = loadLS('maya_competitions') || []
  const upcoming = comps.filter(c => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const nextComp = upcoming[0]
  const daysUntilComp = nextComp ? Math.ceil((new Date(nextComp.date) - new Date(today)) / 86400000) : null

  // ── Decide tone + subline (priority order) ──

  // 1. Competition today
  if (daysUntilComp === 0) {
    return {
      headline: `Game day, ${name}.`,
      subline: `${nextComp.name}. Trust the prep. Go perform.`,
      tone: 'urgent',
    }
  }

  // 2. Competition imminent (≤3 days)
  if (daysUntilComp !== null && daysUntilComp <= 3) {
    return {
      headline: b.headline(name),
      subline: `${daysUntilComp} day${daysUntilComp === 1 ? '' : 's'} until ${nextComp.name}. Sharpen up.`,
      tone: 'urgent',
    }
  }

  // 3. All tasks crushed
  if (allDone) {
    return {
      headline: `Crushed it, ${name}.`,
      subline: streak > 0 ? `Day ${streak} locked in. Recover and reset.` : 'Day complete. Recover and reset.',
      tone: 'celebratory',
    }
  }

  // 4. Mood-aware tone
  if (todayMood === 'Tired') {
    return {
      headline: `Easy does it, ${name}.`,
      subline: 'Tired is a signal, not a verdict. One small thing.',
      tone: 'gentle',
    }
  }
  if (todayMood === 'Frustrated') {
    return {
      headline: `Reset, ${name}.`,
      subline: "Bad starts don't have to be bad days. Pick the easiest task.",
      tone: 'gentle',
    }
  }
  if (todayMood === 'Energized' || todayMood === 'Focused') {
    return {
      headline: `Let's go, ${name}.`,
      subline: firstTodo ? `Start with ${firstTodo.label || firstTodo.title || 'the first task'}.` : 'Plenty in the tank — pick something hard.',
      tone: 'energized',
    }
  }

  // 5. Long streak — reinforce
  if (streak >= 7) {
    return {
      headline: b.headline(name),
      subline: `Day ${streak} of the streak. Don't break it now.`,
      tone: 'focused',
    }
  }

  // 6. Weekend tone
  if (dow === 0 || dow === 6) {
    return {
      headline: b.headline(name),
      subline: dow === 6
        ? "Saturday. Train when others rest."
        : "Sunday. Set up next week before it sets you up.",
      tone: 'focused',
    }
  }

  // 7. Late evening — wind down
  if (b.label === 'evening' || b.label === 'night' || b.label === 'late') {
    if (completed.length > 0 && remaining.length > 0) {
      return {
        headline: b.headline(name),
        subline: `${completed.length} done, ${remaining.length} left. Finish strong or wrap up?`,
        tone: 'focused',
      }
    }
    return {
      headline: b.headline(name),
      subline: completed.length === 0 ? 'Day is closing fast. One thing before bed?' : 'Wrap-up time.',
      tone: 'gentle',
    }
  }

  // 8. Default — first task hint
  if (firstTodo) {
    const taskName = firstTodo.label || firstTodo.title || 'first task'
    return {
      headline: b.headline(name),
      subline: streak > 0 ? `Day ${streak}. Start with ${taskName}.` : `Start with ${taskName}.`,
      tone: 'focused',
    }
  }

  // 9. Fallback — level-aware
  return {
    headline: b.headline(name),
    subline: level > 5 ? `Level ${level}. Plenty more to climb.` : 'Pick a task. Get moving.',
    tone: 'focused',
  }
}

export { getPersonalGreeting }
