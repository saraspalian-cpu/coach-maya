/**
 * Piano — competition piece tracker + metronome + practice log.
 * For ABRSM Grade 6+ with 25+ international competition awards.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import sfx from './lib/sfx'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', glassBorder: 'rgba(255,255,255,0.14)',
  text: '#f0f0f5', muted: '#6b6b8a', dim: '#3a3a55',
  teal: '#2DD4BF', red: '#F87171', green: '#34D399',
  gold: '#FFD700', amber: '#FBBF24', purple: '#A78BFA',
  glass: 'rgba(255,255,255,0.08)', blur: 'blur(20px)',
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

const STATUS_CONFIG = {
  learning:    { label: 'Learning', color: C.teal, icon: '📖' },
  polishing:   { label: 'Polishing', color: C.amber, icon: '✨' },
  performance: { label: 'Performance-ready', color: C.green, icon: '🎯' },
  competition: { label: 'Competition piece', color: C.gold, icon: '🏆' },
  mastered:    { label: 'Mastered', color: C.purple, icon: '⭐' },
}

const STATUSES = Object.keys(STATUS_CONFIG)

// Web Audio metronome
let metroCtx = null
function tick() {
  if (!metroCtx) metroCtx = new (window.AudioContext || window.webkitAudioContext)()
  const osc = metroCtx.createOscillator()
  const gain = metroCtx.createGain()
  osc.connect(gain); gain.connect(metroCtx.destination)
  osc.frequency.value = 880; osc.type = 'sine'
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
  const [practiceNotes, setPracticeNotes] = useState('')
  const [practicePiece, setPracticePiece] = useState('')
  const [view, setView] = useState('pieces') // pieces | practice | log
  const [addForm, setAddForm] = useState(null)
  const metroRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  const persist = (next) => { setData(next); savePiano(next) }

  // Metronome
  useEffect(() => {
    if (metroOn) {
      const interval = 60000 / bpm
      metroRef.current = setInterval(() => tick(), interval)
    } else {
      if (metroRef.current) clearInterval(metroRef.current)
    }
    return () => { if (metroRef.current) clearInterval(metroRef.current) }
  }, [metroOn, bpm])

  const startPractice = () => {
    setPracticing(true); setElapsed(0); setPracticeNotes('')
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
  }

  const stopPractice = () => {
    setPracticing(false); setMetroOn(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const mins = Math.round(elapsed / 60)
    if (mins >= 1) {
      const log = {
        id: `pl_${Date.now()}`, date: new Date().toISOString(), minutes: mins,
        bpm, piece: practicePiece, notes: practiceNotes,
      }
      persist({ ...data, logs: [log, ...data.logs].slice(0, 300) })
      sfx.taskComplete?.()
    }
  }

  const addPiece = () => {
    if (!addForm?.title) return
    const piece = {
      id: `pp_${Date.now()}`, title: addForm.title, composer: addForm.composer || '',
      status: addForm.status || 'learning', targetBpm: parseInt(addForm.targetBpm) || 0,
      currentBpm: parseInt(addForm.currentBpm) || 0, readiness: parseInt(addForm.readiness) || 0,
      sections: addForm.sections || '', compName: addForm.compName || '',
      addedAt: new Date().toISOString(),
    }
    persist({ ...data, pieces: [piece, ...data.pieces] })
    setAddForm(null)
  }

  const updatePiece = (id, updates) => {
    persist({ ...data, pieces: data.pieces.map(p => p.id === id ? { ...p, ...updates } : p) })
  }

  const removePiece = (id) => persist({ ...data, pieces: data.pieces.filter(p => p.id !== id) })

  const totalHours = Math.round(data.logs.reduce((s, l) => s + (l.minutes || 0), 0) / 60 * 10) / 10
  const compPieces = data.pieces.filter(p => p.status === 'competition')
  const avgReadiness = compPieces.length
    ? Math.round(compPieces.reduce((s, p) => s + (p.readiness || 0), 0) / compPieces.length)
    : 0
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: C.mono, paddingBottom: 80, position: 'relative' }}>
      <Header onBack={() => { setMetroOn(false); navigate('/') }} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Hours" value={totalHours} color={C.gold} />
          <Stat label="Pieces" value={data.pieces.length} color={C.teal} />
          <Stat label="Comp" value={compPieces.length} color={C.amber} />
          <Stat label="Ready" value={avgReadiness ? `${avgReadiness}%` : '—'} color={avgReadiness >= 80 ? C.green : C.amber} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['pieces', 'practice', 'log'].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              flex: 1, padding: 10, background: view === t ? C.purple + '18' : C.surface,
              border: `1px solid ${view === t ? C.purple : C.border}`, borderRadius: 10,
              color: view === t ? C.purple : C.muted, fontSize: 11, fontFamily: C.mono,
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        {/* ─── Pieces Tab ─── */}
        {view === 'pieces' && (
          <>
            {addForm ? (
              <div style={{ padding: 16, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur, borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Add piece</div>
                <Inp label="Title" value={addForm.title || ''} onChange={v => setAddForm({ ...addForm, title: v })} />
                <Inp label="Composer" value={addForm.composer || ''} onChange={v => setAddForm({ ...addForm, composer: v })} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Inp label="Target BPM" value={addForm.targetBpm || ''} onChange={v => setAddForm({ ...addForm, targetBpm: v })} type="number" />
                  <Inp label="Current BPM" value={addForm.currentBpm || ''} onChange={v => setAddForm({ ...addForm, currentBpm: v })} type="number" />
                </div>
                <Inp label="Sections to work on" value={addForm.sections || ''} onChange={v => setAddForm({ ...addForm, sections: v })} placeholder="e.g. bars 32-48, coda" />
                <Inp label="Competition (if any)" value={addForm.compName || ''} onChange={v => setAddForm({ ...addForm, compName: v })} placeholder="e.g. Staccato Int'l" />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Status</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => setAddForm({ ...addForm, status: s })} style={{
                        padding: '5px 10px', background: addForm.status === s ? STATUS_CONFIG[s].color + '22' : C.surface,
                        border: `1px solid ${addForm.status === s ? STATUS_CONFIG[s].color : C.border}`, borderRadius: 8,
                        color: addForm.status === s ? STATUS_CONFIG[s].color : C.muted, fontSize: 9, fontFamily: C.mono, cursor: 'pointer',
                      }}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Readiness %</div>
                  <input type="range" min={0} max={100} value={addForm.readiness || 0}
                    onChange={e => setAddForm({ ...addForm, readiness: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: C.purple }} />
                  <div style={{ fontSize: 11, color: C.purple, textAlign: 'center' }}>{addForm.readiness || 0}%</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAddForm(null)} style={secBtn}>Cancel</button>
                  <button onClick={addPiece} style={primBtn}>Save</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddForm({ status: 'learning', readiness: 0 })} style={{
                width: '100%', padding: 14, background: C.glass, border: `2px dashed ${C.glassBorder}`,
                borderRadius: 14, color: C.purple, fontSize: 12, fontFamily: C.mono, cursor: 'pointer', marginBottom: 12,
              }}>+ Add piece</button>
            )}

            {data.pieces.map(p => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.learning
              return (
                <div key={p.id} style={{
                  padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
                  borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginBottom: 8,
                  borderLeft: `3px solid ${cfg.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>🎹 {p.title}</div>
                      {p.composer && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.composer}</div>}
                    </div>
                    <button onClick={() => removePiece(p.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>

                  {/* Readiness bar */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginBottom: 3 }}>
                      <span>{cfg.icon} {cfg.label}</span>
                      <span style={{ color: cfg.color }}>{p.readiness || 0}% ready</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.readiness || 0}%`, background: cfg.color, borderRadius: 3, transition: 'width 300ms' }} />
                    </div>
                  </div>

                  {/* Details row */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 10, color: C.muted, flexWrap: 'wrap' }}>
                    {p.currentBpm > 0 && <span>BPM: {p.currentBpm}{p.targetBpm > 0 ? `/${p.targetBpm}` : ''}</span>}
                    {p.sections && <span>Focus: {p.sections}</span>}
                    {p.compName && <span style={{ color: C.gold }}>🏆 {p.compName}</span>}
                  </div>

                  {/* Quick update buttons */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button onClick={() => updatePiece(p.id, { readiness: Math.min(100, (p.readiness || 0) + 10) })} style={smallBtn}>+10%</button>
                    {STATUSES.filter(s => s !== p.status).slice(0, 2).map(s => (
                      <button key={s} onClick={() => updatePiece(p.id, { status: s })} style={{
                        ...smallBtn, color: STATUS_CONFIG[s].color, borderColor: STATUS_CONFIG[s].color + '44',
                      }}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ─── Practice Tab ─── */}
        {view === 'practice' && (
          <>
            {/* Metronome */}
            <div style={{
              padding: 20, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
              borderRadius: 16, border: `1px solid ${metroOn ? C.teal + '55' : C.glassBorder}`, marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Metronome</div>
              <div style={{ fontFamily: C.display, fontSize: 56, color: metroOn ? C.teal : C.text, lineHeight: 1 }}>{bpm}</div>
              <div style={{ fontSize: 10, color: C.muted }}>BPM</div>
              <input type="range" min={40} max={200} value={bpm} onChange={e => setBpm(parseInt(e.target.value))}
                style={{ width: '80%', marginTop: 12, accentColor: C.teal }} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {[60, 80, 100, 120, 140].map(b => (
                  <button key={b} onClick={() => setBpm(b)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10,
                    border: `1px solid ${bpm === b ? C.teal : C.border}`,
                    background: bpm === b ? C.teal + '22' : 'transparent',
                    color: bpm === b ? C.teal : C.muted, fontFamily: C.mono, cursor: 'pointer',
                  }}>{b}</button>
                ))}
              </div>
              <button onClick={() => setMetroOn(!metroOn)} style={{
                marginTop: 12, padding: '10px 24px', background: metroOn ? C.red : C.teal,
                border: 'none', borderRadius: 10, color: '#0a0a14', fontSize: 13, fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
              }}>{metroOn ? '⏹ Stop' : '▶ Start'}</button>
            </div>

            {/* Practice timer */}
            <div style={{
              padding: 18, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
              borderRadius: 16, border: `1px solid ${practicing ? C.gold + '55' : C.glassBorder}`, marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Practice session</div>
              {practicing ? (
                <>
                  <div style={{ fontFamily: C.display, fontSize: 56, color: C.gold, lineHeight: 1 }}>
                    {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                  </div>
                  {data.pieces.length > 0 && (
                    <select value={practicePiece} onChange={e => setPracticePiece(e.target.value)} style={{
                      marginTop: 10, padding: '6px 10px', background: '#0a0a14', border: `1px solid ${C.border}`,
                      borderRadius: 8, color: C.text, fontSize: 11, fontFamily: C.mono, outline: 'none',
                    }}>
                      <option value="">— Select piece —</option>
                      {data.pieces.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                    </select>
                  )}
                  <input value={practiceNotes} onChange={e => setPracticeNotes(e.target.value)}
                    placeholder="Session notes..." style={{
                      width: '100%', marginTop: 8, padding: '8px 12px', background: '#0a0a14',
                      border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11,
                      fontFamily: C.mono, outline: 'none', boxSizing: 'border-box', textAlign: 'center',
                    }} />
                  <button onClick={stopPractice} style={{
                    marginTop: 12, padding: '10px 24px', background: C.red,
                    border: 'none', borderRadius: 10, color: '#fff', fontSize: 13,
                    fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
                  }}>⏹ End session</button>
                </>
              ) : (
                <button onClick={startPractice} style={{
                  padding: '14px 28px', background: C.gold, border: 'none', borderRadius: 12,
                  color: '#0a0a14', fontSize: 14, fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
                }}>🎹 Start practice</button>
              )}
            </div>
          </>
        )}

        {/* ─── Log Tab ─── */}
        {view === 'log' && (
          <>
            {data.logs.length === 0 && (
              <div style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 32 }}>No sessions logged yet.</div>
            )}
            {data.logs.slice(0, 30).map(l => (
              <div key={l.id} style={{
                padding: 10, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
                borderRadius: 10, border: `1px solid ${C.glassBorder}`, marginBottom: 6,
                borderLeft: `3px solid ${C.purple}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{l.minutes}min {l.bpm ? `@ ${l.bpm}bpm` : ''}</span>
                  <span style={{ fontSize: 9, color: C.muted }}>{new Date(l.date).toLocaleDateString()}</span>
                </div>
                {l.piece && <div style={{ fontSize: 10, color: C.purple, marginTop: 2 }}>🎹 {l.piece}</div>}
                {l.notes && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l.notes}</div>}
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
    <div style={{ padding: 10, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur, borderRadius: 12, border: `1px solid ${C.glassBorder}`, textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}
function Inp({ label, value, onChange, placeholder, type }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} style={{
        width: '100%', padding: '10px 12px', background: '#0a0a14', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box',
      }} />
    </div>
  )
}
function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.glassBorder}`, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.purple, letterSpacing: 2 }}>PIANO</div>
    </div>
  )
}
const primBtn = { flex: 1, padding: '12px 18px', background: C.purple, color: '#0a0a14', border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }
const secBtn = { flex: 1, padding: '12px 18px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: C.mono, cursor: 'pointer' }
const smallBtn = { padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#6b6b8a', fontSize: 9, fontFamily: C.mono, cursor: 'pointer' }
