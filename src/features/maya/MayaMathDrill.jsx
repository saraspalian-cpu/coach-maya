/**
 * Quick Math Drill — timed mental math game.
 * 20 problems, clock running. Track personal bests.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const MATH_KEY = 'maya_math_records'
const TOTAL_Q = 20

function genProblem(difficulty) {
  const ops = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer
  const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100
  switch (op) {
    case '+': a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * max) + 1; answer = a + b; break
    case '-': a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * a) + 1; answer = a - b; break
    case '×': a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; answer = a * b; break
    case '÷': b = Math.floor(Math.random() * 11) + 2; answer = Math.floor(Math.random() * 12) + 1; a = b * answer; break
    default: a = 1; b = 1; answer = 2
  }
  return { text: `${a} ${op} ${b}`, answer }
}

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(MATH_KEY)) || [] } catch { return [] }
}
function saveRecord(record) {
  const all = [record, ...loadRecords()].slice(0, 50)
  try { localStorage.setItem(MATH_KEY, JSON.stringify(all)) } catch {}
}

export default function MayaMathDrill() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState('medium')
  const [phase, setPhase] = useState('pick') // pick | play | done
  const [problems, setProblems] = useState([])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  const start = () => {
    const probs = Array.from({ length: TOTAL_Q }, () => genProblem(difficulty))
    setProblems(probs)
    setIdx(0); setCorrect(0); setInput(''); setElapsed(0)
    startRef.current = Date.now()
    setPhase('play')
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 100)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const submit = () => {
    const ans = parseInt(input)
    const isCorrect = ans === problems[idx].answer
    if (isCorrect) {
      setCorrect(c => c + 1)
      sfx.ding()
    } else {
      sfx.miss()
    }
    setInput('')
    if (idx + 1 >= TOTAL_Q) {
      if (timerRef.current) clearInterval(timerRef.current)
      const finalElapsed = Math.floor((Date.now() - startRef.current) / 1000)
      setElapsed(finalElapsed)
      const record = {
        date: new Date().toISOString(),
        difficulty,
        correct: isCorrect ? correct + 1 : correct,
        total: TOTAL_Q,
        seconds: finalElapsed,
      }
      saveRecord(record)
      setPhase('done')
      sfx.achievement()
    } else {
      setIdx(idx + 1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const records = loadRecords()
  const bestTime = records.filter(r => r.difficulty === difficulty && r.correct === TOTAL_Q).sort((a, b) => a.seconds - b.seconds)[0]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => { if (timerRef.current) clearInterval(timerRef.current); navigate('/') }} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {phase === 'pick' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🧮</div>
              <div style={{ fontFamily: C.display, fontSize: 28, color: C.teal, letterSpacing: 1 }}>{TOTAL_Q} PROBLEMS</div>
              <div style={{ fontSize: 11, color: C.muted }}>How fast can you go?</div>
            </div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Difficulty</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: '12px', borderRadius: 10, textTransform: 'capitalize',
                  background: difficulty === d ? C.teal + '22' : C.surface,
                  border: `2px solid ${difficulty === d ? C.teal : C.border}`,
                  color: difficulty === d ? C.teal : C.muted,
                  fontSize: 13, fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
                }}>{d}</button>
              ))}
            </div>
            {bestTime && (
              <div style={{ padding: 10, background: C.surfaceLight, borderRadius: 8, textAlign: 'center', marginBottom: 12, fontSize: 11, color: C.gold }}>
                🏆 Best: {bestTime.seconds}s (perfect {TOTAL_Q}/{TOTAL_Q} on {difficulty})
              </div>
            )}
            <button onClick={start} style={btn}>GO</button>
          </>
        )}

        {phase === 'play' && problems[idx] && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 12 }}>
              <span>{idx + 1}/{TOTAL_Q}</span>
              <span style={{ color: C.green }}>{correct} ✓</span>
              <span style={{ color: C.amber }}>{elapsed}s</span>
            </div>
            <div style={{ height: 4, background: C.dim, borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ height: '100%', width: `${((idx + 1) / TOTAL_Q) * 100}%`, background: C.teal, transition: 'width 200ms' }} />
            </div>
            <div style={{
              fontFamily: C.display, fontSize: 64, color: C.text, lineHeight: 1, marginBottom: 20,
            }}>{problems[idx].text}</div>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value.replace(/[^0-9-]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter' && input) submit() }}
              type="number"
              autoFocus
              style={{
                width: '50%', padding: '16px', background: C.surface,
                border: `2px solid ${C.teal}`, borderRadius: 14,
                color: C.teal, fontSize: 32, fontFamily: C.display,
                textAlign: 'center', outline: 'none',
              }}
            />
            <div style={{ marginTop: 12 }}>
              <button onClick={submit} disabled={!input} style={{
                padding: '12px 40px', background: input ? C.teal : C.dim,
                border: 'none', borderRadius: 12, color: C.bg,
                fontSize: 14, fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
              }}>Enter</button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56 }}>🧮</div>
            <div style={{ fontFamily: C.display, fontSize: 36, color: correct === TOTAL_Q ? C.gold : C.teal, marginTop: 8 }}>
              {correct}/{TOTAL_Q}
            </div>
            <div style={{ fontSize: 14, color: C.text, marginTop: 4 }}>in {elapsed} seconds</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
              {correct === TOTAL_Q ? 'Perfect. That\'s disgusting (in the best way).' :
               correct >= 15 ? 'Solid. But you left some on the table.' :
               correct >= 10 ? 'Mid. You can do better and you know it.' :
               'Rough. We drill again tomorrow.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={start} style={btn}>Again</button>
              <button onClick={() => navigate('/')} style={secBtn}>Done</button>
            </div>

            {records.length > 0 && (
              <div style={{ marginTop: 20, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Recent runs</div>
                {records.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.muted, padding: '4px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.correct}/{r.total} · {r.difficulty}</span>
                    <span>{r.seconds}s · {new Date(r.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>MATH DRILL</div>
    </div>
  )
}
const btn = { flex: 1, padding: '14px 20px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }
const secBtn = { flex: 1, padding: '14px 20px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: C.mono, cursor: 'pointer' }
