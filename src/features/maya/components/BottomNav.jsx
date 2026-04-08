import { useNavigate, useLocation } from 'react-router-dom'

const C = {
  bg: '#060c18', surface: '#0c1624',
  border: '#1a2a3e', muted: '#6b7f99', text: '#e8edf3',
  teal: '#2DD4BF',
  mono: "'IBM Plex Mono', monospace",
}

const ITEMS = [
  { icon: '🏠', label: 'Home', to: '/' },
  { icon: '🎙', label: 'Lesson', to: '/lesson' },
  { icon: '🧠', label: 'Memory', to: '/memory' },
  { icon: '🎯', label: 'Goals', to: '/goals' },
  { icon: '👤', label: 'Me', to: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  // Hide on onboarding
  if (location.pathname === '/onboarding') return null
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      maxWidth: 480, margin: '0 auto',
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      padding: '6px 8px',
      display: 'flex', justifyContent: 'space-around',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
    }}>
      {ITEMS.map(it => {
        const active = location.pathname === it.to
        return (
          <button
            key={it.to}
            onClick={() => navigate(it.to)}
            style={{
              flex: 1, padding: '8px 4px',
              background: 'transparent', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              cursor: 'pointer', fontFamily: C.mono,
            }}
          >
            <div style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{it.icon}</div>
            <div style={{
              fontSize: 9, color: active ? C.teal : C.muted,
              fontWeight: active ? 700 : 400,
            }}>{it.label}</div>
          </button>
        )
      })}
    </div>
  )
}
