import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  startLessonCapture, stopLessonCapture,
  generateQuiz, extractKeyPoints, extractConcepts, saveLesson,
} from './agents/lessonAnalyst'
import { addConceptsFromLesson } from './agents/memory'
import { gradeQuiz } from './agents/quizGrader'
import { LessonRecorder, putAudio } from './lib/audioStore'
import { useMaya } from './context/MayaContext'
import MayaAvatar from './components/Maya3D'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const SUBJECTS = ['Maths', 'Science', 'English', 'History', 'Languages', 'Coding', 'Art', 'Other']

// Phase: pick → live → review → quiz → done
export default function MayaLesson() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [phase, setPhase] = useState('pick')
  const [subject, setSubject] = useState('Maths')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [keyPoints, setKeyPoints] = useState([])
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [lessonResult, setLessonResult] = useState(null)
  const [grading, setGrading] = useState(null)
  const startedAtRef = useRef(null)
  const timerRef = useRef(null)
  const lastNudgeRef = useRef(0)
  const recorderRef = useRef(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (phase === 'live') stopLessonCapture()
  }, [])

  // ─── Phase: live capture ───
  const start = async () => {
    setTranscript('')
    setInterim('')
    setElapsed(0)
    startedAtRef.current = Date.now()
    setPhase('live')

    // Kick off audio recording in parallel (IndexedDB)
    try {
      recorderRef.current = new LessonRecorder()
      await recorderRef.current.start()
    } catch (e) {
      console.warn('Recording disabled:', e)
    }

    startLessonCapture({
      subject,
      onInterim: (t) => setInterim(t),
      onFinal: (text, full) => { setTranscript(full); setInterim('') },
      onError: (e) => console.warn('Lesson capture error:', e),
    })

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setElapsed(secs)
      // Maya focus check-ins every ~12 minutes
      const min = Math.floor(secs / 60)
      if (min > 0 && min % 12 === 0 && lastNudgeRef.current !== min) {
        lastNudgeRef.current = min
        const nudges = [
          'Still locked in? You got this.',
          "Halfway through. Don't drift.",
          'Eyes on the teacher. I\'m still listening.',
          "You're doing great — keep going.",
        ]
        const text = nudges[Math.floor(Math.random() * nudges.length)]
        maya.speakText(text)
      }
    }, 1000)
  }

  const stop = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    const result = stopLessonCapture()

    // Stop + persist recording
    let audioId = null
    if (recorderRef.current) {
      try {
        const blob = await recorderRef.current.stop()
        if (blob && result?.id) {
          audioId = result.id
          await putAudio(audioId, blob)
        }
      } catch (e) { console.warn('audio save failed', e) }
    }

    if (!result || !result.fullTranscript || result.wordCount < 10) {
      setPhase('pick')
      maya.speakText("I didn't catch enough audio. Try moving closer to the speaker.")
      return
    }
    result.audioId = audioId
    setLessonResult(result)
    const points = extractKeyPoints(result.fullTranscript, 3)
    setKeyPoints(points)
    setPhase('review')

    // Maya speaks the recap
    setTimeout(() => {
      const intro = `Lesson done. Here's what stuck out from your ${subject} session.`
      maya.speakText(intro)
    }, 400)
  }

  const startQuiz = () => {
    const q = generateQuiz(lessonResult.fullTranscript, subject)
    setQuiz(q)
    setAnswers({})
    setPhase('quiz')
  }

  const submitQuiz = async () => {
    setPhase('grading')
    maya.speakText('Grading your answers. One sec.')

    const filledQuiz = quiz.map((q, i) => ({ q: q.q, a: answers[i] || '' }))
    let graded
    try {
      graded = await gradeQuiz(filledQuiz, lessonResult.fullTranscript, subject)
    } catch {
      graded = { overallScore: 50, feedback: 'Grading unavailable.', perQuestion: [] }
    }

    // XP based on actual score
    const xpBase = Math.round(30 + (graded.overallScore / 100) * 50)

    const lessonRecord = {
      ...lessonResult,
      keyPoints,
      quiz: filledQuiz,
      grading: graded,
      xpEarned: xpBase,
      completedAt: new Date().toISOString(),
    }
    saveLesson(lessonRecord)

    // Feed concepts into memory
    const concepts = extractConcepts(lessonResult.fullTranscript)
    addConceptsFromLesson(lessonResult, concepts)

    setGrading(graded)
    setPhase('done')

    // Speak the feedback
    setTimeout(() => maya.speakText(graded.feedback), 400)

    // Push summary into chat
    const summary = `Finished a ${lessonResult.durationMin}-min ${subject} lesson. Score: ${graded.overallScore}/100. Takeaway: ${keyPoints[0] || 'reviewed core concepts'}.`
    maya.sendMessage(summary)

    setTimeout(() => navigate('/'), 5000)
  }

  const cancel = () => {
    if (phase === 'live') stopLessonCapture()
    if (timerRef.current) clearInterval(timerRef.current)
    navigate('/')
  }

  // ─── Render ───
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={cancel} title={phase === 'live' ? 'Lesson Live' : phase === 'review' ? 'Recap' : phase === 'quiz' ? 'Quiz' : 'Lesson Mode'} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* PICK PHASE */}
        {phase === 'pick' && (
          <>
            <MayaAvatar state="speaking" size={220} />
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16, marginTop: 8, textAlign: 'center' }}>
              I'll sit through your lesson, listen to the key parts, and quiz you afterward to lock it in.
            </p>
            <Section title="What lesson?">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSubject(s)} style={chip(subject === s)}>{s}</button>
                ))}
              </div>
            </Section>
            <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, marginBottom: 16, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              💡 Put me near the speaker so I can hear the teacher clearly. I'll check in on you every 12 min.
            </div>
            <button onClick={start} style={primary}>🎙 Start Lesson</button>
          </>
        )}

        {/* LIVE PHASE */}
        {phase === 'live' && (
          <>
            <div style={{
              padding: 20, background: C.surface, borderRadius: 16,
              border: `1px solid ${C.red}44`, textAlign: 'center', marginBottom: 12,
              position: 'relative',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 36,
                background: C.red, margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, animation: 'pulse 1.6s infinite',
                boxShadow: `0 0 24px ${C.red}66`,
              }}>🎙️</div>
              <div style={{ fontFamily: C.display, fontSize: 38, color: C.red, lineHeight: 1, letterSpacing: 1 }}>
                {formatTime(elapsed)}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Listening to {subject}
              </div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                {transcript.split(/\s+/).filter(Boolean).length} words captured
              </div>
            </div>

            <div style={{
              padding: 14, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 12,
              minHeight: 140, maxHeight: 240, overflowY: 'auto',
            }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Live transcript
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                {transcript || <span style={{ color: C.dim }}>Waiting for the teacher to start...</span>}
                {interim && <span style={{ color: C.muted }}> {interim}</span>}
              </div>
            </div>

            <button onClick={stop} style={{ ...primary, background: C.red }}>End Lesson</button>
          </>
        )}

        {/* REVIEW PHASE */}
        {phase === 'review' && (
          <>
            <MayaAvatar state="speaking" size={200} />
            <div style={{
              padding: 14, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 12, marginTop: 8,
            }}>
              <div style={{ fontSize: 10, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Lesson stats
              </div>
              <Stats lesson={lessonResult} />
            </div>

            {keyPoints.length > 0 && (
              <div style={{
                padding: 14, background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, marginBottom: 12,
              }}>
                <div style={{ fontSize: 10, color: C.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Key takeaways
                </div>
                {keyPoints.map((pt, i) => (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: C.surfaceLight,
                    borderLeft: `3px solid ${C.gold}`,
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: 12, color: C.text, lineHeight: 1.5,
                  }}>
                    <span style={{ color: C.gold, marginRight: 6 }}>{i + 1}.</span>{pt}
                  </div>
                ))}
              </div>
            )}

            <button onClick={startQuiz} style={primary}>Lock it in — start quiz</button>
            <button onClick={() => { navigate('/') }} style={secondary}>Skip quiz</button>
          </>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && (
          <>
            <div style={{ fontSize: 11, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {subject} · {quiz.length} questions
            </div>
            {quiz.map((q, i) => (
              <div key={i} style={{
                padding: 14, background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, marginBottom: 10,
              }}>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>
                  <span style={{ color: C.teal, marginRight: 6 }}>{i + 1}.</span>{q.q}
                </div>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  placeholder="Your answer..."
                  style={{
                    width: '100%', padding: '10px 12px', background: C.bg,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none',
                    minHeight: 60, resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            <button onClick={submitQuiz} style={primary}>Submit & Earn XP</button>
          </>
        )}

        {/* GRADING PHASE */}
        {phase === 'grading' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <MayaAvatar state="thinking" size={220} />
            <div style={{ fontFamily: C.display, fontSize: 28, color: C.teal, marginTop: 12, letterSpacing: 1.5 }}>
              GRADING...
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Maya's reading your answers against the lesson.
            </div>
          </div>
        )}

        {/* DONE PHASE */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 8px' }}>
            <MayaAvatar state={grading?.overallScore >= 70 ? 'celebrating' : 'idle'} size={200} />
            {grading && (
              <>
                <div style={{
                  fontFamily: C.display, fontSize: 72, lineHeight: 1,
                  color: grading.overallScore >= 80 ? C.gold : grading.overallScore >= 60 ? C.green : grading.overallScore >= 40 ? C.amber : C.red,
                  marginTop: 8,
                }}>{grading.overallScore}</div>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>/ 100</div>
                <div style={{
                  fontSize: 13, color: C.text, lineHeight: 1.5,
                  padding: '14px 10px', marginTop: 10,
                  background: C.surface, borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  textAlign: 'left',
                }}>
                  {grading.feedback}
                </div>
                {grading.perQuestion?.length > 0 && (
                  <div style={{ marginTop: 12, textAlign: 'left' }}>
                    {grading.perQuestion.map((pq, i) => (
                      <div key={i} style={{
                        padding: '8px 10px', background: C.surfaceLight,
                        borderRadius: 8, marginBottom: 4,
                        fontSize: 11, display: 'flex', gap: 10,
                      }}>
                        <div style={{
                          minWidth: 32, fontWeight: 700,
                          color: pq.score >= 70 ? C.green : pq.score >= 40 ? C.amber : C.red,
                        }}>{pq.score}</div>
                        <div style={{ color: C.text, flex: 1 }}>{pq.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {!grading && (
              <>
                <div style={{ fontFamily: C.display, fontSize: 32, color: C.gold, marginTop: 12, letterSpacing: 1.5 }}>
                  LOCKED IN
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                  That lesson is now part of you.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stats({ lesson }) {
  const concepts = extractConcepts(lesson.fullTranscript).slice(0, 3)
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Stat label="Duration" value={`${lesson.durationMin}m`} />
        <Stat label="Words" value={lesson.wordCount} />
      </div>
      {concepts.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 6 }}>
            Top concepts
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {concepts.map((c, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 999,
                background: C.teal + '22', border: `1px solid ${C.teal}44`,
                fontSize: 11, color: C.teal,
              }}>{c.phrase}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{
      flex: 1, padding: 10, background: C.surfaceLight,
      borderRadius: 8, textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Header({ onBack, title }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
      background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>{title}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const chip = (active) => ({
  padding: '8px 14px', borderRadius: 999,
  border: `1px solid ${active ? C.teal : C.border}`,
  background: active ? C.teal + '22' : 'transparent',
  color: active ? C.teal : C.text,
  fontSize: 12, fontFamily: C.mono, cursor: 'pointer',
})

const primary = {
  width: '100%', padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
  marginBottom: 8,
}
const secondary = {
  width: '100%', padding: '12px 20px', background: 'transparent',
  color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12,
  fontSize: 13, fontFamily: C.mono, cursor: 'pointer',
}
