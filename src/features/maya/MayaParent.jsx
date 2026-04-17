import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import { loadProfile, saveProfile } from './lib/profile'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', gold: '#FFD700',
  green: '#34D399', red: '#F87171', amber: '#FBBF24', blue: '#93C5FD',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const gradeColors = { S: C.gold, A: C.green, B: C.blue, C: C.amber, F: C.red, '-': C.dim }

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [settingPin, setSettingPin] = useState(false)
  const profile = loadProfile()
  const hasPin = !!profile.parentPin

  const checkPin = () => {
    if (pin === profile.parentPin) {
      sessionStorage.setItem('parent_unlocked', '1')
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1500)
    }
  }

  const setNewPin = () => {
    if (pin.length === 4) {
      saveProfile({ ...profile, parentPin: pin })
      sessionStorage.setItem('parent_unlocked', '1')
      onUnlock()
    }
  }

  if (!hasPin && !settingPin) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: C.mono, maxWidth: 320 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.teal, letterSpacing: 2, marginBottom: 12 }}>PARENT ACCESS</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 24 }}>
            Set a 4-digit PIN to protect this section. Only you will need it.
          </div>
          <button onClick={() => setSettingPin(true)} style={{
            padding: '14px 28px', background: C.teal, color: C.bg,
            border: 'none', borderRadius: 12, fontSize: 14,
            fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
          }}>Set PIN</button>
          <div style={{ marginTop: 12 }}>
            <button onClick={onUnlock} style={{
              background: 'none', border: 'none', color: C.dim,
              fontSize: 10, fontFamily: C.mono, cursor: 'pointer', textDecoration: 'underline',
            }}>Skip for now</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: C.mono, maxWidth: 320 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>PARENT ACCESS</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 24 }}>
          {settingPin ? 'Choose a 4-digit PIN' : 'Enter your PIN'}
        </div>
        <input
          type="tel"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && pin.length === 4 && (settingPin ? setNewPin() : checkPin())}
          autoFocus
          style={{
            width: 180, padding: '16px', background: C.surface,
            border: `2px solid ${error ? C.red : C.border}`, borderRadius: 16,
            color: C.text, fontSize: 32, fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: 16, textAlign: 'center', outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 200ms',
          }}
        />
        {error && <div style={{ fontSize: 11, color: C.red, marginTop: 8 }}>Wrong PIN</div>}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={settingPin ? setNewPin : checkPin}
            disabled={pin.length !== 4}
            style={{
              padding: '12px 32px', background: C.teal, color: C.bg,
              border: 'none', borderRadius: 12, fontSize: 14,
              fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
              opacity: pin.length === 4 ? 1 : 0.4,
            }}
          >{settingPin ? 'Set PIN' : 'Unlock'}</button>
        </div>
      </div>
    </div>
  )
}

export default function MayaParent() {
  const navigate = useNavigate()
  const { getDailyReport, profile } = useMaya()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('parent_unlocked') === '1')
  const report = getDailyReport()
  const [copied, setCopied] = useState(false)

  if (!unlocked && profile?.parentPin) {
    return <PinGate onUnlock={() => setUnlocked(true)} />
  }
  if (!unlocked && !profile?.parentPin) {
    // First visit — offer to set PIN
    return <PinGate onUnlock={() => setUnlocked(true)} />
  }

  const reportText = () => {
    const lines = [
      `Coach Maya — ${profile?.name || 'Champ'} · ${report.date}`,
      ``,
      `Grade: ${report.grade} (${report.gradeLabel})`,
      `XP: ${report.xpEarned} · Level: ${report.level}`,
      `Tasks: ${report.tasksCompleted} done / ${report.tasksSkipped} skipped`,
      `Combo: ${report.combo}×`,
      report.mood && `Mood: ${report.mood}`,
      ``,
      `MVP Moment`,
      `  ${report.mvpMoment}`,
      report.concern && `\nOne concern`,
      report.concern && `  ${report.concern}`,
      ``,
      `Maya's recommendation`,
      `  ${report.recommendation}`,
      report.reflection && `\nReflection`,
      report.reflection && `  "${report.reflection}"`,
    ].filter(Boolean)
    return lines.join('\n')
  }

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const shareReport = async () => {
    const text = reportText()
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Coach Maya — ${profile?.name || 'Champ'} ${report.date}`,
          text,
        })
      } catch {}
    } else {
      copyReport()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: 'none', color: C.muted,
          fontSize: 18, cursor: 'pointer',
        }}>←</button>
        <div>
          <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2, lineHeight: 1 }}>
            PARENT REPORT
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{report.date} · {profile?.name}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={copyReport} style={{
            padding: '6px 10px', background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: 8,
            color: copied ? C.green : C.muted, fontSize: 10,
            fontFamily: C.mono, cursor: 'pointer',
          }}>{copied ? '✓ Copied' : 'Copy'}</button>
          <button onClick={shareReport} style={{
            padding: '6px 10px', background: C.teal,
            border: 'none', borderRadius: 8,
            color: C.bg, fontSize: 10, fontWeight: 700,
            fontFamily: C.mono, cursor: 'pointer',
          }}>Share</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Headline grade */}
        <div style={{
          padding: 24, background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Today's grade
          </div>
          <div style={{
            fontFamily: C.display, fontSize: 96, color: gradeColors[report.grade] || C.dim,
            lineHeight: 1, marginTop: 4,
          }}>{report.grade}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{report.gradeLabel}</div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="XP earned" value={report.xpEarned} color={C.teal} />
          <Stat label="Combo" value={`${report.combo}×`} color={report.combo >= 5 ? C.gold : report.combo >= 3 ? C.amber : C.muted} />
          <Stat label="Tasks done" value={`${report.tasksCompleted}/${report.tasksCompleted + report.tasksSkipped + report.tasksPending}`} color={C.green} />
          <Stat label="Skipped" value={report.tasksSkipped} color={report.tasksSkipped > 0 ? C.red : C.muted} />
        </div>

        {/* MVP moment */}
        <Card title="MVP moment" color={C.gold}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{report.mvpMoment}</div>
        </Card>

        {/* Concern */}
        {report.concern && (
          <Card title="One concern" color={C.amber}>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{report.concern}</div>
          </Card>
        )}

        {/* Recommendation */}
        <Card title="Maya's recommendation" color={C.teal}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{report.recommendation}</div>
        </Card>

        {/* Mood */}
        {report.mood && (
          <Card title="Mood today">
            <div style={{ fontSize: 13 }}>{report.mood}</div>
          </Card>
        )}

        {/* Reflection */}
        {report.reflection && (
          <Card title="Reflection">
            <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>"{report.reflection}"</div>
          </Card>
        )}

        {/* Timeline */}
        {report.timeline.length > 0 && (
          <Card title="Timeline">
            {report.timeline.map((e, i) => (
              <div key={i} style={{
                padding: '6px 0',
                borderBottom: i < report.timeline.length - 1 ? `1px solid ${C.border}` : 'none',
                fontSize: 11, color: C.muted, display: 'flex', justifyContent: 'space-between',
              }}>
                <span>
                  <span style={{ color: e.type === 'task_complete' ? C.green : e.type === 'task_skip' ? C.red : C.blue, marginRight: 6 }}>
                    {e.type === 'task_complete' ? '✓' : e.type === 'task_skip' ? '✗' : '●'}
                  </span>
                  {e.label} {e.xp ? <span style={{ color: C.teal }}>+{e.xp} XP</span> : null}
                </span>
                <span>{new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: 14, background: C.surface,
      borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Card({ title, color, children }) {
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, marginBottom: 10,
      borderLeft: color ? `3px solid ${color}` : `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 9, color: color || C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
