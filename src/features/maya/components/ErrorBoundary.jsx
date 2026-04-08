import { Component } from 'react'

const C = {
  bg: '#060c18', surface: '#0c1624',
  text: '#e8edf3', muted: '#6b7f99',
  teal: '#2DD4BF', red: '#EF4444',
  mono: "'IBM Plex Mono', monospace",
  display: "'Bebas Neue', sans-serif",
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Coach Maya crashed:', error, info)
  }
  reset = () => this.setState({ hasError: false, error: null })
  reload = () => window.location.reload()
  hardReset = () => {
    if (!confirm('Reset all data and reload? This wipes everything.')) return
    try {
      localStorage.clear()
      indexedDB.deleteDatabase('maya_audio')
    } catch {}
    window.location.href = '/'
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: C.bg, color: C.text,
          fontFamily: C.mono, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 56 }}>🤖💥</div>
          <div style={{
            fontFamily: C.display, fontSize: 36, color: C.red,
            letterSpacing: 1.5, marginTop: 12,
          }}>MAYA CRASHED</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6, maxWidth: 400 }}>
            Something broke. The data is still safe.
          </div>
          <pre style={{
            marginTop: 16, padding: 12, background: C.surface,
            borderRadius: 8, fontSize: 10, color: C.muted,
            maxWidth: '90vw', maxHeight: 120, overflow: 'auto',
            textAlign: 'left',
          }}>{String(this.state.error?.message || this.state.error || 'Unknown error')}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={this.reload} style={btn(C.teal)}>Reload</button>
            <button onClick={this.reset} style={btn('transparent', C.teal)}>Try again</button>
          </div>
          <button onClick={this.hardReset} style={{
            marginTop: 14, padding: '8px 14px',
            background: 'transparent', border: `1px solid ${C.red}44`,
            borderRadius: 8, color: C.red, fontSize: 10, cursor: 'pointer',
            fontFamily: C.mono,
          }}>Wipe all data + reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

function btn(bg, color = '#060c18') {
  return {
    padding: '12px 22px',
    background: bg, color, border: bg === 'transparent' ? `1px solid ${color}` : 'none',
    borderRadius: 12, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: C.mono,
  }
}
