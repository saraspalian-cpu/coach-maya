/**
 * Agent 2: Lesson Analyst
 * Maya's signature feature — sits through Vasco's online lessons,
 * captures the audio, then reinforces the key learnings afterward.
 *
 * Listening modes:
 *   - mic       — best for in-person or speakers loud enough to pick up
 *   - screen    — captures tab/system audio via getDisplayMedia (Chrome desktop)
 *
 * Web Speech API only transcribes mic input, so screen mode falls back to
 * MediaRecorder + chunked playback through a hidden audio element routed
 * through the mic loop. For a 12-year-old's online class, mic mode is plenty.
 */

import { listen } from '../lib/voice'

const HISTORY_KEY = 'maya_lessons'

let session = null

// ─── Capture ───────────────────────────────────────────

function startLessonCapture({ subject, onInterim, onFinal, onError } = {}) {
  if (session) stopLessonCapture()
  session = {
    id: `lesson_${Date.now()}`,
    subject: subject || 'Lesson',
    startedAt: new Date().toISOString(),
    transcript: [],
    stop: null,
    stopped: false,
    paused: false,
  }

  // Auto-restarting recognition loop (Web Speech stops on silence)
  const restart = () => {
    if (!session || session.stopped || session.paused) return
    try {
      session.stop = listen({
        onResult: (text, isFinal) => {
          if (isFinal && text) {
            session.transcript.push(text)
            onFinal?.(text, session.transcript.join(' '))
          } else if (text) {
            onInterim?.(text)
          }
        },
        onError: (e) => onError?.(e),
        onEnd: () => setTimeout(restart, 200),
      })
    } catch (e) { onError?.(e) }
  }
  restart()

  return session
}

function pauseLessonCapture() {
  if (!session) return
  session.paused = true
  try { session.stop?.() } catch {}
}

function resumeLessonCapture(handlers) {
  if (!session) return
  session.paused = false
  // Re-attach handlers via fresh listen loop
  startLessonCapture({ ...handlers, subject: session.subject, _resume: true })
}

function stopLessonCapture() {
  if (!session) return null
  session.stopped = true
  try { session.stop?.() } catch {}

  const final = {
    id: session.id,
    subject: session.subject,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    durationMin: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000),
    fullTranscript: session.transcript.join(' '),
    snippetCount: session.transcript.length,
    wordCount: session.transcript.join(' ').split(/\s+/).filter(Boolean).length,
  }
  session = null
  return final
}

function getCurrentSession() { return session }

// ─── Concept extraction (heuristic) ────────────────────

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','of','to','in','on','at','for','with','as','by','from',
  'is','are','was','were','be','been','being','am','it','its','this','that','these','those',
  'i','you','he','she','we','they','them','their','his','her','my','our','your','us',
  'so','because','then','than','about','into','out','over','under','up','down','off',
  'one','two','three','four','five','six','seven','eight','nine','ten','will','would','could',
  'should','can','may','might','must','do','does','did','done','have','has','had','having',
  'okay','ok','right','now','yeah','yes','no','not','what','when','where','who','why','how',
  'which','um','uh','like','just','really','very','also','here','there','really','well','some',
  'thing','things','way','ways','make','makes','made','say','says','said','get','gets','got',
  'go','goes','went','going','take','takes','took','see','sees','saw','seen','look','looks',
  'know','knows','knew','known','think','thinks','thought','want','wants','wanted','need','needs',
  'people','person','someone','something','anyone','anything','everyone','everything','nobody',
])

function tokenize(text) {
  return text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []
}

function extractConcepts(transcript) {
  if (!transcript) return []
  const tokens = tokenize(transcript)
  if (tokens.length < 5) return []

  // Unigrams
  const uni = {}
  tokens.forEach(t => { if (!STOPWORDS.has(t)) uni[t] = (uni[t] || 0) + 1 })

  // Bigrams (much more useful for concept detection)
  const bi = {}
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i], b = tokens[i + 1]
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue
    const k = `${a} ${b}`
    bi[k] = (bi[k] || 0) + 1
  }

  const sortedBi = Object.entries(bi).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const sortedUni = Object.entries(uni).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Prefer bigrams; fall back to unigrams
  if (sortedBi.length >= 3) {
    return sortedBi.map(([phrase, count]) => ({ phrase, count }))
  }
  return sortedUni.map(([phrase, count]) => ({ phrase, count }))
}

// ─── Sentence-level highlights ─────────────────────────

function extractKeyPoints(transcript, max = 3) {
  if (!transcript) return []
  const sentences = transcript
    .replace(/([.?!])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  if (!sentences.length) return []

  // Score by: sentence length sweet spot + keyword density
  const concepts = extractConcepts(transcript)
  const keywordSet = new Set(concepts.flatMap(c => c.phrase.split(' ')))

  const scored = sentences.map(s => {
    const tokens = tokenize(s)
    const density = tokens.filter(t => keywordSet.has(t)).length / Math.max(tokens.length, 1)
    const lengthScore = 1 - Math.abs(tokens.length - 20) / 20
    return { sentence: s, score: density * 0.7 + lengthScore * 0.3 }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max).map(x => x.sentence)
}

// ─── Quiz generation ───────────────────────────────────

function generateQuiz(transcript, subject = 'Lesson') {
  const concepts = extractConcepts(transcript)
  const keyPoints = extractKeyPoints(transcript, 3)
  if (!concepts.length && !keyPoints.length) {
    return [
      { q: `What was the main idea from your ${subject} lesson today?`, type: 'open' },
    ]
  }

  const questions = []

  if (concepts[0]) {
    questions.push({
      q: `In your own words, what does "${concepts[0].phrase}" mean?`,
      hint: concepts[0].phrase,
      type: 'open',
    })
  }

  if (concepts.length >= 2) {
    questions.push({
      q: `How does "${concepts[0].phrase}" connect to "${concepts[1].phrase}"?`,
      type: 'open',
    })
  }

  if (keyPoints[0]) {
    questions.push({
      q: `Your teacher said something like: "${keyPoints[0].slice(0, 120)}${keyPoints[0].length > 120 ? '...' : ''}" — why does that matter?`,
      type: 'open',
    })
  }

  questions.push({
    q: `One thing you'll remember from this ${subject} lesson tomorrow morning?`,
    type: 'open',
  })

  return questions.slice(0, 4)
}

// ─── History persistence ───────────────────────────────

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLesson(lesson) {
  const history = loadHistory()
  history.unshift(lesson)
  // Keep last 50
  const trimmed = history.slice(0, 50)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)) } catch {}
  return trimmed
}

function deleteLesson(id) {
  const history = loadHistory().filter(l => l.id !== id)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) } catch {}
  return history
}

export {
  startLessonCapture,
  stopLessonCapture,
  pauseLessonCapture,
  resumeLessonCapture,
  getCurrentSession,
  extractConcepts,
  extractKeyPoints,
  generateQuiz,
  loadHistory,
  saveLesson,
  deleteLesson,
}
