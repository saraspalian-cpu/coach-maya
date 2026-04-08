import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaHelp() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <Card title="What Maya does" color={C.teal}>
          <p style={p}>Maya sits on your desk and coaches you through the day. She nudges you to start tasks, sits through your online lessons, quizzes you on what was actually taught, and stacks everything into a growth loop.</p>
        </Card>

        <Card title="The lesson flow ⭐" color={C.gold}>
          <p style={p}>1. Tap <b>🎙 Start a lesson</b> on the dashboard</p>
          <p style={p}>2. Pick the subject</p>
          <p style={p}>3. Put the device near your laptop speaker</p>
          <p style={p}>4. Hit Start. Maya listens and nudges you every 12 min</p>
          <p style={p}>5. When the lesson ends, tap End — Maya recaps and quizzes you</p>
          <p style={p}>6. Every concept she catches goes into your Memory Bank for later review</p>
        </Card>

        <Card title="Voice & microphone">
          <p style={p}>First time you tap the 🎤 or start a lesson, your browser will ask for mic permission. Say yes.</p>
          <p style={p}>To make Maya sound human instead of robotic, go to <b>Profile → ElevenLabs</b> and paste an API key. Free tier gives ~10k characters/month.</p>
        </Card>

        <Card title="Unlock Maya's brain">
          <p style={p}>Without a Claude API key, Maya uses smart fallback templates. With one, she actually thinks.</p>
          <p style={p}>Get a key at <b>console.anthropic.com</b> → Profile → paste it in.</p>
        </Card>

        <Card title="Install to home screen (iPad)">
          <p style={p}>1. Open Coach Maya in Safari</p>
          <p style={p}>2. Tap the Share icon</p>
          <p style={p}>3. "Add to Home Screen"</p>
          <p style={p}>Maya becomes a full-screen app with no browser bars.</p>
        </Card>

        <Card title="Keyboard shortcuts">
          <p style={p}><b>⌘K</b> — open universal search</p>
          <p style={p}><b>Esc</b> — close overlays</p>
        </Card>

        <Card title="Gamification rules">
          <p style={p}><b>XP</b> — earned per task + combo multiplier</p>
          <p style={p}><b>Combo</b> — consecutive completions; resets on skip. 3× = 1.5x, 5× = 2x, 7× = 3x</p>
          <p style={p}><b>Daily grade</b> — S (all tasks + mood + reflection), A, B, C, F</p>
          <p style={p}><b>Levels</b> — 8 tiers from Rookie to Legend</p>
        </Card>

        <Card title="Your data">
          <p style={p}>Everything stays in your browser (localStorage + IndexedDB for audio). Nothing is sent anywhere unless you configure a Claude or ElevenLabs key.</p>
          <p style={p}>To reset everything: <b>Profile → Danger Zone → Reset all data</b>.</p>
        </Card>
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
      background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>TIPS</div>
    </div>
  )
}
function Card({ title, color, children }) {
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, marginBottom: 10,
      borderLeft: color ? `3px solid ${color}` : undefined,
    }}>
      <div style={{ fontSize: 10, color: color || C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
const p = { fontSize: 12, color: '#e8edf3', lineHeight: 1.6, margin: '3px 0' }
