/**
 * Sleep Tracker — log bedtime + wake time. Maya calculates hours,
 * tracks sleep debt, nudges better habits.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  purple: '#A78BFA',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const SLEEP_KEY = 'maya_sleep'
const TARGET_HOURS = 9

function loadSleep() {
  try { return JSON.parse(localStorage.getItem(SLEEP_KEY)) || [] } catch { return [] }
}
function saveSleep(data) {
  try { localStorage.setItem(SLEEP_KEY, JSON.stringify(data.slice(0, 90))) } catch {}
}

export default function MayaSleep() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState(loadSleep())
  const [bedtime, setBedtime] = useState('22:00')
  const [wakeTime, setWakeTime] = useState('07:00')

  const persist = (next) => { setLogs(next); saveSleep(next) }

  const logNight = () => {
    const [bH, bM] = bedtime.split(':').map(Number)
    const [wH, wM] = wakeTime.split(':').map(Number)
    let hours = wH + wM / 60 - (bH + bM / 60)
    if (hours < 0) hours += 24
    hours = Math.round(hours * 10) / 10

    const entry = {
      id: `sl_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      bedtime,
      wakeTime,
      hours,
    }
    persist([entry, ...logs])
  }

  const remove = (id) => persist(logs.filter(l => l.id !== id))

  const last7 = logs.slice(0, 7)
  const avgHours = last7.length ? Math.round(last7.reduce((s, l) => s + l.hours, 0) / last7.length * 10) / 10 : 0
  const debtHours = last7.length ? Math.round((TARGET_HOURS * last7.length - last7.reduce((s, l) => s + l.hours, 0)) * 10) / 10 : 0
  const streak = (() => {
    let s = 0
    for (const l of logs) { if (l.hours >= 8) s++; else break }
    return s
  })()

  const commentary = avgHours >= 9 ? "Elite recovery. Your brain thanks you."
    : avgHours >= 8 ? "Solid. Most kids your age don't sleep this well."
    : avgHours >= 7 ? "Decent but you're leaving brain power on the table."
    : avgHours >= 6 ? "Not enough. Your focus tomorrow will pay the price."
    : "Danger zone. Your brain literally can't consolidate memories like this."

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Avg hours" value={avgHours || '—'} color={avgHours >= 8 ? C.green : avgHours >= 7 ? C.amber : C.red} />
          <Stat label="Sleep debt" value={debtHours > 0 ? `${debtHours}h` : '0h'} color={debtHours > 5 ? C.red : debtHours > 2 ? C.amber : C.green} />
          <Stat label="8hr streak" value={`${streak}d`} color={streak > 0 ? C.gold : C.muted} />
        </div>

        {avgHours > 0 && (
          <div style={{ padding: 12, background: C.surfaceLight, borderRadius: 10, borderLeft: `3px solid ${C.purple}`, marginBottom: 16, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
            {commentary}
          </div>
        )}

        {/* Log form */}
        <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Log last night</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Bedtime</div>
              <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Wake time</div>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={inp} />
            </div>
          </div>
          <button onClick={logNight} style={btn}>Log sleep</button>
        </div>

        {/* Sleep chart */}
        {last7.length > 0 && (
          <div style={{ padding: 14, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Last 7 nights</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 6 }}>
              {[...last7].reverse().map((l, i) => {
                const pct = Math.min((l.hours / 12) * 100, 100)
                const color = l.hours >= 9 ? C.green : l.hours >= 8 ? C.teal : l.hours >= 7 ? C.amber : C.red
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: C.muted }}>{l.hours}h</div>
                    <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: 4, minHeight: 4 }} />
                    <div style={{ fontSize: 8, color: C.dim }}>{l.date.slice(5)}</div>
                  </div>
                )
              })}
            </div>
            {/* Target line */}
            <div style={{ fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 4 }}>Target: {TARGET_HOURS}h</div>
          </div>
        )}

        {/* History */}
        {logs.length > 0 && (
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>History</div>
        )}
        {logs.slice(0, 14).map(l => (
          <div key={l.id} style={{
            padding: 10, background: C.surface, borderRadius: 10,
            border: `1px solid ${C.border}`, marginBottom: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderLeft: `3px solid ${l.hours >= 8 ? C.green : l.hours >= 7 ? C.amber : C.red}`,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{l.hours}h</div>
              <div style={{ fontSize: 9, color: C.muted }}>{l.bedtime} → {l.wakeTime}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 9, color: C.muted }}>{l.date}</div>
              <button onClick={() => remove(l.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
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
function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.purple, letterSpacing: 2 }}>SLEEP</div>
    </div>
  )
}
const inp = { width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box' }
const btn = { width: '100%', padding: '12px', background: C.purple, color: C.bg, border: 'none', borderRadius: 12, fontSize: 13, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }
