import { useLocation } from 'react-router-dom'
import { useMaya } from '../context/MayaContext'

const HIDDEN = ['/onboarding', '/lesson', '/login', '/signup', '/children']

export default function VoiceFab() {
  const location = useLocation()
  const { isListening, startListening, stopListening } = useMaya()

  if (HIDDEN.includes(location.pathname)) return null

  return (
    <button
      onClick={() => {
        if (isListening) stopListening()
        else startListening()
      }}
      style={{
        position: 'fixed',
        bottom: 84, right: 16,
        zIndex: 60,
        width: 56, height: 56, borderRadius: 28,
        background: isListening
          ? 'rgba(248,113,113,0.9)'
          : 'rgba(45,212,191,0.15)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isListening
          ? '2px solid rgba(248,113,113,0.6)'
          : '1px solid rgba(45,212,191,0.3)',
        boxShadow: isListening
          ? '0 6px 24px rgba(248,113,113,0.4), 0 0 40px rgba(248,113,113,0.15)'
          : '0 6px 20px rgba(45,212,191,0.2), 0 0 40px rgba(45,212,191,0.08)',
        color: isListening ? '#0a0a14' : '#2DD4BF',
        fontSize: 22, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: isListening ? 'pulse 1.4s infinite' : 'none',
        transition: 'all 0.3s ease',
      }}
      title={isListening ? 'Stop listening' : 'Talk to Maya'}
    >🎤</button>
  )
}
