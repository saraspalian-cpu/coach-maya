import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { startLessonCapture, stopLessonCapture, generateQuiz } from './agents/lessonAnalyst'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaLesson() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [recording, setRecording] = useState(false)
  const [subject, setSubject] = useState('Maths')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})

  const start = () => {
    setTranscript('')
    setInterim('')
    setQuiz([])
    setRecording(true)
    startLessonCapture({
      subject,
      onInterim: (t) => setInterim(t),
      onFinal: (text, full) => { setTranscript(full); setInterim('') },
      onError: () => setRecording(false),
    })
  }

  const stop = () => {
    const result = stopLessonCapture()
    setRecording(false)
    if (result?.fullTranscript) {
      const q = generateQuiz(result.fullTranscript, subject)
      setQuiz(q)
    }
  }

  const submitQuiz = () => {
    const summary = Object.entries(answers).map(([i, a]) => `Q${+i + 1}: ${a}`).join(' | ')
    maya.sendMessage(`I just finished a ${subject} lesson. Here's what I remember: ${summary}`)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} title="Lesson Mode" />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {!recording && quiz.length === 0 && (
          <>
            <Section title="Subject">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Maths', 'Science', 'English', 'History', 'Languages', 'Other'].map(s => (
                  <button key={s} onClick={() => setSubject(s)} style={{
                    padding: '8px 14px', borderRadius: 999,
                    border: `1px solid ${subject === s ? C.teal : C.border}`,
                    background: subject === s ? C.teal + '22' : 'transparent',
                    color: subject === s ? C.teal : C.text,
                    fontSize: 12, fontFamily: C.mono, cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
            </Section>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
              I'll listen during your lesson. When you're done, I'll quiz you on what was actually taught — no faking it.
            </p>
            <button onClick={start} style={primary}>🎤 Start Listening</button>
          </>
        )}

        {recording && (
          <>
            <div style={{
              padding: 24, background: C.surface, borderRadius: 16,
              border: `1px solid ${C.red}44`, textAlign: 'center', marginBottom: 12,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 30,
                background: C.red, margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, animation: 'pulse 1.5s infinite',
              }}>🎙️</div>
              <div style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>RECORDING {subject}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                Captured: {transcript.split(' ').filter(Boolean).length} words
              </div>
            </div>

            <div style={{
              padding: 14, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 12,
              minHeight: 120, maxHeight: 200, overflowY: 'auto',
            }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Live transcript
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                {transcript}
                {interim && <span style={{ color: C.muted }}> {interim}</span>}
                {!transcript && !interim && <span style={{ color: C.dim }}>Waiting for audio...</span>}
              </div>
            </div>

            <button onClick={stop} style={{ ...primary, background: C.red }}>Stop & Quiz</button>
          </>
        )}

        {quiz.length > 0 && !recording && (
          <>
            <div style={{ fontSize: 11, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Quick Quiz · {subject}
            </div>
            {quiz.map((q, i) => (
              <div key={i} style={{
                padding: 14, background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, marginBottom: 10,
              }}>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>{q.q}</div>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  placeholder="Your answer..."
                  style={{
                    width: '100%', padding: '10px 12px', background: C.bg,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none',
                    minHeight: 50, resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            <button onClick={submitQuiz} style={primary}>Submit & Get Feedback</button>
          </>
        )}
      </div>
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
const primary = {
  width: '100%', padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
}
