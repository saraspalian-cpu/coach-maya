/**
 * Profile storage — Vasco's identity and preferences.
 * The personality learner adds to this over time.
 */

const PROFILE_KEY = 'maya_profile'
const PROFILE_VERSION = 2

const DEFAULT_PROFILE = {
  version: PROFILE_VERSION,
  // Identity
  name: 'Vasco',
  age: 12,
  pronouns: 'he/him',
  // Goals & motivation
  bigGoals: [],         // ["Make varsity tennis", "Learn piano sonata"]
  hobbies: [],          // ["Tennis", "Piano", "Gaming", "Drawing"]
  favoriteSubjects: [], // ["Maths", "Science"]
  hardSubjects: [],     // ["Reading", "Writing"]
  // Personality dials
  humorStyle: 'sarcastic',     // sarcastic | playful | dry | wholesome
  pushIntensity: 'medium',     // light | medium | hard
  motivationDriver: 'competition', // competition | identity | mastery | autonomy
  // Voice & avatar
  voiceEnabled: true,
  voiceAutoSpeak: true,
  systemVoice: null,           // chosen system voice name (null = auto-pick best)
  elevenLabsApiKey: '',        // ElevenLabs API key for premium TTS
  elevenLabsVoiceId: '',       // chosen ElevenLabs voice id
  avatarStyle: 'pixar',
  themeAccent: '#2DD4BF',
  // Personality model (learner-managed)
  insideJokes: [],     // ["the floppy disk thing"]
  worksOn: [],         // tactics that landed
  avoids: [],          // tactics that backfired
  patterns: {},        // {wednesday_reading: "tends to skip"}
  // Onboarding
  setupComplete: false,
  setupAt: null,
  // Streak
  longestStreak: 0,
  currentStreak: 0,
  lastActiveDay: null,
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...DEFAULT_PROFILE }
    const parsed = JSON.parse(raw)
    // Migrate / merge defaults so new fields appear
    return { ...DEFAULT_PROFILE, ...parsed, version: PROFILE_VERSION }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {}
}

function updateProfile(patch) {
  const current = loadProfile()
  const next = { ...current, ...patch }
  saveProfile(next)
  return next
}

/**
 * Build the personality_context string injected into Maya's system prompt.
 * This is what makes Maya feel like she KNOWS Vasco.
 */
function buildPersonalityContext(profile) {
  if (!profile) return ''
  const lines = []
  lines.push(`Name: ${profile.name}, age ${profile.age}.`)
  if (profile.bigGoals?.length) lines.push(`Big goals: ${profile.bigGoals.join('; ')}.`)
  if (profile.hobbies?.length) lines.push(`Hobbies: ${profile.hobbies.join(', ')}.`)
  if (profile.favoriteSubjects?.length) lines.push(`Loves: ${profile.favoriteSubjects.join(', ')}.`)
  if (profile.hardSubjects?.length) lines.push(`Struggles with: ${profile.hardSubjects.join(', ')}.`)
  lines.push(`Humor style: ${profile.humorStyle}. Push intensity: ${profile.pushIntensity}. Main driver: ${profile.motivationDriver}.`)
  if (profile.currentStreak) lines.push(`Current streak: ${profile.currentStreak} days. Longest: ${profile.longestStreak}.`)
  if (profile.insideJokes?.length) lines.push(`Inside jokes you've earned: ${profile.insideJokes.join(' | ')}.`)
  if (profile.worksOn?.length) lines.push(`Tactics that work on him: ${profile.worksOn.slice(-5).join('; ')}.`)
  if (profile.avoids?.length) lines.push(`Don't do: ${profile.avoids.slice(-5).join('; ')}.`)
  return lines.join(' ')
}

export {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  updateProfile,
  buildPersonalityContext,
}
