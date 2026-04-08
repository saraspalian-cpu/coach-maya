import { useState } from 'react'
import { useMaya } from './context/MayaContext'
import { useNavigate } from 'react-router-dom'
import { BASE_XP } from './agents/gamification'

const C = {
  bg: '#060c18',
  surface: '#0c1624',
  surfaceLight: '#121e30',
  border: '#1a2a3e',
  text: '#e8edf3',
  muted: '#6b7f99',
  dim: '#3a4f6a',
  gold: '#FFD700',
  green: '#22C55E',
  red: '#EF4444',
  teal: '#2DD4BF',
  mono: "'IBM Plex Mono', monospace",
  display: "'Bebas Neue', sans-serif",
}

const TASK_TYPES = [
  { value: 'maths', label: 'Maths', icon: '📐' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'writing', label: 'Writing', icon: '✍️' },
  { value: 'piano', label: 'Piano', icon: '🎹' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'exercise', label: 'Exercise', icon: '💪' },
  { value: 'homework', label: 'Homework', icon: '📝' },
  { value: 'revision', label: 'Revision', icon: '🔄' },
  { value: 'chores', label: 'Chores', icon: '🧹' },
  { value: 'reflection', label: 'Reflection', icon: '🪞' },
]

// Whole-day presets — overwrite the schedule with a tested template
const DAY_PRESETS = {
  light: [
    { name: 'Reading', type: 'reading', duration: 30 },
    { name: 'Maths drill', type: 'maths', duration: 30 },
    { name: 'Reflection', type: 'reflection', duration: 10 },
  ],
  normal: [
    { name: 'Maths', type: 'maths', duration: 45 },
    { name: 'Reading', type: 'reading', duration: 30 },
    { name: 'Tennis', type: 'tennis', duration: 60 },
    { name: 'Piano', type: 'piano', duration: 30 },
    { name: 'Reflection', type: 'reflection', duration: 10 },
  ],
  full: [
    { name: 'Morning ritual', type: 'reflection', duration: 10 },
    { name: 'Maths', type: 'maths', duration: 45 },
    { name: 'Reading', type: 'reading', duration: 30 },
    { name: 'Online lesson', type: 'homework', duration: 45 },
    { name: 'Tennis', type: 'tennis', duration: 60 },
    { name: 'Piano', type: 'piano', duration: 30 },
    { name: 'Homework', type: 'homework', duration: 30 },
    { name: 'Evening reflection', type: 'reflection', duration: 10 },
  ],
}

// One-tap templates for common task patterns
const TEMPLATES = [
  { name: 'Maths drill (30m)', type: 'maths', duration: 30 },
  { name: 'Reading session', type: 'reading', duration: 30 },
  { name: 'Piano practice', type: 'piano', duration: 30 },
  { name: 'Tennis drills', type: 'tennis', duration: 60 },
  { name: 'Online lesson', type: 'homework', duration: 45 },
  { name: 'Homework block', type: 'homework', duration: 45 },
  { name: 'Science', type: 'science', duration: 45 },
  { name: 'Writing', type: 'writing', duration: 30 },
  { name: 'Revision', type: 'revision', duration: 30 },
  { name: 'Workout', type: 'exercise', duration: 30 },
  { name: 'Reflection', type: 'reflection', duration: 10 },
]

export default function MayaSchedule() {
  const maya = useMaya()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState(maya.tasks.map(t => ({ ...t })))
  const [editingId, setEditingId] = useState(null)

  const addTask = () => {
    const newTask = {
      id: Date.now().toString(),
      name: '',
      type: 'homework',
      startTime: null,
      duration: 30,
      completed: false,
    }
    setTasks([...tasks, newTask])
    setEditingId(newTask.id)
  }

  const updateTask = (id, updates) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const moveTask = (index, direction) => {
    const newTasks = [...tasks]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newTasks.length) return
    ;[newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]]
    setTasks(newTasks)
  }

  const save = () => {
    const validTasks = tasks.filter(t => t.name.trim())
    maya.updateSchedule(validTasks)
    navigate('/')
  }

  const totalXP = tasks.reduce((sum, t) => sum + (BASE_XP[t.type] || BASE_XP.default), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: C.mono,
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Schedule Builder
          </div>
          <div style={{ fontFamily: C.display, fontSize: 24, letterSpacing: 2, color: C.teal, marginTop: 2 }}>
            VASCO'S DAY
          </div>
        </div>
        <button
          onClick={save}
          style={{
            padding: '10px 20px',
            background: C.teal,
            color: C.bg,
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: C.mono,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>

      {/* Potential XP */}
      <div style={{
        padding: '10px 16px',
        background: C.surfaceLight,
        borderBottom: `1px solid ${C.border}`,
        fontSize: 11,
        color: C.muted,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{tasks.length} tasks</span>
        <span>Potential: <span style={{ color: C.gold }}>{totalXP} base XP</span> (up to {Math.round(totalXP * 2.5)}× with combos)</span>
      </div>

      {/* Day Presets */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Day presets
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(DAY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => {
                if (!confirm(`Replace today's schedule with the "${key}" preset?`)) return
                const newTasks = preset.map((t, i) => ({
                  ...t, id: `${Date.now()}_${i}`,
                  startTime: null, completed: false,
                }))
                setTasks(newTasks)
              }}
              style={{
                flex: 1, padding: '8px 4px',
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 11,
                fontFamily: C.mono, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >{key}</button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div style={{ padding: 16 }}>
        {tasks.map((task, i) => (
          <div key={task.id} style={{
            padding: 14,
            background: C.surface,
            borderRadius: 10,
            border: `1px solid ${editingId === task.id ? C.teal : C.border}`,
            marginBottom: 8,
          }}>
            {editingId === task.id ? (
              // Edit Mode
              <div>
                <input
                  autoFocus
                  value={task.name}
                  onChange={e => updateTask(task.id, { name: e.target.value })}
                  placeholder="Task name..."
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${C.border}`,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: C.mono,
                    outline: 'none',
                    marginBottom: 10,
                  }}
                />

                {/* Type Selector */}
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>Type</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {TASK_TYPES.map(tt => (
                    <button
                      key={tt.value}
                      onClick={() => updateTask(task.id, { type: tt.value, name: task.name || tt.label })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: `1px solid ${task.type === tt.value ? C.teal : C.border}`,
                        background: task.type === tt.value ? C.teal + '22' : 'transparent',
                        color: task.type === tt.value ? C.teal : C.muted,
                        fontSize: 11,
                        fontFamily: C.mono,
                        cursor: 'pointer',
                      }}
                    >
                      {tt.icon} {tt.label}
                    </button>
                  ))}
                </div>

                {/* Duration */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Duration:</span>
                  {[15, 30, 45, 60, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => updateTask(task.id, { duration: d })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${task.duration === d ? C.teal : C.border}`,
                        background: task.duration === d ? C.teal + '22' : 'transparent',
                        color: task.duration === d ? C.teal : C.muted,
                        fontSize: 11,
                        fontFamily: C.mono,
                        cursor: 'pointer',
                      }}
                    >
                      {d}m
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => removeTask(task.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: `1px solid ${C.red}33`,
                      borderRadius: 6,
                      color: C.red,
                      fontSize: 10,
                      fontFamily: C.mono,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: '6px 16px',
                      background: C.teal,
                      color: C.bg,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: C.mono,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div
                onClick={() => setEditingId(task.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 18 }}>
                  {TASK_TYPES.find(tt => tt.value === task.type)?.icon || '📋'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{task.name || 'Untitled task'}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{task.duration}min · {BASE_XP[task.type] || BASE_XP.default} base XP</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={e => { e.stopPropagation(); moveTask(i, -1) }} style={arrowBtn} disabled={i === 0}>↑</button>
                  <button onClick={e => { e.stopPropagation(); moveTask(i, 1) }} style={arrowBtn} disabled={i === tasks.length - 1}>↓</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Task Button */}
        <button
          onClick={addTask}
          style={{
            width: '100%',
            padding: 14,
            background: 'transparent',
            border: `2px dashed ${C.dim}`,
            borderRadius: 10,
            color: C.muted,
            fontSize: 13,
            fontFamily: C.mono,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          + Add Task
        </button>

        {/* Quick templates */}
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 18, marginBottom: 8 }}>
          Quick templates
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => {
                const t = {
                  id: `${Date.now()}_${i}`,
                  name: tpl.name,
                  type: tpl.type,
                  duration: tpl.duration,
                  startTime: null,
                  completed: false,
                }
                setTasks([...tasks, t])
              }}
              style={{
                padding: '6px 10px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                color: C.text,
                fontSize: 10,
                fontFamily: C.mono,
                cursor: 'pointer',
              }}
            >
              + {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Day Button */}
      <div style={{ padding: '0 16px 24px' }}>
        <button
          onClick={() => {
            maya.resetDay()
            navigate('/')
          }}
          style={{
            width: '100%',
            padding: 12,
            background: 'transparent',
            border: `1px solid ${C.red}33`,
            borderRadius: 8,
            color: C.red,
            fontSize: 11,
            fontFamily: C.mono,
            cursor: 'pointer',
          }}
        >
          Reset Today's Progress
        </button>
      </div>
    </div>
  )
}

const arrowBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid #1a2a3e',
  background: 'transparent',
  color: '#6b7f99',
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
