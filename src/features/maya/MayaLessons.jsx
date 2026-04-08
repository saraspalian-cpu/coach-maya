import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadHistory, deleteLesson } from './agents/lessonAnalyst'
import { getAudio, deleteAudio } from './lib/audioStore'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaLessons() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState(loadHistory())
  const [open, setOpen] = useState(null)
  const [audioUrls, setAudioUrls] = useState({}) // id -> object url
  const audioRef = useRef(null)

  const remove = (id) => {
    if (!confirm('Delete this lesson?')) return
    setLessons(deleteLesson(id))
    deleteAudio(id).catch(() => {})
  }

  const exportLesson = (lesson) => {
    const lines = [
      `# ${lesson.subject} Lesson`,
      ``,
      `**Date:** ${new Date(lesson.startedAt).toLocaleString()}`,
      `**Duration:** ${lesson.durationMin} min`,
      `**Words captured:** ${lesson.wordCount}`,
      `**XP earned:** ${lesson.xpEarned || 0}`,
      lesson.grading && `**Quiz score:** ${lesson.grading.overallScore}/100`,
      lesson.grading?.feedback && `**Maya's feedback:** ${lesson.grading.feedback}`,
      ``,
      `## Key Takeaways`,
      ...(lesson.keyPoints || []).map((kp, i) => `${i + 1}. ${kp}`),
      ``,
      `## Quiz Q&A`,
      ...(lesson.quiz || []).flatMap((q, i) => [
        `### Q${i + 1}: ${q.q}`,
        `> ${q.a || '(no answer)'}`,
        '',
      ]),
      `## Full Transcript`,
      lesson.fullTranscript || '(none)',
    ].filter(Boolean)
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-${lesson.subject.toLowerCase()}-${(lesson.startedAt || '').slice(0, 10)}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }

  const loadAudio = async (id) => {
    if (audioUrls[id]) return
    const blob = await getAudio(id)
    if (blob) {
      const url = URL.createObjectURL(blob)
      setAudioUrls(prev => ({ ...prev, [id]: url }))
    }
  }

  const totalLessons = lessons.length
  const totalMinutes = lessons.reduce((s, l) => s + (l.durationMin || 0), 0)
  const totalXP = lessons.reduce((s, l) => s + (l.xpEarned || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} title="Lesson Vault" />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Stats card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Lessons" value={totalLessons} color={C.teal} />
          <Stat label="Minutes" value={totalMinutes} color={C.gold} />
          <Stat label="XP earned" value={totalXP} color={C.green} />
        </div>

        <button
          onClick={() => navigate('/lesson')}
          style={{
            width: '100%', padding: '14px 20px', background: C.teal,
            color: C.bg, border: 'none', borderRadius: 12,
            fontSize: 14, fontFamily: C.mono, fontWeight: 700,
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          🎙 Start a new lesson
        </button>

        {lessons.length === 0 && (
          <div style={{
            padding: 32, textAlign: 'center', color: C.muted,
            border: `1px dashed ${C.border}`, borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 13 }}>No lessons yet.</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
              Tap above to record your first one.
            </div>
          </div>
        )}

        {lessons.map(l => (
          <div key={l.id} style={{
            padding: 14, background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`, marginBottom: 8,
          }}>
            <div
              onClick={() => {
                const next = open === l.id ? null : l.id
                setOpen(next)
                if (next) loadAudio(l.id)
              }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{l.subject}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    {new Date(l.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} · {l.durationMin}m · {l.wordCount} words
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: C.teal, fontWeight: 600 }}>+{l.xpEarned || 0} XP</div>
                  <div style={{ fontSize: 9, color: C.dim }}>tap to expand</div>
                </div>
              </div>
            </div>

            {open === l.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                {audioUrls[l.id] && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Listen back</div>
                    <audio controls src={audioUrls[l.id]} style={{ width: '100%' }} />
                  </div>
                )}
                {l.grading && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Quiz score</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: l.grading.overallScore >= 80 ? C.gold : l.grading.overallScore >= 60 ? C.green : C.amber }}>
                      {l.grading.overallScore}/100
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.grading.feedback}</div>
                  </div>
                )}
                {l.keyPoints?.length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Takeaways</div>
                    {l.keyPoints.map((kp, i) => (
                      <div key={i} style={{
                        padding: '8px 10px', background: C.surfaceLight,
                        borderLeft: `2px solid ${C.gold}`, borderRadius: 4,
                        marginBottom: 4, fontSize: 11, color: C.text, lineHeight: 1.5,
                      }}>{kp}</div>
                    ))}
                  </>
                )}
                {l.quiz?.length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 6 }}>Quiz answers</div>
                    {l.quiz.map((q, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: C.muted }}>Q: {q.q}</div>
                        <div style={{ fontSize: 11, color: C.text, marginLeft: 12 }}>A: {q.a || '—'}</div>
                      </div>
                    ))}
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => exportLesson(l)}
                    style={{
                      padding: '6px 12px', background: 'transparent',
                      border: `1px solid ${C.teal}44`, borderRadius: 6,
                      color: C.teal, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                    }}
                  >⬇ Export markdown</button>
                  <button
                    onClick={() => remove(l.id)}
                    style={{
                      padding: '6px 12px', background: 'transparent',
                      border: `1px solid ${C.red}44`, borderRadius: 6,
                      color: C.red, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                    }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
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
