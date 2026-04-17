/**
 * Achievement unlock modal — full-screen celebration.
 * Listens for new achievements in context and shows a big reveal.
 */
import { useEffect, useState, lazy, Suspense } from 'react'
import { useMaya } from '../context/MayaContext'
import { ACHIEVEMENTS } from '../agents/gamification'

const MayaAvatar = lazy(() => import('./Maya3D'))

const C = {
  bg: 'rgba(6, 12, 24, 0.96)',
  gold: '#FFD700',
  teal: '#2DD4BF',
  text: '#f0f0f5',
  muted: '#6b6b8a',
  mono: "'IBM Plex Mono', monospace",
  display: "'Bebas Neue', sans-serif",
}

export default function AchievementModal() {
  const { messages } = useMaya()
  const [unlock, setUnlock] = useState(null)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.type !== 'achievement') return
    // Parse out the achievement by icon match
    const match = last.text?.match(/^(.{1,2})\s+Achievement Unlocked: (.+?) — (.+)$/)
    if (match) {
      const [, icon, title, desc] = match
      setUnlock({ icon, title, desc, id: last.timestamp })
    }
  }, [messages])

  if (!unlock) return null

  return (
    <div
      onClick={() => setUnlock(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: C.bg, backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
        animation: 'fadeUp 400ms ease',
      }}
    >
      <Confetti />

      <div style={{
        fontSize: 10, color: C.gold, textTransform: 'uppercase',
        letterSpacing: 3, marginBottom: 6,
      }}>Achievement Unlocked</div>

      <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 6, animation: 'pop 600ms ease' }}>
        {unlock.icon}
      </div>

      <div style={{
        fontFamily: C.display, fontSize: 44,
        color: C.gold, letterSpacing: 2,
        textShadow: `0 0 24px ${C.gold}66`,
      }}>
        {unlock.title.toUpperCase()}
      </div>

      <div style={{
        fontSize: 13, color: C.text, marginTop: 8, maxWidth: 320, lineHeight: 1.5,
      }}>{unlock.desc}</div>

      <div style={{
        marginTop: 24, fontSize: 10, color: C.muted,
        padding: '8px 16px', border: `1px solid ${C.muted}44`, borderRadius: 999,
      }}>Tap anywhere to continue</div>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 40 })
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 400
        const dur = 1800 + Math.random() * 1200
        const color = [C.gold, C.teal, '#ef4444', '#93C5FD'][i % 4]
        const size = 6 + Math.random() * 6
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${left}%`, top: -20,
            width: size, height: size, borderRadius: 2,
            background: color,
            animation: `confetti ${dur}ms ${delay}ms linear forwards`,
          }} />
        )
      })}
    </div>
  )
}
