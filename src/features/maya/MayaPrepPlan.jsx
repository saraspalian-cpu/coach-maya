/**
 * Prep Planner — competition-linked practice plans.
 * "SASMO in 18 days → 5 problems/day → track daily completion"
 * Links to competitions from MayaCompetitions.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', glassBorder: 'rgba(255,255,255,0.14)',
  text: '#f0f0f5', muted: '#6b6b8a', dim: '#3a3a55',
  teal: '#2DD4BF', gold: '#FFD700', amber: '#FBBF24',
  green: '#34D399', red: '#F87171', blue: '#93C5FD',
  purple: '#A78BFA', pink: '#F472B6', orange: '#FB923C',
  glass: 'rgba(255,255,255,0.08)', blur: 'blur(20px)',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

const PREP_KEY = 'maya_prep_plans'
const COMP_KEY = 'maya_competitions'

const PLAN_TYPES = [
  { id: 'problems', label: 'Problem sets', icon: '🧮', unit: 'problems', defaultDaily: 5 },
  { id: 'pieces', label: 'Pieces / passages', icon: '🎹', unit: 'run-throughs', defaultDaily: 3 },
  { id: 'drills', label: 'Drills / exercises', icon: '🎾', unit: 'drills', defaultDaily: 4 },
  { id: 'pages', label: 'Study pages', icon: '📖', unit: 'pages', defaultDaily: 10 },
  { id: 'minutes', label: 'Focused practice', icon: '⏱', unit: 'minutes', defaultDaily: 45 },
  { id: 'custom', label: 'Custom', icon: '📋', unit: 'units', defaultDaily: 5 },
]

function loadPlans() {
  try { return JSON.parse(localStorage.getItem(PREP_KEY)) || [] } catch { return [] }
}
function savePlans(data) {
  try { localStorage.setItem(PREP_KEY, JSON.stringify(data.slice(0, 100))) } catch {}
}
function loadComps() {
  try { return JSON.parse(localStorage.getItem(COMP_KEY)) || [] } catch { return [] }
}

export default function MayaPrepPlan() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState(loadPlans())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', compId: '', type: 'problems', dailyTarget: 5, customUnit: '',
  })

  const comps = useMemo(() => loadComps(), [])
  const today = new Date().toISOString().slice(0, 10)
  const upcomingComps = comps.filter(c => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))

  const persist = (next) => { setPlans(next); savePlans(next) }

  const createPlan = () => {
    if (!form.name.trim()) return
    const comp = comps.find(c => c.id === form.compId)
    const planType = PLAN_TYPES.find(t => t.id === form.type)
    const plan = {
      id: `prep_${Date.now()}`,
      name: form.name.trim(),
      compId: form.compId || null,
      compName: comp?.name || null,
      compDate: comp?.date || null,
      type: form.type,
      unit: form.type === 'custom' && form.customUnit ? form.customUnit : planType.unit,
      icon: planType.icon,
      dailyTarget: form.dailyTarget,
      log: {}, // { "2025-04-17": 5, "2025-04-18": 3 }
      createdAt: new Date().toISOString(),
    }
    persist([plan, ...plans])
    setForm({ name: '', compId: '', type: 'problems', dailyTarget: 5, customUnit: '' })
    setShowAdd(false)
  }

  const logToday = (planId, amount) => {
    persist(plans.map(p => {
      if (p.id !== planId) return p
      const log = { ...p.log }
      log[today] = Math.max(0, (log[today] || 0) + amount)
      return { ...p, log }
    }))
  }

  const removePlan = (id) => persist(plans.filter(p => p.id !== id))

  // Active plans (comp not past, or no comp linked)
  const activePlans = plans.filter(p => !p.compDate || p.compDate >= today)
  const archivedPlans = plans.filter(p => p.compDate && p.compDate < today)

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: C.mono, paddingBottom: 80, position: 'relative' }}>
      <Header onBack={() => navigate('/')} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Active plans */}
        {activePlans.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 40, marginBottom: 24 }}>
            No active prep plans. Create one linked to an upcoming competition.
          </div>
        )}

        {activePlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} today={today} onLog={logToday} onRemove={removePlan} />
        ))}

        {/* Add button */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', padding: 14, marginTop: 8,
            background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
            border: `2px dashed ${C.glassBorder}`, borderRadius: 14,
            color: C.teal, fontSize: 13, fontFamily: C.mono, cursor: 'pointer',
          }}>+ New Prep Plan</button>
        ) : (
          <div style={{
            padding: 16, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
            borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginTop: 8,
          }}>
            <div style={{ fontSize: 10, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              New prep plan
            </div>

            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. SASMO Prep — Algebra" style={inp} />

            {upcomingComps.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Link to competition (optional)</div>
                <select value={form.compId} onChange={e => setForm({ ...form, compId: e.target.value })}
                  style={{ ...inp, appearance: 'none' }}>
                  <option value="">— No competition —</option>
                  {upcomingComps.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.date})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>What are you tracking?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PLAN_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm({ ...form, type: t.id, dailyTarget: t.defaultDaily })} style={{
                    padding: '6px 10px', background: form.type === t.id ? C.teal + '22' : C.surface,
                    border: `1px solid ${form.type === t.id ? C.teal : C.border}`, borderRadius: 8,
                    color: form.type === t.id ? C.teal : C.muted, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
                  }}>{t.icon} {t.label}</button>
                ))}
              </div>
            </div>

            {form.type === 'custom' && (
              <input value={form.customUnit} onChange={e => setForm({ ...form, customUnit: e.target.value })}
                placeholder="Unit name (e.g. scales)" style={{ ...inp, marginTop: 10 }} />
            )}

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Daily target</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setForm({ ...form, dailyTarget: Math.max(1, form.dailyTarget - 1) })} style={stepBtn}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.teal, minWidth: 40, textAlign: 'center' }}>{form.dailyTarget}</span>
                <button onClick={() => setForm({ ...form, dailyTarget: form.dailyTarget + 1 })} style={stepBtn}>+</button>
                <span style={{ fontSize: 11, color: C.muted }}>
                  {form.type === 'custom' && form.customUnit ? form.customUnit : PLAN_TYPES.find(t => t.id === form.type)?.unit} / day
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={createPlan} disabled={!form.name.trim()} style={{
                flex: 1, padding: 12, background: C.teal, color: C.bg,
                border: 'none', borderRadius: 12, fontSize: 13,
                fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
                opacity: form.name.trim() ? 1 : 0.4,
              }}>Create</button>
              <button onClick={() => setShowAdd(false)} style={{
                padding: '12px 16px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: 12,
                color: C.muted, fontSize: 13, fontFamily: C.mono, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Archived plans */}
        {archivedPlans.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 8 }}>
              Past prep plans
            </div>
            {archivedPlans.slice(0, 10).map(plan => (
              <PlanCard key={plan.id} plan={plan} today={today} onLog={logToday} onRemove={removePlan} archived />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function PlanCard({ plan, today, onLog, onRemove, archived }) {
  const todayDone = plan.log[today] || 0
  const todayPct = Math.min(100, Math.round((todayDone / (plan.dailyTarget || 1)) * 100))
  const todayHit = todayDone >= plan.dailyTarget

  // Days with logs
  const logDays = Object.keys(plan.log).filter(d => plan.log[d] > 0).length
  const daysHitTarget = Object.values(plan.log).filter(v => v >= plan.dailyTarget).length

  // Days until competition
  const daysLeft = plan.compDate ? Math.max(0, Math.ceil((new Date(plan.compDate) - new Date(today)) / 86400000)) : null

  // Total done
  const totalDone = Object.values(plan.log).reduce((s, v) => s + v, 0)

  // Pace check
  const expectedTotal = daysLeft !== null && plan.compDate
    ? plan.dailyTarget * (Math.ceil((new Date(plan.compDate) - new Date(plan.createdAt)) / 86400000))
    : null
  const onPace = expectedTotal ? totalDone >= (expectedTotal - (daysLeft * plan.dailyTarget)) : null

  const commentary = archived ? `Done. ${daysHitTarget} days on target out of ${logDays} logged.`
    : todayHit ? "Today's target hit. Keep the streak or go beyond."
    : daysLeft !== null && daysLeft <= 3 ? `${daysLeft} days left. Every rep counts now.`
    : onPace === false ? "Behind pace. You'll need to make up ground."
    : onPace === true ? "On pace. Don't let up."
    : `${todayDone}/${plan.dailyTarget} today. ${todayDone === 0 ? "Clock's ticking." : "Keep going."}`

  return (
    <div style={{
      padding: 14, background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
      borderRadius: 14, border: `1px solid ${C.glassBorder}`, marginBottom: 10,
      opacity: archived ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{plan.icon} {plan.name}</div>
          {plan.compName && (
            <div style={{ fontSize: 10, color: C.amber, marginTop: 2 }}>
              {plan.compName} {daysLeft !== null ? `· ${daysLeft}d away` : ''}
            </div>
          )}
        </div>
        <button onClick={() => onRemove(plan.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>

      {/* Today's progress */}
      {!archived && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 4 }}>
            <span>Today: {todayDone}/{plan.dailyTarget} {plan.unit}</span>
            <span style={{ color: todayHit ? C.green : C.muted }}>{todayPct}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${todayPct}%`,
              background: todayHit ? C.green : `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
              borderRadius: 4, transition: 'width 300ms',
              boxShadow: todayHit ? `0 0 8px ${C.green}44` : 'none',
            }} />
          </div>

          {/* Quick log buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => onLog(plan.id, 1)} style={logBtn}>+1</button>
            <button onClick={() => onLog(plan.id, 5)} style={logBtn}>+5</button>
            <button onClick={() => onLog(plan.id, plan.dailyTarget - todayDone)} disabled={todayHit}
              style={{ ...logBtn, background: todayHit ? C.green + '22' : C.teal + '22', color: todayHit ? C.green : C.teal, borderColor: todayHit ? C.green : C.teal }}>
              {todayHit ? '✓ Done' : `+${Math.max(0, plan.dailyTarget - todayDone)} (fill)`}
            </button>
            {todayDone > 0 && (
              <button onClick={() => onLog(plan.id, -1)} style={{ ...logBtn, color: C.red, borderColor: C.red + '44' }}>−1</button>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.muted }}>
        <span>Total: <b style={{ color: C.text }}>{totalDone}</b> {plan.unit}</span>
        <span>Days: <b style={{ color: C.text }}>{logDays}</b></span>
        <span>On target: <b style={{ color: daysHitTarget > 0 ? C.green : C.muted }}>{daysHitTarget}d</b></span>
      </div>

      {/* Maya micro-commentary */}
      <div style={{ fontSize: 10, color: C.teal, marginTop: 6, fontStyle: 'italic' }}>
        {commentary}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.glassBorder}`,
      background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.amber, letterSpacing: 2 }}>PREP PLANS</div>
    </div>
  )
}

const inp = {
  width: '100%', padding: '10px 12px',
  background: '#0a0a14', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#f0f0f5', fontSize: 13,
  fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box',
}
const stepBtn = {
  width: 36, height: 36, borderRadius: 8,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#f0f0f5', fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'IBM Plex Mono', monospace",
}
const logBtn = {
  padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  color: '#6b6b8a', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
}
