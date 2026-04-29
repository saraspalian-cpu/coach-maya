/**
 * Daily Ritual Flow — guided morning briefing OR evening wrap.
 * Maya speaks aloud, leads Vasco through the moment, captures intent/reflection.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
const MayaAvatar = lazy(() => import('./components/Maya3D'))
import { getMemoryStats, getDueConcepts } from './agents/memory'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaRitual() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || guessMode()
  const maya = useMaya()
  const { profile, tasks, gamification: gam, todayMood } = maya
  const [step, setStep] = useState(0)
  const [intent, setIntent] = useState('')
  const [reflection, setReflection] = useState('')

  const isMorning = mode === 'morning'
  const memStats = useMemo(() => getMemoryStats(), [])
  const dueCount = memStats.dueToday
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  const morningSteps = [
    {
      title: `Morning, ${profile?.name || 'Champ'}.`,
      body: `Day ${profile?.currentStreak || 1} of the streak. ${totalCount} things on the slate today.`,
      speak: `Morning, ${profile?.name || 'Champ'}. Day ${profile?.currentStreak || 1} of the streak. Let's lock in.`,
      cta: 'Show me the day',
    },
    {
      title: "Here's what we're shipping.",
      body: <TaskPreview tasks={tasks} />,
      speak: `${totalCount} tasks today. First up: ${tasks[0]?.name || 'whatever you choose'}. ${dueCount > 0 ? `Also got ${dueCount} concepts due for memory review.` : ''}`,
      cta: 'Set my intent',
    },
    {
      title: 'One thing.',
      body: (
        <>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            What's the ONE thing that, if you crushed today, would make this a winning day?
          </p>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="My one thing today is..."
            autoFocus
            style={textareaStyle}
          />
        </>
      ),
      speak: "What's the one thing today that, if you crushed it, would make this a winning day?",
      cta: 'Lock it in',
      validate: () => intent.trim().length > 0,
    },
    {
      title: "Locked in.",
      body: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            "{intent}"<br/><br/>
            I'll be here. Let's go.
          </div>
        </div>
      ),
      speak: `Locked in. Let's go ship it, ${profile?.name || 'Champ'}.`,
      cta: 'Start the day',
      onComplete: () => {
        // Save intent to today's log via reflection-like mechanism
        try {
          const todayKey = `intent_${new Date().toISOString().slice(0, 10)}`
          localStorage.setItem(todayKey, intent)
        } catch {}
        navigate('/')
      },
    },
  ]

  const eveningSteps = [
    {
      title: `Evening, ${profile?.name || 'Champ'}.`,
      body: `Day grade: ${gam.dayGrade?.grade || '-'}. ${completedCount}/${totalCount} done. ${gam.totalXP} XP earned.`,
      speak: `Evening, ${profile?.name || 'Champ'}. Day grade ${gam.dayGrade?.grade || 'pending'}. Let's wrap this up.`,
      cta: 'Reveal the grade',
    },
    {
      title: gradeTitle(gam.dayGrade?.grade),
      body: (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{
            fontFamily: C.display, fontSize: 120, lineHeight: 1,
            color: gradeColor(gam.dayGrade?.grade),
          }}>{gam.dayGrade?.grade || '-'}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{gam.dayGrade?.label || 'In progress'}</div>
        </div>
      ),
      speak: `${gradeWord(gam.dayGrade?.grade)}. ${gradeLine(gam.dayGrade?.grade)}`,
      cta: 'Reflect',
    },
    {
      title: 'Quick reflection.',
      body: (
        <>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            One thing that worked. One thing you'd change. Two sentences. Don't overthink it.
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Today I..."
            autoFocus
            style={textareaStyle}
          />
        </>
      ),
      speak: "Quick reflection. One thing that worked. One thing you'd change.",
      cta: 'Save & wrap',
      validate: () => reflection.trim().length > 5,
      onComplete: () => {
        maya.submitReflection(reflection)
        // continue to next step
      },
    },
    {
      title: 'Wrapped.',
      body: (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌙</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            That's the day. Tomorrow we go again.
          </div>
        </div>
      ),
      speak: "That's the day. Sleep well. Tomorrow we go again.",
      cta: 'Done',
      onComplete: () => navigate('/'),
    },
  ]

  const steps = isMorning ? morningSteps : eveningSteps
  const cur = steps[step]

  // Maya speaks each step's line
  useEffect(() => {
    if (cur?.speak) {
      setTimeout(() => maya.speakText(cur.speak), 250)
    }
  }, [step])

  const next = () => {
    if (cur.validate && !cur.validate()) return
    cur.onComplete?.()
    if (!cur.onComplete && step < steps.length - 1) setStep(step + 1)
    else if (cur.onComplete) {
      // The onComplete may have navigated already
      if (step < steps.length - 1) setStep(step + 1)
    }
  }

  const isLast = step === steps.length - 1
  const canNext = !cur?.validate || cur.validate()

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${isMorning ? C.amber : '#1a1a3e'}11, ${C.bg} 60%)`,
      color: C.text,
      fontFamily: C.mono,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ paddingTop: 16 }}>
        <Suspense fallback={<div style={{ height: 240 }} />}>
          <MayaAvatar state={isMorning ? 'speaking' : 'idle'} size={240} />
        </Suspense>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 6, height: 6, borderRadius: 4,
            background: i <= step ? C.teal : C.dim,
            transition: 'all 300ms ease',
          }} />
        ))}
      </div>

      <div style={{
        flex: 1, padding: '24px 16px 16px',
        maxWidth: 480, margin: '0 auto', width: '100%',
      }}>
        <div style={{
          fontFamily: C.display, fontSize: 30,
          letterSpacing: 1.5, color: C.teal,
          textAlign: 'center', marginBottom: 16,
        }}>{cur.title}</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, padding: '0 8px' }}>
          {cur.body}
        </div>
      </div>

      <div style={{
        padding: 16, display: 'flex', gap: 12,
        maxWidth: 480, margin: '0 auto', width: '100%',
      }}>
        <button
          onClick={() => navigate('/')}
          style={btnSecondary}
        >Skip</button>
        <button
          onClick={next}
          disabled={!canNext}
          style={{ ...btnPrimary, opacity: canNext ? 1 : 0.4 }}
        >{cur.cta}</button>
      </div>
    </div>
  )
}

function TaskPreview({ tasks }) {
  return (
    <div>
      {tasks.map((t, i) => (
        <div key={t.id} style={{
          padding: '10px 12px', background: C.surface, borderRadius: 10,
          border: `1px solid ${C.border}`, marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 12,
            background: t.completed ? C.green : C.dim,
            color: t.completed ? C.bg : C.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text }}>{t.name}</div>
            <div style={{ fontSize: 9, color: C.muted }}>{t.duration}min · {t.type}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function guessMode() {
  const h = new Date().getHours()
  return h < 14 ? 'morning' : 'evening'
}
function gradeTitle(g) {
  return ({ S: 'Perfect day.', A: 'Great day.', B: 'Solid day.', C: 'OK day.', F: 'Rough day.' })[g] || 'In progress.'
}
function gradeWord(g) {
  return ({ S: 'Perfect day', A: 'Great day', B: 'Solid day', C: 'OK day', F: 'Rough day' })[g] || 'Day in progress'
}
function gradeColor(g) {
  return ({ S: C.gold, A: C.green, B: '#93C5FD', C: C.amber, F: C.red })[g] || C.dim
}
function gradeLine(g) {
  return ({
    S: 'You hit every mark today. That is who you are now.',
    A: 'Strong day. You did the work.',
    B: 'Solid effort. We get more tomorrow.',
    C: 'Mid. We both know there is more in there.',
    F: 'Rough one. Reset is built in. Tomorrow.',
  })[g] || 'The day is still yours.'
}

const textareaStyle = {
  width: '100%', padding: '14px 16px', background: C.surface,
  border: `1px solid ${C.border}`, borderRadius: 12,
  color: C.text, fontSize: 14, fontFamily: C.mono, outline: 'none',
  minHeight: 90, resize: 'vertical', boxSizing: 'border-box',
}
const btnPrimary = {
  flex: 1, padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
  letterSpacing: 0.5,
}
const btnSecondary = {
  padding: '14px 20px', background: 'transparent',
  color: C.muted, border: `1px solid ${C.border}`,
  borderRadius: 12, fontSize: 14, fontFamily: C.mono, cursor: 'pointer',
}
