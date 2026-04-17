import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMaya } from '../context/MayaContext'

const C = {
  red: '#F87171', bg: '#0a0a14', text: '#f0f0f5',
  mono: "'IBM Plex Mono', monospace",
}

export default function LiveLessonBanner() {
  const { liveLesson } = useMaya()
  const navigate = useNavigate()
  const location = useLocation()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!liveLesson) return
    const start = new Date(liveLesson.startedAt).getTime()
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(i)
  }, [liveLesson])

  if (!liveLesson || location.pathname === '/lesson') return null

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60

  return (
    <div
      onClick={() => navigate('/lesson')}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: C.red, color: '#fff',
        padding: '10px 14px', cursor: 'pointer',
        fontFamily: C.mono, fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
      }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: 5, background: '#fff',
        animation: 'pulse 1.4s infinite',
      }} />
      <span>● LESSON LIVE — {liveLesson.subject}</span>
      <span style={{ marginLeft: 'auto', opacity: 0.8 }}>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
      <span style={{ opacity: 0.7, fontSize: 10 }}>tap to return</span>
    </div>
  )
}
