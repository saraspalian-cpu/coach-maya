/**
 * Typing Speed Test — WPM with real sentences.
 * Track personal bests. Maya roasts slow scores.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const SENTENCES = [
  'The quick brown fox jumps over the lazy dog near the river bank.',
  'Practice makes progress not perfection and that is the whole point.',
  'Every expert was once a beginner who refused to give up on the grind.',
  'Tennis is a game of patterns and the best players read them first.',
  'The best code is the code you never have to write twice.',
  'Discipline is choosing between what you want now and what you want most.',
  'A piano has eighty eight keys but infinite possibilities.',
  'The sun does not compete with the streetlights it just shines.',
  'Reading twenty minutes a day adds up to millions of words per year.',
  'Consistency beats intensity every single time without exception.',
  'Focus is not about saying yes to the thing you want to work on.',
  'Your brain consolidates memory during sleep so rest is productive.',
  'Great things are done by a series of small things brought together.',
  'The only way to do great work is to love what you do every day.',
  'Champions keep playing until they get it right not until they get tired.',
]

const TYPING_KEY = 'maya_typing_records'
function loadTypingRecords() {
  try { return JSON.parse(localStorage.getItem(TYPING_KEY)) || [] } catch { return [] }
}
function saveTypingRecord(r) {
  const all = [r, ...loadTypingRecords()].slice(0, 30)
  try { localStorage.setItem(TYPING_KEY, JSON.stringify(all)) } catch {}
}

export default function MayaTyping() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('ready')
  const [sentence, setSentence] = useState('')
  const [input, setInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const startRef = useRef(null)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  const pick = () => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]

  const start = () => {
    const s = pick()
    setSentence(s)
    setInput('')
    setElapsed(0)
    setPhase('typing')
    startRef.current = null
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleInput = (val) => {
    if (!startRef.current) {
      startRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000)
      }, 100)
    }
    setInput(val)
    if (val.length >= sentence.length) finish(val)
  }

  const finish = (typed) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const secs = (Date.now() - startRef.current) / 1000
    const words = sentence.split(' ').length
    const w = Math.round((words / secs) * 60)
    setWpm(w)

    let correctChars = 0
    for (let i = 0; i < sentence.length; i++) {
      if (typed[i] === sentence[i]) correctChars++
    }
    const acc = Math.round((correctChars / sentence.length) * 100)
    setAccuracy(acc)
    setElapsed(secs)
    setPhase('done')
    sfx.achievement()
    saveTypingRecord({ date: new Date().toISOString(), wpm: w, accuracy: acc, seconds: Math.round(secs) })
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const records = loadTypingRecords()
  const bestWPM = records.length ? Math.max(...records.map(r => r.wpm)) : 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => { if (timerRef.current) clearInterval(timerRef.current); navigate('/') }} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {phase === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⌨️</div>
            <div style={{ fontFamily: C.display, fontSize: 28, color: C.teal }}>TYPING TEST</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 20 }}>
              Type the sentence as fast and accurately as you can.
            </div>
            {bestWPM > 0 && (
              <div style={{ fontSize: 12, color: C.gold, marginBottom: 16 }}>🏆 Personal best: {bestWPM} WPM</div>
            )}
            <button onClick={start} style={btn}>Start</button>
          </div>
        )}

        {phase === 'typing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 12 }}>
              <span>{Math.round(elapsed)}s</span>
              <span>{input.length}/{sentence.length} chars</span>
            </div>
            <div style={{
              padding: 16, background: C.surface, borderRadius: 14,
              border: `1px solid ${C.border}`, marginBottom: 16,
              fontSize: 15, lineHeight: 1.8, letterSpacing: 0.5,
            }}>
              {sentence.split('').map((ch, i) => {
                let color = C.dim
                if (i < input.length) {
                  color = input[i] === ch ? C.green : C.red
                } else if (i === input.length) {
                  color = C.teal
                }
                return <span key={i} style={{
                  color,
                  textDecoration: i === input.length ? 'underline' : 'none',
                  fontWeight: i === input.length ? 700 : 400,
                }}>{ch}</span>
              })}
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => handleInput(e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                width: '100%', padding: '14px 16px', background: C.surfaceLight,
                border: `2px solid ${C.teal}`, borderRadius: 14,
                color: C.text, fontSize: 15, fontFamily: C.mono,
                outline: 'none', resize: 'none', minHeight: 80,
                boxSizing: 'border-box', lineHeight: 1.8,
              }}
            />
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: C.display, fontSize: 72, color: wpm >= 60 ? C.gold : wpm >= 40 ? C.teal : C.amber, lineHeight: 1 }}>{wpm}</div>
            <div style={{ fontSize: 12, color: C.muted }}>words per minute</div>
            <div style={{ fontSize: 14, color: accuracy >= 95 ? C.green : accuracy >= 80 ? C.amber : C.red, marginTop: 8 }}>
              {accuracy}% accuracy
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
              {wpm >= 70 ? "That's elite. Most adults can't type that fast." :
               wpm >= 50 ? "Solid speed. Keep drilling and you'll hit 60+ easy." :
               wpm >= 30 ? "Getting there. Your fingers are warming up." :
               "Slow and steady. But mostly slow. Let's go again."}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={start} style={btn}>Again</button>
              <button onClick={() => navigate('/')} style={secBtn}>Done</button>
            </div>
            {records.length > 1 && (
              <div style={{ marginTop: 20, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>History</div>
                {records.slice(0, 8).map((r, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.muted, padding: '4px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.wpm} WPM · {r.accuracy}%</span>
                    <span>{new Date(r.date).toLocaleDateString()}</span>
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
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>TYPING</div>
    </div>
  )
}
const btn = { flex: 1, padding: '14px 20px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }
const secBtn = { flex: 1, padding: '14px 20px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: C.mono, cursor: 'pointer' }
