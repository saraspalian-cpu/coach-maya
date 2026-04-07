/**
 * Agent 2: Lesson Analyst
 * Listens via mic during a lesson, transcribes via Web Speech API,
 * extracts concepts, and generates quiz questions afterward.
 */

import { listen } from '../lib/voice'

let session = null

function startLessonCapture({ subject, onInterim, onFinal, onError } = {}) {
  if (session) stopLessonCapture()
  session = {
    subject: subject || 'Lesson',
    startedAt: new Date().toISOString(),
    transcript: [],
    stop: null,
  }
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
    onEnd: () => {
      // Auto-restart while session is open (continuous listening)
      if (session && !session.stopped) {
        try { session.stop = listen({
          onResult: (text, isFinal) => {
            if (isFinal && text) {
              session.transcript.push(text)
              onFinal?.(text, session.transcript.join(' '))
            } else if (text) onInterim?.(text)
          },
        }) } catch {}
      }
    },
  })
  return session
}

function stopLessonCapture() {
  if (!session) return null
  session.stopped = true
  try { session.stop?.() } catch {}
  const final = {
    subject: session.subject,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    fullTranscript: session.transcript.join(' '),
    snippetCount: session.transcript.length,
  }
  session = null
  return final
}

/**
 * Extract key concepts from a transcript using simple keyword frequency.
 * Production version would call Claude API.
 */
function extractConcepts(transcript) {
  if (!transcript) return []
  // Tokenize, lowercase, remove stopwords
  const stop = new Set([
    'the','a','an','and','or','but','if','of','to','in','on','at','for','with',
    'is','are','was','were','be','been','being','it','this','that','these','those',
    'i','you','he','she','we','they','them','their','his','her','my','our',
    'so','because','as','then','than','from','by','about','into','out','over',
    'one','two','three','will','would','could','should','can','may','might',
    'do','does','did','done','have','has','had','having','okay','ok','right','now',
    'yeah','yes','no','not','what','when','where','who','why','how','which','um','uh',
  ])
  const counts = {}
  transcript.toLowerCase().match(/[a-z][a-z'-]{2,}/g)?.forEach(w => {
    if (!stop.has(w)) counts[w] = (counts[w] || 0) + 1
  })
  // Top 5 by frequency
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }))
}

/**
 * Generate quiz questions from the transcript.
 * Heuristic for offline; LLM for online.
 */
function generateQuiz(transcript, subject = 'Lesson') {
  const concepts = extractConcepts(transcript)
  if (!concepts.length) return []
  return [
    {
      q: `What was the main thing covered in your ${subject} lesson?`,
      hint: concepts[0]?.word,
      type: 'open',
    },
    concepts[1] && {
      q: `Can you explain "${concepts[1].word}" in your own words?`,
      hint: concepts[1].word,
      type: 'open',
    },
    concepts.length >= 3 && {
      q: `How does "${concepts[0].word}" connect to "${concepts[2].word}"?`,
      hint: null,
      type: 'open',
    },
  ].filter(Boolean)
}

function getCurrentSession() { return session }

export {
  startLessonCapture,
  stopLessonCapture,
  extractConcepts,
  generateQuiz,
  getCurrentSession,
}
