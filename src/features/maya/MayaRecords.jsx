import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecords } from './agents/records'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaRecords() {
  const navigate = useNavigate()
  const records = useMemo(() => getRecords(), [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: 'none', color: C.muted,
          fontSize: 18, cursor: 'pointer', padding: 0,
        }}>←</button>
        <div style={{ fontFamily: C.display, fontSize: 22, color: C.gold, letterSpacing: 2 }}>PERSONAL RECORDS</div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
          Your all-time bests. These are your receipts.
        </div>

        {records.map((r, i) => (
          <div key={i} style={{
            padding: 16, background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`, marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14,
            animation: `fadeUp 400ms ${i * 60}ms both ease`,
          }}>
            <div style={{ fontSize: 32 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{r.label}</div>
              <div style={{ fontFamily: C.display, fontSize: 28, color: C.gold, letterSpacing: 1, lineHeight: 1.2, marginTop: 2 }}>
                {r.value}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
