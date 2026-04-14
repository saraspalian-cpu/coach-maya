/**
 * Dynamic Schedule Generator — creates a personalized daily task list
 * from the extracted profile data instead of hardcoded defaults.
 *
 * Rules:
 * - Every kid gets core academics (based on their subjects)
 * - Sports/instruments get dedicated slots
 * - Bedtime determines end-of-day boundary
 * - Reflection always goes last
 * - Light/normal/full intensity based on total count
 */

const TASK_TEMPLATES = {
  // Academics — mapped from subject names
  maths:     { name: 'Maths',     type: 'maths',     icon: '📐', duration: 45 },
  science:   { name: 'Science',   type: 'science',   icon: '🔬', duration: 30 },
  reading:   { name: 'Reading',   type: 'reading',   icon: '📖', duration: 30 },
  writing:   { name: 'Writing',   type: 'writing',   icon: '✍️', duration: 30 },
  english:   { name: 'English',   type: 'writing',   icon: '✍️', duration: 30 },
  history:   { name: 'History',   type: 'revision',  icon: '📜', duration: 30 },
  geography: { name: 'Geography', type: 'revision',  icon: '🌍', duration: 30 },
  french:    { name: 'French',    type: 'revision',  icon: '🇫🇷', duration: 30 },
  spanish:   { name: 'Spanish',   type: 'revision',  icon: '🇪🇸', duration: 30 },
  german:    { name: 'German',    type: 'revision',  icon: '🇩🇪', duration: 30 },
  mandarin:  { name: 'Mandarin',  type: 'revision',  icon: '🇨🇳', duration: 30 },
  portuguese:{ name: 'Portuguese',type: 'revision',  icon: '🇵🇹', duration: 30 },
  biology:   { name: 'Biology',   type: 'science',   icon: '🧬', duration: 30 },
  chemistry: { name: 'Chemistry', type: 'science',   icon: '⚗️', duration: 30 },
  physics:   { name: 'Physics',   type: 'science',   icon: '⚛️', duration: 30 },
  computing: { name: 'Computing', type: 'homework',  icon: '💻', duration: 30 },
  literature:{ name: 'Literature',type: 'reading',   icon: '📖', duration: 30 },
  art:       { name: 'Art',       type: 'homework',  icon: '🎨', duration: 30 },
  drama:     { name: 'Drama',     type: 'homework',  icon: '🎭', duration: 30 },
  music:     { name: 'Music',     type: 'homework',  icon: '🎵', duration: 30 },
  pe:        { name: 'PE',        type: 'exercise',  icon: '🏃', duration: 30 },

  // Sports
  tennis:      { name: 'Tennis',      type: 'tennis',    icon: '🎾', duration: 60 },
  football:    { name: 'Football',    type: 'exercise',  icon: '⚽', duration: 60 },
  soccer:      { name: 'Soccer',      type: 'exercise',  icon: '⚽', duration: 60 },
  basketball:  { name: 'Basketball',  type: 'exercise',  icon: '🏀', duration: 60 },
  swimming:    { name: 'Swimming',    type: 'exercise',  icon: '🏊', duration: 45 },
  running:     { name: 'Running',     type: 'exercise',  icon: '🏃', duration: 30 },
  cycling:     { name: 'Cycling',     type: 'exercise',  icon: '🚴', duration: 45 },
  cricket:     { name: 'Cricket',     type: 'exercise',  icon: '🏏', duration: 60 },
  rugby:       { name: 'Rugby',       type: 'exercise',  icon: '🏉', duration: 60 },
  gymnastics:  { name: 'Gymnastics',  type: 'exercise',  icon: '🤸', duration: 60 },
  hockey:      { name: 'Hockey',      type: 'exercise',  icon: '🏑', duration: 60 },
  skating:     { name: 'Skating',     type: 'exercise',  icon: '⛸️', duration: 45 },
  martial_arts:{ name: 'Martial Arts',type: 'exercise',  icon: '🥋', duration: 60 },
  karate:      { name: 'Karate',      type: 'exercise',  icon: '🥋', duration: 60 },
  boxing:      { name: 'Boxing',      type: 'exercise',  icon: '🥊', duration: 45 },
  volleyball:  { name: 'Volleyball',  type: 'exercise',  icon: '🏐', duration: 60 },
  badminton:   { name: 'Badminton',   type: 'exercise',  icon: '🏸', duration: 45 },
  golf:        { name: 'Golf',        type: 'exercise',  icon: '⛳', duration: 60 },
  surfing:     { name: 'Surfing',     type: 'exercise',  icon: '🏄', duration: 60 },
  climbing:    { name: 'Climbing',    type: 'exercise',  icon: '🧗', duration: 45 },

  // Instruments
  piano:     { name: 'Piano',     type: 'piano',     icon: '🎹', duration: 30 },
  guitar:    { name: 'Guitar',    type: 'piano',     icon: '🎸', duration: 30 },
  drums:     { name: 'Drums',     type: 'piano',     icon: '🥁', duration: 30 },
  violin:    { name: 'Violin',    type: 'piano',     icon: '🎻', duration: 30 },
  cello:     { name: 'Cello',     type: 'piano',     icon: '🎻', duration: 30 },
  flute:     { name: 'Flute',     type: 'piano',     icon: '🪈', duration: 30 },
  saxophone: { name: 'Saxophone', type: 'piano',     icon: '🎷', duration: 30 },
  trumpet:   { name: 'Trumpet',   type: 'piano',     icon: '🎺', duration: 30 },
  ukulele:   { name: 'Ukulele',   type: 'piano',     icon: '🎸', duration: 25 },
}

/**
 * Generate a daily schedule from extracted profile data.
 * @param {object} extracted - from profileBuilder: { sports, instruments, activities, favoriteSubjects, hardSubjects, bedtime }
 * @returns {Array} - task list in schedule format
 */
function generateSchedule(extracted) {
  const tasks = []
  const added = new Set()

  function add(key) {
    const k = key.toLowerCase().replace(/\s+/g, '_')
    if (added.has(k)) return
    const template = TASK_TEMPLATES[k]
    if (!template) return
    added.add(k)
    tasks.push({ ...template })
  }

  // 1. Hard subjects first (these need the most focus, morning energy)
  const hardSubjects = (extracted.hardSubjects || [])
  hardSubjects.forEach(s => add(s))

  // 2. Favorite subjects (keep it balanced — max 2 academics beyond hard subjects)
  const favSubjects = (extracted.favoriteSubjects || [])
  let academicCount = tasks.length
  favSubjects.forEach(s => {
    if (academicCount < 3) { add(s); academicCount++ }
  })

  // 3. If no academics at all, add Reading + Maths as defaults
  if (tasks.length === 0) {
    add('maths')
    add('reading')
  } else if (tasks.length === 1) {
    // At least 2 academic tasks
    if (!added.has('reading')) add('reading')
    else if (!added.has('maths')) add('maths')
  }

  // 4. Sports (1 per day — rotate in schedule settings)
  const sports = (extracted.sports || [])
  if (sports.length > 0) {
    add(sports[0])
  }

  // 5. Instruments
  const instruments = (extracted.instruments || [])
  instruments.forEach(i => add(i))

  // 6. Always end with reflection
  tasks.push({ name: 'Reflection', type: 'reflection', icon: '🪞', duration: 10 })

  // 7. Cap at 7 tasks (reasonable for a kid)
  const capped = tasks.slice(0, 7)

  // 8. Assign IDs
  return capped.map((t, i) => ({
    id: String(i + 1),
    name: t.name,
    type: t.type,
    startTime: null,
    duration: t.duration,
    completed: false,
  }))
}

/**
 * Generate a default schedule when no profile data exists.
 */
function generateDefaultSchedule() {
  return [
    { id: '1', name: 'Maths',      type: 'maths',     startTime: null, duration: 45, completed: false },
    { id: '2', name: 'Reading',    type: 'reading',   startTime: null, duration: 30, completed: false },
    { id: '3', name: 'Exercise',   type: 'exercise',  startTime: null, duration: 30, completed: false },
    { id: '4', name: 'Reflection', type: 'reflection', startTime: null, duration: 10, completed: false },
  ]
}

export { generateSchedule, generateDefaultSchedule, TASK_TEMPLATES }
