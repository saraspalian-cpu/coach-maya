import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { createInitialState } from '../agents/gamification'
import { getComboTimeLeft } from '../agents/scheduler'
import { evaluateResponse, createSpotCheckRecord } from '../agents/antiGaming'
import {
  handleTaskComplete,
  handleTaskSkip,
  handleScheduleTick,
  handleUserChat,
  handleMorningStart,
  handleMoodCheck,
  handleReflection,
} from '../agents/orchestrator'

const MayaContext = createContext(null)

// ─── Local Storage Keys ───
const STORAGE_KEY = 'maya_state'
const SCHEDULE_KEY = 'maya_schedule'
const HISTORY_KEY = 'maya_history'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ─── Default Schedule (Vasco's typical day) ───
const DEFAULT_SCHEDULE = [
  { id: '1', name: 'Maths', type: 'maths', startTime: null, duration: 45, completed: false },
  { id: '2', name: 'Reading', type: 'reading', startTime: null, duration: 30, completed: false },
  { id: '3', name: 'Tennis', type: 'tennis', startTime: null, duration: 60, completed: false },
  { id: '4', name: 'Piano', type: 'piano', startTime: null, duration: 30, completed: false },
  { id: '5', name: 'Reflection', type: 'reflection', startTime: null, duration: 10, completed: false },
]

// ─── Reducer ───
function mayaReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'ADD_MESSAGES':
      return { ...state, messages: [...state.messages, ...action.payload] }
    case 'COMPLETE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      )
      return { ...state, tasks }
    }
    case 'SKIP_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, skipped: true } : t
      )
      return { ...state, tasks }
    }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'SET_GAMIFICATION':
      return { ...state, gamification: action.payload }
    case 'SET_PENDING_SPOT_CHECK':
      return { ...state, pendingSpotCheck: action.payload }
    case 'CLEAR_SPOT_CHECK':
      return { ...state, pendingSpotCheck: null }
    case 'SET_MOOD':
      return { ...state, todayMood: action.payload }
    case 'ADD_SPOT_CHECK':
      return { ...state, spotChecks: [...(state.spotChecks || []), action.payload] }
    case 'RESET_DAY': {
      const tasks = state.tasks.map(t => ({ ...t, completed: false, skipped: false, completedAt: null }))
      return {
        ...state,
        tasks,
        messages: [],
        dayLog: [],
        todayMood: null,
        pendingSpotCheck: null,
        spotChecks: [],
        gamification: createInitialState(tasks.length),
      }
    }
    default:
      return state
  }
}

// ─── Provider ───
function MayaProvider({ children }) {
  const savedState = loadFromStorage(STORAGE_KEY, null)
  const savedSchedule = loadFromStorage(SCHEDULE_KEY, DEFAULT_SCHEDULE)

  const initialTasks = savedSchedule.map(t => ({ ...t, completed: false, skipped: false }))
  const initialState = {
    tasks: savedState?.tasks || initialTasks,
    gamification: savedState?.gamification || createInitialState(initialTasks.length),
    messages: savedState?.messages || [],
    dayLog: savedState?.dayLog || [],
    unlockedAchievements: savedState?.unlockedAchievements || [],
    lastActivityTime: savedState?.lastActivityTime || null,
    pendingSpotCheck: savedState?.pendingSpotCheck || null,
    spotChecks: savedState?.spotChecks || [],
    todayMood: savedState?.todayMood || null,
    streak: savedState?.streak || 0,
    personalityContext: savedState?.personalityContext || '',
  }

  const [state, dispatch] = useReducer(mayaReducer, initialState)
  const tickRef = useRef(null)

  // Persist state on every change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, state)
  }, [state])

  // ─── Actions ───
  const completeTask = useCallback(async (taskId) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task || task.completed) return

    dispatch({ type: 'COMPLETE_TASK', payload: { id: taskId } })

    const orchestratorState = {
      gamification: state.gamification,
      unlockedAchievements: state.unlockedAchievements,
      lastActivityTime: state.lastActivityTime,
      dayLog: state.dayLog,
      tasks: state.tasks,
    }

    const result = await handleTaskComplete(task, orchestratorState, state.personalityContext)

    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      unlockedAchievements: result.state.unlockedAchievements,
      lastActivityTime: result.state.lastActivityTime,
      dayLog: result.state.dayLog,
      pendingSpotCheck: result.state.pendingSpotCheck || null,
    }})

    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
  }, [state])

  const skipTask = useCallback(async (taskId) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) return

    dispatch({ type: 'SKIP_TASK', payload: { id: taskId } })

    const result = await handleTaskSkip(task, {
      gamification: state.gamification,
      dayLog: state.dayLog,
    }, state.personalityContext)

    dispatch({ type: 'SET_STATE', payload: { gamification: result.state.gamification, dayLog: result.state.dayLog } })
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
  }, [state])

  const sendMessage = useCallback(async (text) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { text, type: 'user', timestamp: new Date().toISOString() } })
    const result = await handleUserChat(text, state, state.personalityContext)
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
  }, [state])

  const setMood = useCallback(async (mood) => {
    const result = await handleMoodCheck(mood, state)
    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      todayMood: result.state.todayMood,
      dayLog: result.state.dayLog,
    }})
    dispatch({ type: 'SET_MOOD', payload: mood })
  }, [state])

  const submitReflection = useCallback(async (text) => {
    const result = await handleReflection(text, state, state.personalityContext)
    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      dayLog: result.state.dayLog,
    }})
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
  }, [state])

  const updateSchedule = useCallback((newTasks) => {
    saveToStorage(SCHEDULE_KEY, newTasks)
    const tasks = newTasks.map(t => ({ ...t, completed: false, skipped: false }))
    dispatch({ type: 'SET_TASKS', payload: tasks })
    dispatch({ type: 'SET_STATE', payload: { gamification: createInitialState(tasks.length) } })
  }, [])

  const resetDay = useCallback(() => {
    dispatch({ type: 'RESET_DAY' })
  }, [])

  const respondToSpotCheck = useCallback((response) => {
    if (!state.pendingSpotCheck) return
    const evaluation = evaluateResponse(response)
    const record = createSpotCheckRecord(
      { id: state.pendingSpotCheck.taskId, name: state.pendingSpotCheck.taskName, type: state.pendingSpotCheck.taskType },
      state.pendingSpotCheck.question,
      response,
      evaluation
    )
    dispatch({ type: 'ADD_SPOT_CHECK', payload: record })
    dispatch({ type: 'CLEAR_SPOT_CHECK' })
  }, [state.pendingSpotCheck])

  // ─── Schedule Tick (every 5 min) ───
  useEffect(() => {
    tickRef.current = setInterval(async () => {
      const result = await handleScheduleTick({
        tasks: state.tasks,
        gamification: state.gamification,
        lastActivityTime: state.lastActivityTime,
      }, state.personalityContext)
      if (result.messages.length > 0) {
        dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(tickRef.current)
  }, [state.tasks, state.gamification, state.lastActivityTime, state.personalityContext])

  const comboTimeLeft = getComboTimeLeft(state.lastActivityTime)

  const value = {
    // State
    tasks: state.tasks,
    gamification: state.gamification,
    messages: state.messages,
    dayLog: state.dayLog,
    unlockedAchievements: state.unlockedAchievements,
    pendingSpotCheck: state.pendingSpotCheck,
    spotChecks: state.spotChecks,
    todayMood: state.todayMood,
    streak: state.streak,
    comboTimeLeft,
    // Actions
    completeTask,
    skipTask,
    sendMessage,
    setMood,
    submitReflection,
    updateSchedule,
    resetDay,
    respondToSpotCheck,
  }

  return <MayaContext.Provider value={value}>{children}</MayaContext.Provider>
}

function useMaya() {
  const ctx = useContext(MayaContext)
  if (!ctx) throw new Error('useMaya must be used within MayaProvider')
  return ctx
}

export { MayaProvider, useMaya }
