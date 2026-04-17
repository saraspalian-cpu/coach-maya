import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateStory } from './agents/narrative'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaStory() {
  const navigate = useNavigate()
  const maya = useMaya()
  const beats = useMemo(() => generateStory({ profile: maya.profile }), [maya.profile])

  // Maya speaks the opening line
  useEffect(() => {
    const t = setTimeout(() => {
      const opening = `Here's your story so far, ${maya.profile?.name || 'Champ'}. Take a minute. This matters.`
      maya.speakText(opening)
    }, 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${C.teal}08, ${C.bg} 60%)`,
      color: C.text,
      fontFamily: C.mono,
      paddingBottom: 80,
    }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          fontFamily: C.display, fontSize: 36,
          color: C.teal, letterSpacing: 1.5,
          textAlign: 'center', marginTop: 12, marginBottom: 4,
        }}>YOUR STORY</div>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 24 }}>
          Real data. Real growth. Your receipts.
        </div>

        {beats.map((b, i) => (
          <div
            key={i}
            style={{
              padding: 18,
              background: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.teal}`,
              marginBottom: 12,
              animation: `fadeUp 500ms ${i * 120}ms both ease`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 28 }}>{b.icon}</div>
              <div style={{
                fontFamily: C.display, fontSize: 22,
                color: C.teal, letterSpacing: 1,
                lineHeight: 1.2, flex: 1,
              }}>{b.title}</div>
            </div>
            <div style={{
              fontSize: 13, color: C.text,
              lineHeight: 1.6, paddingLeft: 40,
            }}>{b.body}</div>
          </div>
        ))}

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '14px 20px',
            background: C.teal, border: 'none', borderRadius: 12,
            color: C.bg, fontSize: 14, fontFamily: C.mono,
            fontWeight: 700, cursor: 'pointer', marginTop: 16,
          }}
        >Keep writing the story</button>
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
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>STORY</div>
    </div>
  )
}
