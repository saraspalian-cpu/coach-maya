/**
 * XP Rewards Shop
 * Parent defines rewards with XP cost. Vasco redeems XP for them.
 * Fully local — just a ledger of redemptions.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const SHOP_KEY = 'maya_shop'
const REDEMPTION_KEY = 'maya_redemptions'

const DEFAULT_SHOP = [
  { id: '30min',  name: '30 min extra screen time',    cost: 100, icon: '📱' },
  { id: '60min',  name: '1 hour extra screen time',    cost: 180, icon: '🎮' },
  { id: 'movie',  name: 'Pick a movie night',          cost: 250, icon: '🍿' },
  { id: 'dessert',name: 'Extra dessert',               cost: 80,  icon: '🍰' },
  { id: 'takeout',name: 'Pick takeout for dinner',     cost: 300, icon: '🍕' },
  { id: 'friend', name: 'Friend over this weekend',    cost: 400, icon: '👥' },
]

function loadShop() {
  try {
    const raw = localStorage.getItem(SHOP_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_SHOP
  } catch { return DEFAULT_SHOP }
}
function saveShop(items) {
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(items)) } catch {}
}
function loadRedemptions() {
  try {
    const raw = localStorage.getItem(REDEMPTION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function saveRedemptions(arr) {
  try { localStorage.setItem(REDEMPTION_KEY, JSON.stringify(arr)) } catch {}
}

export default function MayaShop() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [items, setItems] = useState(loadShop())
  const [redemptions, setRedemptions] = useState(loadRedemptions())
  const [editing, setEditing] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', cost: 100, icon: '🎁' })

  const totalXP = maya.gamification?.totalXP || 0
  const spentXP = redemptions.reduce((s, r) => s + (r.cost || 0), 0)
  const availableXP = totalXP - spentXP

  const redeem = (item) => {
    if (availableXP < item.cost) {
      maya.speakText(`Not enough XP. You need ${item.cost - availableXP} more.`)
      return
    }
    if (!confirm(`Redeem "${item.name}" for ${item.cost} XP?`)) return
    const record = {
      id: `r_${Date.now()}`,
      itemId: item.id,
      name: item.name,
      cost: item.cost,
      icon: item.icon,
      redeemedAt: new Date().toISOString(),
      status: 'pending', // pending → approved by parent
    }
    const next = [record, ...redemptions]
    setRedemptions(next)
    saveRedemptions(next)
    maya.speakText(`Redeemed. ${item.cost} XP spent. Tell your parent.`)
  }

  const addItem = () => {
    if (!newItem.name.trim()) return
    const next = [...items, { ...newItem, id: `c_${Date.now()}` }]
    setItems(next)
    saveShop(next)
    setNewItem({ name: '', cost: 100, icon: '🎁' })
  }

  const removeItem = (id) => {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    saveShop(next)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Balance */}
        <div style={{
          padding: 20, background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Available XP to spend
          </div>
          <div style={{
            fontFamily: C.display, fontSize: 56, lineHeight: 1,
            color: C.teal, marginTop: 4,
          }}>{availableXP}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            {totalXP} earned · {spentXP} spent
          </div>
        </div>

        {/* Toggle edit mode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Rewards
          </div>
          <button onClick={() => setEditing(!editing)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 6, color: C.muted, fontSize: 10,
            padding: '4px 10px', cursor: 'pointer', fontFamily: C.mono,
          }}>{editing ? 'Done' : 'Parent edit'}</button>
        </div>

        {items.map(item => {
          const canAfford = availableXP >= item.cost
          return (
            <div key={item.id} style={{
              padding: 14, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: canAfford ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 28 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>{item.cost} XP</div>
              </div>
              {editing ? (
                <button onClick={() => removeItem(item.id)} style={{
                  padding: '6px 10px', background: 'transparent',
                  border: `1px solid ${C.red}44`, borderRadius: 6,
                  color: C.red, fontSize: 10, cursor: 'pointer',
                }}>Remove</button>
              ) : (
                <button
                  onClick={() => redeem(item)}
                  disabled={!canAfford}
                  style={{
                    padding: '8px 14px', background: canAfford ? C.teal : C.dim,
                    border: 'none', borderRadius: 8,
                    color: C.bg, fontSize: 11, fontWeight: 700,
                    cursor: canAfford ? 'pointer' : 'not-allowed', fontFamily: C.mono,
                  }}
                >Redeem</button>
              )}
            </div>
          )
        })}

        {editing && (
          <div style={{
            padding: 14, background: C.surfaceLight, borderRadius: 12,
            border: `1px dashed ${C.border}`, marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Add reward
            </div>
            <input
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Reward name"
              style={input}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={newItem.icon}
                onChange={e => setNewItem({ ...newItem, icon: e.target.value })}
                placeholder="🎁"
                style={{ ...input, width: 60 }}
              />
              <input
                type="number"
                value={newItem.cost}
                onChange={e => setNewItem({ ...newItem, cost: parseInt(e.target.value) || 0 })}
                placeholder="XP cost"
                style={input}
              />
              <button onClick={addItem} style={{
                padding: '10px 14px', background: C.teal, border: 'none',
                borderRadius: 8, color: C.bg, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Add</button>
            </div>
          </div>
        )}

        {/* Redemption history */}
        {redemptions.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 }}>
              Your redemptions
            </div>
            {redemptions.slice(0, 10).map(r => (
              <div key={r.id} style={{
                padding: 10, background: C.surface, borderRadius: 10,
                border: `1px solid ${C.border}`, marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ fontSize: 20 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.text }}>{r.name}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>
                    {new Date(r.redeemedAt).toLocaleDateString()} · {r.cost} XP
                  </div>
                </div>
                <div style={{
                  fontSize: 9, color: C.amber,
                  padding: '3px 8px', borderRadius: 6,
                  background: C.amber + '22', border: `1px solid ${C.amber}44`,
                }}>Pending</div>
              </div>
            ))}
          </>
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
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>REWARDS SHOP</div>
    </div>
  )
}

const input = {
  flex: 1, padding: '10px 12px', background: C.bg,
  border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none',
  boxSizing: 'border-box', width: '100%',
}
