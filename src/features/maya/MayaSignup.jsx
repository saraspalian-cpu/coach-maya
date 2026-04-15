/**
 * Parent Signup — create account via Supabase Auth.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../../lib/auth'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444', green: '#22C55E',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaSignup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) { setError('Email and password required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const result = await signUp(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/children'), 1500)
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
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Create parent account</div>
        </div>

        {success ? (
          <div style={{
            textAlign: 'center', padding: 24, background: C.green + '11',
            border: `1px solid ${C.green}44`, borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>Account created!</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Redirecting to add your first child...</div>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: C.teal, fontSize: 12, fontFamily: C.mono, cursor: 'pointer' }}
          >
            Already have an account? Sign in
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

const labelStyle = { fontSize: 10, color: '#6b7f99', textTransform: 'uppercase', letterSpacing: 1 }
const inputStyle = {
  width: '100%', padding: '14px 16px', marginTop: 6,
  background: '#0c1624', border: '1px solid #1a2a3e', borderRadius: 12,
  color: '#e8edf3', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
  outline: 'none', boxSizing: 'border-box',
}
