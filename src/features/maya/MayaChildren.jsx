/**
 * Child Management — parent adds/selects/removes children.
 * Each child gets their own isolated data.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChildren, addChild, removeChild, getUser, logOut } from '../../lib/auth'
import { setActiveChild, pushToCloud, pullFromCloud } from '../../lib/storage'
import { isCloudEnabled } from '../../lib/supabase'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700', blue: '#7db8e8',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const CHILD_COLORS = ['#2DD4BF', '#A78BFA', '#F472B6', '#FF6B35', '#7db8e8', '#FFD700']

export default function MayaChildren() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingName, setAddingName] = useState('')
  const [addingAge, setAddingAge] = useState(12)
  const [showAdd, setShowAdd] = useState(false)
  const [switching, setSwitching] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!isCloudEnabled()) {
      setLoading(false)
      navigate('/')
      return
    }
    const u = await getUser()
    if (!u) {
      navigate('/login')
      return
    }
    setUser(u)
    const kids = await getChildren()
    setChildren(kids)
    setLoading(false)

    // If no children yet, show add form
    if (kids.length === 0) setShowAdd(true)
  }

  const handleAdd = async () => {
    if (!addingName.trim()) return
    const child = await addChild(addingName.trim(), addingAge)
    if (child) {
      setChildren([...children, child])
      setAddingName('')
      setAddingAge(12)
      setShowAdd(false)
    }
  }

  const handleSelect = async (child) => {
    setSwitching(child.id)
    setActiveChild(child.id)

    // Pull cloud data for this child
    await pullFromCloud()

    // Navigate to onboarding if new, otherwise dashboard
    const profile = JSON.parse(localStorage.getItem('maya_profile') || '{}')
    if (profile.setupComplete) {
      navigate('/')
    } else {
      navigate('/onboarding')
    }
  }

  const handleRemove = async (childId, name) => {
    if (!confirm(`Remove ${name}? This deletes all their data permanently.`)) return
    const ok = await removeChild(childId)
    if (ok) {
      setChildren(children.filter(c => c.id !== childId))
    }
  }

  const handleLogout = async () => {
    await logOut()
    navigate('/login')
  }

  const handleMigrate = async (child) => {
    // Migrate existing local data to this child's cloud storage
    setSwitching(child.id)
    setActiveChild(child.id)
    await pushToCloud()
    setSwitching(null)
    alert(`Local data migrated to ${child.name}'s cloud storage.`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.teal, fontFamily: C.mono, fontSize: 12 }}>loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>MY KIDS</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{user?.email}</div>
        </div>
        <button onClick={handleLogout} style={{
          padding: '6px 12px', background: 'transparent',
          border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.muted, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
        }}>Log out</button>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Children list */}
        {children.map((child, i) => (
          <div key={child.id} style={{
            padding: 20, background: C.surface, borderRadius: 16,
            border: `1px solid ${C.border}`, marginBottom: 12,
            borderLeft: `4px solid ${CHILD_COLORS[i % CHILD_COLORS.length]}`,
            cursor: 'pointer',
            opacity: switching === child.id ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div onClick={() => handleSelect(child)} style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: CHILD_COLORS[i % CHILD_COLORS.length],
                }}>{child.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Age {child.age} · tap to open
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleMigrate(child)} title="Migrate local data" style={{
                  padding: '6px 10px', background: 'transparent',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.muted, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                }}>↑ Sync</button>
                <button onClick={() => handleRemove(child.id, child.name)} style={{
                  padding: '6px 10px', background: 'transparent',
                  border: `1px solid ${C.red}44`, borderRadius: 8,
                  color: C.red, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                }}>Remove</button>
              </div>
            </div>
            {switching === child.id && (
              <div style={{ fontSize: 10, color: C.teal, marginTop: 8 }}>Syncing data...</div>
            )}
          </div>
        ))}

        {/* Add child form */}
        {showAdd ? (
          <div style={{
            padding: 20, background: C.surface, borderRadius: 16,
            border: `1px solid ${C.teal}33`, marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Add a child
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={addingName}
                onChange={e => setAddingName(e.target.value)}
                placeholder="Child's name"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Age</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setAddingAge(Math.max(5, addingAge - 1))} style={stepBtn}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.teal, minWidth: 30, textAlign: 'center' }}>{addingAge}</span>
                <button onClick={() => setAddingAge(Math.min(18, addingAge + 1))} style={stepBtn}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAdd} disabled={!addingName.trim()} style={{
                flex: 1, padding: 14, background: C.teal, color: C.bg,
                border: 'none', borderRadius: 12, fontSize: 13,
                fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
                opacity: addingName.trim() ? 1 : 0.4,
              }}>Add</button>
              {children.length > 0 && (
                <button onClick={() => setShowAdd(false)} style={{
                  padding: '14px 20px', background: 'transparent',
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  color: C.muted, fontSize: 13, fontFamily: C.mono, cursor: 'pointer',
                }}>Cancel</button>
              )}
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', padding: 16, background: C.surfaceLight,
            border: `2px dashed ${C.border}`, borderRadius: 16,
            color: C.teal, fontSize: 13, fontFamily: C.mono, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>+</span> Add another child
          </button>
        )}

        {/* Info */}
        <div style={{
          marginTop: 24, padding: 14, background: C.surfaceLight,
          borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>How it works</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Each child gets their own Maya — personalized schedule, stats, and personality.
            Tap a child to open their dashboard. Their data syncs to the cloud automatically.
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: '#060c18', border: '1px solid #1a2a3e', borderRadius: 12,
  color: '#e8edf3', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
  outline: 'none', boxSizing: 'border-box',
}
const stepBtn = {
  width: 36, height: 36, borderRadius: 8,
  background: '#121e30', border: '1px solid #1a2a3e',
  color: '#e8edf3', fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'IBM Plex Mono', monospace",
}
