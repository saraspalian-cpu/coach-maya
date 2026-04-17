/**
 * Parent Login — email/password via Supabase Auth.
 * Only shown when cloud is enabled. Otherwise app runs in local mode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logIn } from '../../lib/auth'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)

    const result = await logIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      navigate('/children')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: C.mono, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
          <div style={{ fontFamily: C.display, fontSize: 36, color: C.teal, letterSpacing: 3 }}>COACH MAYA</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Parent login</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 11, color: C.red, marginBottom: 12, padding: '8px 12px', background: C.red + '11', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 16, background: C.teal, color: C.bg,
            border: 'none', borderRadius: 12, fontSize: 14,
            fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: C.teal, fontSize: 12, fontFamily: C.mono, cursor: 'pointer' }}
          >
            New here? Create an account
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: C.dim, fontSize: 10, fontFamily: C.mono, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Use without an account (local only)
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px', marginTop: 6,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
  color: '#f0f0f5', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
  outline: 'none', boxSizing: 'border-box',
}
