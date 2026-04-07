import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from './lib/profile'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(loadProfile())
  const [saved, setSaved] = useState(false)

  const update = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const save = () => {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }
  const reset = () => {
    if (!confirm('Reset all of Vasco\'s data? This cannot be undone.')) return
    localStorage.clear()
    navigate('/')
    location.reload()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} title="Profile" />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        <Section title="Identity">
          <Row label="Name">
            <input style={input} value={profile.name} onChange={e => update({ name: e.target.value })} />
          </Row>
          <Row label="Age">
            <input style={input} type="number" value={profile.age} onChange={e => update({ age: parseInt(e.target.value) || 0 })} />
          </Row>
        </Section>

        <Section title="Goals">
          <textarea
            style={{ ...input, minHeight: 70, resize: 'vertical' }}
            value={profile.bigGoals?.join('\n') || ''}
            onChange={e => update({ bigGoals: e.target.value.split('\n').filter(Boolean) })}
            placeholder="One goal per line"
          />
        </Section>

        <Section title="Hobbies">
          <input
            style={input}
            value={profile.hobbies?.join(', ') || ''}
            onChange={e => update({ hobbies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="Tennis, Piano, Drawing"
          />
        </Section>

        <Section title="Coach Style">
          <Row label="Humor">
            <Select value={profile.humorStyle} onChange={v => update({ humorStyle: v })}
              options={['sarcastic', 'playful', 'dry', 'wholesome']} />
          </Row>
          <Row label="Push intensity">
            <Select value={profile.pushIntensity} onChange={v => update({ pushIntensity: v })}
              options={['light', 'medium', 'hard']} />
          </Row>
          <Row label="Driver">
            <Select value={profile.motivationDriver} onChange={v => update({ motivationDriver: v })}
              options={['competition', 'identity', 'mastery', 'autonomy']} />
          </Row>
        </Section>

        <Section title="Voice">
          <Row label="Maya speaks aloud">
            <Toggle on={profile.voiceAutoSpeak} onChange={v => update({ voiceAutoSpeak: v })} />
          </Row>
          <Row label="Voice enabled">
            <Toggle on={profile.voiceEnabled} onChange={v => update({ voiceEnabled: v })} />
          </Row>
        </Section>

        {profile.worksOn?.length > 0 && (
          <Section title="What Maya has learned works">
            {profile.worksOn.map((w, i) => (
              <div key={i} style={tag('#22C55E')}>{w}</div>
            ))}
          </Section>
        )}
        {profile.avoids?.length > 0 && (
          <Section title="What Maya is avoiding">
            {profile.avoids.map((w, i) => (
              <div key={i} style={tag(C.red)}>{w}</div>
            ))}
          </Section>
        )}

        <button onClick={save} style={primary}>{saved ? 'Saved ✓' : 'Save Changes'}</button>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Danger zone
          </div>
          <button onClick={reset} style={{ ...primary, background: C.red + '22', color: C.red, border: `1px solid ${C.red}44` }}>
            Reset all data
          </button>
        </div>
      </div>
    </div>
  )
}

function Header({ onBack, title }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: C.surface,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>{title}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ background: C.surface, padding: 12, borderRadius: 12, border: `1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  )
}
function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}
function Select({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '6px 12px',
          borderRadius: 999,
          border: `1px solid ${value === o ? C.teal : C.border}`,
          background: value === o ? C.teal + '22' : 'transparent',
          color: value === o ? C.teal : C.text,
          fontSize: 11, fontFamily: C.mono, cursor: 'pointer',
        }}>{o}</button>
      ))}
    </div>
  )
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? C.teal : C.dim,
      border: 'none', position: 'relative', cursor: 'pointer',
      transition: 'background 200ms',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: 10, background: 'white',
        transition: 'left 200ms',
      }} />
    </button>
  )
}
const input = {
  width: '100%', padding: '10px 12px', background: C.bg,
  border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, fontSize: 13, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box',
}
const primary = {
  width: '100%', padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
}
const tag = (color) => ({
  display: 'inline-block', padding: '6px 10px', margin: '2px 4px 2px 0',
  borderRadius: 8, fontSize: 10, color, border: `1px solid ${color}44`,
  background: color + '11',
})
