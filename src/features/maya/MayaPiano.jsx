/**
 * Piano Practice Mode — metronome + practice log + piece tracker.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const PIANO_KEY = 'maya_piano'
function loadPiano() {
  try { return JSON.parse(localStorage.getItem(PIANO_KEY)) || { pieces: [], logs: [] } }
  catch { return { pieces: [], logs: [] } }
}
function savePiano(data) {
  try { localStorage.setItem(PIANO_KEY, JSON.stringify(data)) } catch {}
}

// Web Audio metronome
let metroCtx = null
function tick(bpm) {
  if (!metroCtx) metroCtx = new (window.AudioContext || window.webkitAudioContext)()
  const osc = metroCtx.createOscillator()
  const gain = metroCtx.createGain()
  osc.connect(gain); gain.connect(metroCtx.destination)
  osc.frequency.value = 880
  osc.type = 'sine'
  const now = metroCtx.currentTime
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.start(now); osc.stop(now + 0.08)
}

export default function MayaPiano() {
  const navigate = useNavigate()
  const [data, setData] = useState(loadPiano())
  const [bpm, setBpm] = useState(80)
  const [metroOn, setMetroOn] = useState(false)
  const [practicing, setPracticing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})
  const metroRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  const persist = (next) => { setData(next); savePiano(next) }

  // Metronome
  useEffect(() => {
    if (metroOn) {
      const interval = 60000 / bpm
      metroRef.current = setInterval(() => tick(bpm), interval)
    } else {
      if (metroRef.current) clearInterval(metroRef.current)
    }
    return () => { if (metroRef.current) clearInterval(metroRef.current) }
  }, [metroOn, bpm])

  const startPractice = () => {
    setPracticing(true)
    setElapsed(0)
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
  }

  const stopPractice = () => {
    setPracticing(false)
    setMetroOn(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const mins = Math.round(elapsed / 60)
    if (mins >= 1) {
      const log = { id: `pl_${Date.now()}`, date: new Date().toISOString(), minutes: mins, bpm, piece: form.currentPiece || '' }
      persist({ ...data, logs: [log, ...data.logs] })
      sfx.taskComplete()
    }
  }

  const addPiece = () => {
    if (!form.title) return
    const piece = { id: `pp_${Date.now()}`, title: form.title, composer: form.composer || '', status: 'learning', addedAt: new Date().toISOString() }
    persist({ ...data, pieces: [piece, ...data.pieces] })
    setForm({}); setAdding(false)
  }

  const togglePieceStatus = (id) => {
    const pieces = data.pieces.map(p => p.id === id ? { ...p, status: p.status === 'learning' ? 'mastered' : 'learning' } : p)
    persist({ ...data, pieces })
  }

  const totalHours = Math.round(data.logs.reduce((s, l) => s + (l.minutes || 0), 0) / 60 * 10) / 10
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => { setMetroOn(false); navigate('/') }} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Sessions" value={data.logs.length} color={C.teal} />
          <Stat label="Hours" value={totalHours} color={C.gold} />
          <Stat label="Pieces" value={data.pieces.length} color={C.green} />
        </div>

        {/* Metronome */}
        <div style={{
          padding: 20, background: C.surface, borderRadius: 16,
          border: `1px solid ${metroOn ? C.teal + '55' : C.border}`, marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Metronome
          </div>
          <div style={{ fontFamily: C.display, fontSize: 64, color: metroOn ? C.teal : C.text, lineHeight: 1 }}>
            {bpm}
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>BPM</div>
          <input
            type="range" min={40} max={200} value={bpm}
            onChange={e => setBpm(parseInt(e.target.value))}
            style={{ width: '80%', marginTop: 12, accentColor: C.teal }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
            {[60, 80, 100, 120].map(b => (
              <button key={b} onClick={() => setBpm(b)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 10,
                border: `1px solid ${bpm === b ? C.teal : C.border}`,
                background: bpm === b ? C.teal + '22' : 'transparent',
                color: bpm === b ? C.teal : C.muted,
                fontFamily: C.mono, cursor: 'pointer',
              }}>{b}</button>
            ))}
          </div>
          <button onClick={() => setMetroOn(!metroOn)} style={{
            marginTop: 12, padding: '10px 24px',
            background: metroOn ? C.red : C.teal,
            border: 'none', borderRadius: 10,
            color: C.bg, fontSize: 13, fontWeight: 700,
            fontFamily: C.mono, cursor: 'pointer',
          }}>{metroOn ? '⏹ Stop' : '▶ Start'}</button>
        </div>

        {/* Practice timer */}
        <div style={{
          padding: 18, background: C.surface, borderRadius: 16,
          border: `1px solid ${practicing ? C.gold + '55' : C.border}`, marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Practice timer
          </div>
          {practicing ? (
            <>
              <div style={{ fontFamily: C.display, fontSize: 56, color: C.gold, lineHeight: 1 }}>
                {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
              </div>
              <button onClick={stopPractice} style={{
                marginTop: 12, padding: '10px 24px', background: C.red,
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 13,
                fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
              }}>⏹ End practice</button>
            </>
          ) : (
            <button onClick={startPractice} style={{
              padding: '12px 24px', background: C.gold,
              border: 'none', borderRadius: 10, color: C.bg, fontSize: 13,
              fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
            }}>🎹 Start practice</button>
          )}
        </div>

        {/* Pieces */}
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Repertoire
        </div>
        {!adding && (
          <button onClick={() => { setAdding(true); setForm({}) }} style={btn}>+ Add piece</button>
        )}
        {adding && (
          <div style={{ padding: 14, background: C.surfaceLight, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <Inp label="Title" value={form.title || ''} onChange={v => setForm({ ...form, title: v })} />
            <Inp label="Composer" value={form.composer || ''} onChange={v => setForm({ ...form, composer: v })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={secBtn}>Cancel</button>
              <button onClick={addPiece} style={btn}>Save</button>
            </div>
          </div>
        )}
        {data.pieces.map(p => (
          <div key={p.id} onClick={() => togglePieceStatus(p.id)} style={{
            padding: 12, background: C.surface, borderRadius: 10,
            border: `1px solid ${C.border}`, marginBottom: 6, cursor: 'pointer',
            borderLeft: `3px solid ${p.status === 'mastered' ? C.gold : C.teal}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>🎹 {p.title}</div>
            {p.composer && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.composer}</div>}
            <div style={{ fontSize: 9, color: p.status === 'mastered' ? C.gold : C.teal, marginTop: 4, textTransform: 'uppercase' }}>
              {p.status === 'mastered' ? '✓ Mastered' : '● Learning'}
            </div>
          </div>
        ))}

        {/* Recent sessions */}
        {data.logs.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 }}>
              Recent sessions
            </div>
            {data.logs.slice(0, 15).map(l => (
              <div key={l.id} style={{ fontSize: 11, color: C.muted, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                {l.minutes}min {l.bpm && `@ ${l.bpm}bpm`} {l.piece && `· ${l.piece}`}
                <span style={{ float: 'right', fontSize: 9 }}>{new Date(l.date).toLocaleDateString()}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}
function Inp({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box',
      }} />
    </div>
  )
}
function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>PIANO</div>
    </div>
  )
}
const btn = { width: '100%', padding: '12px 18px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }
const secBtn = { flex: 1, padding: '12px 18px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: C.mono, cursor: 'pointer' }
