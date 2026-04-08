import { useLocation, useNavigate } from 'react-router-dom'
import { useMaya } from '../context/MayaContext'

const C = {
  bg: '#060c18', red: '#EF4444', teal: '#2DD4BF',
}

export default function VoiceFab() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isListening, startListening, stopListening } = useMaya()

  // Hide on onboarding + lesson live (they have their own controls)
  if (location.pathname === '/onboarding' || location.pathname === '/lesson') return null

  return (
    <button
      onClick={() => {
        if (isListening) stopListening()
        else startListening()
      }}
      style={{
        position: 'fixed',
        bottom: 78, right: 16,
        zIndex: 60,
        width: 56, height: 56, borderRadius: 28,
        background: isListening ? C.red : C.teal,
        border: 'none',
        boxShadow: isListening
          ? `0 6px 24px ${C.red}99, 0 0 0 4px ${C.red}33`
          : `0 6px 20px ${C.teal}66`,
        color: C.bg, fontSize: 24, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: isListening ? 'pulse 1.4s infinite' : 'none',
      }}
      title={isListening ? 'Stop listening' : 'Talk to Maya'}
    >🎤</button>
  )
}
