import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from './lib/profile'
import { speak } from './lib/voice'
import { lazy, Suspense } from 'react'
const MayaAvatar = lazy(() => import('./components/Maya3D'))

const C = {
  bg: '#060c18',
  surface: '#0c1624',
  surfaceLight: '#121e30',
  border: '#1a2a3e',
  text: '#e8edf3',
  muted: '#6b7f99',
  dim: '#3a4f6a',
  teal: '#2DD4BF',
  gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace",
  display: "'Bebas Neue', sans-serif",
}

const HOBBY_OPTIONS = ['Tennis', 'Football', 'Basketball', 'Piano', 'Guitar', 'Drawing', 'Gaming', 'Coding', 'Reading', 'Chess', 'Skating', 'Cycling']
const SUBJECT_OPTIONS = ['Maths', 'Science', 'Reading', 'Writing', 'History', 'Geography', 'Languages', 'Art', 'Music', 'PE']
const HUMOR_OPTIONS = [
  { id: 'sarcastic', label: 'Sarcastic', desc: '"Wow, the floor must be magnetic."' },
  { id: 'playful', label: 'Playful', desc: '"Bet you can\'t finish before me."' },
  { id: 'dry', label: 'Dry', desc: '"Cool. Combo gone."' },
  { id: 'wholesome', label: 'Wholesome', desc: '"You got this — for real."' },
]
const DRIVERS = [
  { id: 'competition', label: 'Competing', desc: 'Beat my own records' },
  { id: 'identity', label: 'Identity', desc: 'Become who I want to be' },
  { id: 'mastery', label: 'Mastery', desc: 'Get really good at things' },
  { id: 'autonomy', label: 'Autonomy', desc: 'My choices, my way' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(() => loadProfile())

  const update = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const toggleArr = (key, value) => {
    const arr = profile[key] || []
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    update({ [key]: next })
  }

  const finish = () => {
    saveProfile({ ...profile, setupComplete: true, setupAt: new Date().toISOString() })
    // Hard reload so MayaProvider re-reads profile from storage
    window.location.href = '/'
  }

  const steps = [
    {
      title: "I'm Maya.",
      subtitle: 'Your AI growth companion. Let me get to know you.',
      content: (
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
            I'll keep you on track. I'll celebrate your wins. I'll call you out when you're slacking.
            <br /><br />
            But first — who are you?
          </p>
        </div>
      ),
    },
    {
      title: "What's your name?",
      subtitle: '',
      content: (
        <div style={{ padding: '0 24px' }}>
          <input
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Your name"
            autoFocus
            style={inputStyle}
          />
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => update({ age: parseInt(e.target.value) || 12 })}
              style={{ ...inputStyle, marginTop: 6 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'What are you into?',
      subtitle: 'Pick all that apply.',
      content: (
        <ChipGrid options={HOBBY_OPTIONS} selected={profile.hobbies} onToggle={(v) => toggleArr('hobbies', v)} />
      ),
    },
    {
      title: 'School subjects you love.',
      subtitle: 'The ones you actually look forward to.',
      content: (
        <ChipGrid options={SUBJECT_OPTIONS} selected={profile.favoriteSubjects} onToggle={(v) => toggleArr('favoriteSubjects', v)} />
      ),
    },
    {
      title: 'Subjects you avoid.',
      subtitle: "I'll know to push harder on these.",
      content: (
        <ChipGrid options={SUBJECT_OPTIONS} selected={profile.hardSubjects} onToggle={(v) => toggleArr('hardSubjects', v)} />
      ),
    },
    {
      title: 'How should I talk to you?',
      subtitle: 'Pick the vibe.',
      content: (
        <Choices
          options={HUMOR_OPTIONS}
          selected={profile.humorStyle}
          onPick={(id) => update({ humorStyle: id })}
        />
      ),
    },
    {
      title: 'What drives you?',
      subtitle: '',
      content: (
        <Choices
          options={DRIVERS}
          selected={profile.motivationDriver}
          onPick={(id) => update({ motivationDriver: id })}
        />
      ),
    },
    {
      title: 'How hard should I push?',
      subtitle: 'You can change this anytime.',
      content: (
        <Choices
          options={[
            { id: 'light', label: 'Light', desc: 'Gentle nudges' },
            { id: 'medium', label: 'Medium', desc: 'Real coach energy' },
            { id: 'hard', label: 'Hard', desc: 'No excuses mode' },
          ]}
          selected={profile.pushIntensity}
          onPick={(id) => update({ pushIntensity: id })}
        />
      ),
    },
    {
      title: "Your big goal?",
      subtitle: 'One thing you want to crush this year.',
      content: (
        <div style={{ padding: '0 24px' }}>
          <input
            value={profile.bigGoals?.[0] || ''}
            onChange={(e) => update({ bigGoals: [e.target.value] })}
            placeholder="e.g. Make varsity tennis"
            autoFocus
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
            I'll remember this. Every grind session is one step closer.
          </p>
        </div>
      ),
    },
    {
      title: 'Hear my voice.',
      subtitle: 'Tap to test how I sound.',
      content: (
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <button
            onClick={() => {
              // Save first so voice picker uses current settings
              saveProfile(profile)
              speak(`Hey ${profile.name || 'Vasco'}. This is Maya. I'll be coaching you from here on out. Let's build something.`)
            }}
            style={{
              padding: '14px 24px', background: C.teal,
              border: 'none', borderRadius: 12,
              color: C.bg, fontSize: 14, fontFamily: C.mono,
              fontWeight: 700, cursor: 'pointer',
            }}
          >▶ Hear Maya</button>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>
            Sounds robotic? You can switch to a real human voice later in Profile (ElevenLabs).
          </p>
        </div>
      ),
    },
    {
      title: "Let's go.",
      subtitle: "I've got everything I need. Day one starts now.",
      content: (
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
            <div><strong style={{ color: C.text }}>{profile.name}</strong>, age {profile.age}</div>
            <div>Loves: {profile.favoriteSubjects?.join(', ') || '—'}</div>
            <div>Hobbies: {profile.hobbies?.join(', ') || '—'}</div>
            <div>Goal: {profile.bigGoals?.[0] || '—'}</div>
          </div>
        </div>
      ),
    },
  ]

  const cur = steps[step]
  const isLast = step === steps.length - 1
  const canNext = (() => {
    if (step === 1) return profile.name?.trim().length > 0
    return true
  })()

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${C.surfaceLight} 0%, ${C.bg} 60%)`,
      color: C.text,
      fontFamily: C.mono,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Maya hero */}
      <div style={{ paddingTop: 24 }}>
        <Suspense fallback={<div style={{ height: 260 }}/>}>
          <MayaAvatar state={isLast ? 'celebrating' : 'speaking'} size={260} />
        </Suspense>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 6,
            height: 6,
            borderRadius: 4,
            background: i <= step ? C.teal : C.dim,
            transition: 'all 300ms ease',
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px 16px 16px',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          fontFamily: C.display,
          fontSize: 32,
          letterSpacing: 1.5,
          color: C.teal,
          textAlign: 'center',
          marginBottom: 4,
        }}>{cur.title}</div>
        {cur.subtitle && (
          <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 24 }}>
            {cur.subtitle}
          </div>
        )}
        <div style={{ marginTop: 12 }}>{cur.content}</div>
      </div>

      {/* Nav */}
      <div style={{
        padding: 16,
        display: 'flex',
        gap: 12,
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={btnSecondary}>Back</button>
        )}
        <button
          onClick={() => isLast ? finish() : setStep(step + 1)}
          disabled={!canNext}
          style={{ ...btnPrimary, opacity: canNext ? 1 : 0.4 }}
        >
          {isLast ? 'Start Coaching' : 'Next'}
        </button>
      </div>
    </div>
  )
}

function ChipGrid({ options, selected = [], onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 24px', justifyContent: 'center' }}>
      {options.map(opt => {
        const isOn = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: `1px solid ${isOn ? C.teal : C.border}`,
              background: isOn ? C.teal + '22' : 'transparent',
              color: isOn ? C.teal : C.text,
              fontSize: 12,
              fontFamily: C.mono,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >{opt}</button>
        )
      })}
    </div>
  )
}

function Choices({ options, selected, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
      {options.map(opt => {
        const isOn = selected === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onPick(opt.id)}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: `1px solid ${isOn ? C.teal : C.border}`,
              background: isOn ? C.teal + '15' : C.surface,
              color: C.text,
              fontFamily: C.mono,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: isOn ? C.teal : C.text }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  color: C.text,
  fontSize: 16,
  fontFamily: C.mono,
  outline: 'none',
  boxSizing: 'border-box',
}

const btnPrimary = {
  flex: 1,
  padding: '14px 20px',
  background: C.teal,
  color: C.bg,
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontFamily: C.mono,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: 0.5,
}
const btnSecondary = {
  padding: '14px 20px',
  background: 'transparent',
  color: C.muted,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  fontSize: 14,
  fontFamily: C.mono,
  cursor: 'pointer',
}
