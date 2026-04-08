import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', gold: '#FFD700',
  green: '#22C55E', red: '#EF4444', amber: '#FFA500', blue: '#7db8e8',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const gradeColors = { S: C.gold, A: C.green, B: C.blue, C: C.amber, F: C.red, '-': C.dim }

export default function MayaParent() {
  const navigate = useNavigate()
  const { getDailyReport, profile } = useMaya()
  const report = getDailyReport()
  const [copied, setCopied] = useState(false)

  const reportText = () => {
    const lines = [
      `Coach Maya — ${profile?.name || 'Vasco'} · ${report.date}`,
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
          title: `Coach Maya — ${profile?.name || 'Vasco'} ${report.date}`,
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
