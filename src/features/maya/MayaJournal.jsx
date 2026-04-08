import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import { listen, isSTTSupported } from './lib/voice'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const JOURNAL_KEY = 'maya_journal'

function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntry(entry) {
  const all = loadJournal()
  all.unshift(entry)
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(all.slice(0, 200))) } catch {}
  return all
}

const PROMPTS = [
  "What's one thing that worked today?",
  "What's something you'd change?",
  "What was the hardest part of the day?",
  "What made you laugh today?",
  "Who showed up for you today?",
  "What did you learn today?",
  "What are you actually proud of today?",
  "If today was a 1-line headline, what would it be?",
  "What did you avoid today, and why?",
  "What's one thing you want tomorrow to look like?",
]

export default function MayaJournal() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [text, setText] = useState('')
  const [entries, setEntries] = useState(loadJournal())
  const [prompt, setPrompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  const [listening, setListening] = useState(false)
  const [stopFn, setStopFn] = useState(null)

  useEffect(() => {
    return () => { try { stopFn?.() } catch {} }
  }, [stopFn])

  const startVoice = () => {
    if (!isSTTSupported()) {
      alert('Voice not supported in this browser.')
      return
    }
    setListening(true)
    const stop = listen({
      onResult: (transcript, isFinal) => {
        setText(prev => isFinal ? `${prev} ${transcript}`.trim() : prev)
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    })
    setStopFn(() => stop)
  }

  const stopVoice = () => {
    try { stopFn?.() } catch {}
    setListening(false)
  }

  const submit = async () => {
    if (!text.trim()) return
    const entry = {
      id: `j_${Date.now()}`,
      date: new Date().toISOString(),
      prompt,
      text: text.trim(),
    }
    const next = saveEntry(entry)
    setEntries(next)
    setText('')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

    // Maya reflects back
    maya.sendMessage(`Journal: ${entry.text}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Prompt */}
        <div style={{
          padding: 18, background: C.surface, borderRadius: 16,
          border: `1px solid ${C.teal}33`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Today's prompt
          </div>
          <div style={{ fontSize: 16, color: C.text, lineHeight: 1.5 }}>{prompt}</div>
          <button
            onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
            style={{
              marginTop: 8, padding: '4px 10px', background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 6,
              color: C.muted, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
            }}
          >🔄 New prompt</button>
        </div>

        {/* Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or tap the mic..."
          style={{
            width: '100%', padding: '14px 16px', background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 12,
            color: C.text, fontSize: 14, fontFamily: C.mono, outline: 'none',
            minHeight: 140, resize: 'vertical', boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={listening ? stopVoice : startVoice}
            style={{
              padding: '14px 16px',
              background: listening ? C.red : 'transparent',
              border: `1px solid ${listening ? C.red : C.teal}`,
              borderRadius: 12,
              color: listening ? '#fff' : C.teal,
              fontSize: 16, cursor: 'pointer',
            }}
          >🎤</button>
          <button
            onClick={submit}
            disabled={!text.trim()}
            style={{
              flex: 1, padding: '14px', background: text.trim() ? C.teal : C.dim,
              border: 'none', borderRadius: 12,
              color: C.bg, fontSize: 13, fontWeight: 700,
              fontFamily: C.mono, cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
          >Save entry</button>
        </div>

        {/* Past entries */}
        {entries.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Past entries ({entries.length})
            </div>
            {entries.slice(0, 30).map(e => (
              <div key={e.id} style={{
                padding: 14, background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, marginBottom: 8,
              }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>
                  {new Date(e.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div style={{ fontSize: 11, color: C.teal, marginBottom: 6, fontStyle: 'italic' }}>"{e.prompt}"</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{e.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
      background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>JOURNAL</div>
    </div>
  )
}
