/**
 * Tennis Training Log + Match Tracker
 * Log sessions, track matches, personal records. Maya roasts and celebrates.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const TENNIS_KEY = 'maya_tennis'

function loadTennis() {
  try { return JSON.parse(localStorage.getItem(TENNIS_KEY)) || { sessions: [], matches: [] } }
  catch { return { sessions: [], matches: [] } }
}
function saveTennis(data) {
  try { localStorage.setItem(TENNIS_KEY, JSON.stringify(data)) } catch {}
}

export default function MayaTennis() {
  const navigate = useNavigate()
  const [data, setData] = useState(loadTennis())
  const [tab, setTab] = useState('sessions')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})

  const persist = (next) => { setData(next); saveTennis(next) }

  const addSession = () => {
    if (!form.drill) return
    const session = {
      id: `ts_${Date.now()}`,
      date: new Date().toISOString(),
      drill: form.drill,
      duration: parseInt(form.duration) || 60,
      notes: form.notes || '',
      intensity: form.intensity || 'medium',
    }
    persist({ ...data, sessions: [session, ...data.sessions] })
    setForm({}); setAdding(false)
  }

  const addMatch = () => {
    if (!form.opponent) return
    const match = {
      id: `tm_${Date.now()}`,
      date: new Date().toISOString(),
      opponent: form.opponent,
      score: form.score || '',
      result: form.result || 'win',
      notes: form.notes || '',
    }
    persist({ ...data, matches: [match, ...data.matches] })
    setForm({}); setAdding(false)
  }

  const remove = (type, id) => {
    if (!confirm('Delete?')) return
    const next = { ...data, [type]: data[type].filter(x => x.id !== id) }
    persist(next)
  }

  const wins = data.matches.filter(m => m.result === 'win').length
  const losses = data.matches.filter(m => m.result === 'loss').length
  const totalHours = Math.round(data.sessions.reduce((s, x) => s + (x.duration || 0), 0) / 60)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Sessions" value={data.sessions.length} color={C.teal} />
          <Stat label="Hours" value={totalHours} color={C.gold} />
          <Stat label="W / L" value={`${wins}-${losses}`} color={wins >= losses ? C.green : C.red} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['sessions', 'matches'].map(t => (
            <button key={t} onClick={() => { setTab(t); setAdding(false) }} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: tab === t ? C.teal + '22' : C.surface,
              border: `1px solid ${tab === t ? C.teal : C.border}`,
              color: tab === t ? C.teal : C.muted,
              fontSize: 12, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* Add button */}
        {!adding && (
          <button onClick={() => { setAdding(true); setForm({}) }} style={primary}>
            + Log {tab === 'sessions' ? 'training session' : 'match'}
          </button>
        )}

        {/* Add form */}
        {adding && tab === 'sessions' && (
          <FormCard>
            <Input label="What did you work on?" value={form.drill || ''} onChange={v => setForm({...form, drill: v})} placeholder="Serves, rallies, footwork..." />
            <Input label="Minutes" value={form.duration || ''} onChange={v => setForm({...form, duration: v})} placeholder="60" type="number" />
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Intensity</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {['light', 'medium', 'hard', 'match-level'].map(i => (
                <button key={i} onClick={() => setForm({...form, intensity: i})} style={{
                  flex: 1, padding: '6px', borderRadius: 6, fontSize: 10,
                  border: `1px solid ${form.intensity === i ? C.teal : C.border}`,
                  background: form.intensity === i ? C.teal + '22' : 'transparent',
                  color: form.intensity === i ? C.teal : C.muted,
                  fontFamily: C.mono, cursor: 'pointer', textTransform: 'capitalize',
                }}>{i}</button>
              ))}
            </div>
            <Input label="Notes" value={form.notes || ''} onChange={v => setForm({...form, notes: v})} placeholder="Optional" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={secondary}>Cancel</button>
              <button onClick={addSession} style={primary}>Save</button>
            </div>
          </FormCard>
        )}

        {adding && tab === 'matches' && (
          <FormCard>
            <Input label="Opponent" value={form.opponent || ''} onChange={v => setForm({...form, opponent: v})} placeholder="Name" />
            <Input label="Score" value={form.score || ''} onChange={v => setForm({...form, score: v})} placeholder="6-3, 4-6, 7-5" />
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Result</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {['win', 'loss', 'draw'].map(r => (
                <button key={r} onClick={() => setForm({...form, result: r})} style={{
                  flex: 1, padding: '8px', borderRadius: 6, fontSize: 11,
                  border: `1px solid ${form.result === r ? (r === 'win' ? C.green : r === 'loss' ? C.red : C.amber) : C.border}`,
                  background: form.result === r ? (r === 'win' ? C.green : r === 'loss' ? C.red : C.amber) + '22' : 'transparent',
                  color: form.result === r ? C.text : C.muted,
                  fontFamily: C.mono, cursor: 'pointer', textTransform: 'capitalize', fontWeight: 700,
                }}>{r === 'win' ? '🏆 Win' : r === 'loss' ? '❌ Loss' : '🤝 Draw'}</button>
              ))}
            </div>
            <Input label="Notes" value={form.notes || ''} onChange={v => setForm({...form, notes: v})} placeholder="Optional" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={secondary}>Cancel</button>
              <button onClick={addMatch} style={primary}>Save</button>
            </div>
          </FormCard>
        )}

        {/* List */}
        {tab === 'sessions' && data.sessions.map(s => (
          <div key={s.id} style={{
            padding: 12, background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>🎾 {s.drill}</div>
              <button onClick={() => remove('sessions', s.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              {s.duration}min · {s.intensity} · {new Date(s.date).toLocaleDateString()}
            </div>
            {s.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.notes}</div>}
          </div>
        ))}

        {tab === 'matches' && data.matches.map(m => (
          <div key={m.id} style={{
            padding: 12, background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`, marginBottom: 8,
            borderLeft: `3px solid ${m.result === 'win' ? C.green : m.result === 'loss' ? C.red : C.amber}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                vs {m.opponent} <span style={{ color: m.result === 'win' ? C.green : C.red }}>{m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}</span>
              </div>
              <button onClick={() => remove('matches', m.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            {m.score && <div style={{ fontSize: 12, color: C.gold, marginTop: 2 }}>{m.score}</div>}
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{new Date(m.date).toLocaleDateString()}</div>
            {m.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{m.notes}</div>}
          </div>
        ))}
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
function FormCard({ children }) {
  return (
    <div style={{ padding: 14, background: C.surfaceLight, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 12 }}>
      {children}
    </div>
  )
}
function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} style={{
        width: '100%', padding: '10px 12px', background: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 8,
        color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box',
      }} />
    </div>
  )
}
function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>TENNIS</div>
    </div>
  )
}
const primary = { width: '100%', padding: '12px 18px', background: C.teal, color: C.bg, border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }
const secondary = { flex: 1, padding: '12px 18px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: C.mono, cursor: 'pointer' }
