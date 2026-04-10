/**
 * News Feed — tech + tennis for Vasco.
 * Pulls from free RSS feeds, cached 30 min.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchNews, getCategories } from './lib/news'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', amber: '#FFA500',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const CAT_META = {
  tech: { icon: '💻', label: 'Tech', color: C.teal },
  tennis: { icon: '🎾', label: 'Tennis', color: C.green },
}

export default function MayaNews() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('tech')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (cat) => {
    setLoading(true)
    setError('')
    try {
      const items = await fetchNews(cat)
      setArticles(items)
    } catch (e) {
      setError(e.message || 'Failed to load news')
    }
    setLoading(false)
  }

  useEffect(() => { load(tab) }, [tab])

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 0' }}>
          {getCategories().map(cat => {
            const meta = CAT_META[cat] || { icon: '📰', label: cat, color: C.muted }
            const active = tab === cat
            return (
              <button
                key={cat}
                onClick={() => setTab(cat)}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: active ? meta.color + '22' : C.surface,
                  border: `2px solid ${active ? meta.color : C.border}`,
                  borderRadius: 12, cursor: 'pointer', fontFamily: C.mono,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                <span style={{ fontSize: 13, color: active ? meta.color : C.muted, fontWeight: 700 }}>
                  {meta.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 12 }}>
            Loading {tab} news...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: 14, background: C.red + '11',
            border: `1px solid ${C.red}44`, borderRadius: 10,
            fontSize: 11, color: C.red, marginBottom: 12,
          }}>
            {error}
            <button
              onClick={() => load(tab)}
              style={{
                display: 'block', marginTop: 8,
                padding: '6px 12px', background: C.red, border: 'none',
                borderRadius: 6, color: '#fff', fontSize: 10,
                fontFamily: C.mono, cursor: 'pointer',
              }}
            >Retry</button>
          </div>
        )}

        {/* Articles */}
        {!loading && articles.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 12 }}>
            No articles found. Try refreshing.
          </div>
        )}

        {articles.map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textDecoration: 'none', color: 'inherit',
              padding: 14, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 8,
              transition: 'border-color 200ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{article.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: C.text, fontWeight: 600,
                  lineHeight: 1.4, marginBottom: 4,
                }}>
                  {article.title}
                </div>
                {article.desc && (
                  <div style={{
                    fontSize: 11, color: C.muted, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {article.desc}
                  </div>
                )}
                <div style={{
                  display: 'flex', gap: 8, marginTop: 6,
                  fontSize: 9, color: C.dim,
                }}>
                  <span style={{ color: CAT_META[tab]?.color || C.muted }}>{article.source}</span>
                  {article.date && <span>{timeAgo(article.date)}</span>}
                </div>
              </div>
            </div>
          </a>
        ))}

        {/* Refresh */}
        {!loading && articles.length > 0 && (
          <button
            onClick={() => {
              try { localStorage.removeItem('maya_news_cache') } catch {}
              load(tab)
            }}
            style={{
              width: '100%', padding: '12px', marginTop: 8,
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.muted, fontSize: 11,
              fontFamily: C.mono, cursor: 'pointer',
            }}
          >🔄 Refresh</button>
        )}
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
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>NEWS</div>
    </div>
  )
}
