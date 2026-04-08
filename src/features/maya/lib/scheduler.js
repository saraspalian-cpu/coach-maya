/**
 * Local scheduled notifications.
 * A tiny watchdog that checks every minute for upcoming tasks,
 * combo expiry, and evening reflection. Fires via notify() which
 * routes through the service worker.
 */

import { notify, getPermission } from './notifications'

let watchdogId = null
let firedKeys = new Set()

function clearFiredKeysIfNewDay() {
  const today = new Date().toISOString().slice(0, 10)
  if (firedKeys._day !== today) {
    firedKeys = new Set()
    firedKeys._day = today
  }
}

async function tick(getState) {
  if (getPermission() !== 'granted') return
  clearFiredKeysIfNewDay()
  try {
    const state = getState()
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const today = now.toISOString().slice(0, 10)

    // 1. Morning greeting at 7am (once per day)
    const morningKey = `morning_${today}`
    if (hour === 7 && minute < 5 && !firedKeys.has(morningKey)) {
      firedKeys.add(morningKey)
      notify('Morning, Vasco.', `Day ${state.profile?.currentStreak || 1}. Let's ship it.`, { tag: 'maya-morning' })
    }

    // 2. Evening wrap at 8pm
    const eveningKey = `evening_${today}`
    if (hour === 20 && minute < 5 && !firedKeys.has(eveningKey)) {
      firedKeys.add(eveningKey)
      const done = state.tasks?.filter(t => t.completed).length || 0
      const total = state.tasks?.length || 0
      notify('Evening wrap time', `${done}/${total} tasks today. Reflect?`, { tag: 'maya-evening' })
    }

    // 3. Combo expiry warning (if combo alive and last activity > 35 min)
    if (state.lastActivityTime && state.gamification?.combo >= 3) {
      const last = new Date(state.lastActivityTime).getTime()
      const mins = Math.floor((Date.now() - last) / 60000)
      const comboKey = `combo_${last}_${state.gamification.combo}`
      if (mins >= 35 && mins < 45 && !firedKeys.has(comboKey)) {
        firedKeys.add(comboKey)
        notify('Combo expiring', `${state.gamification.combo}× combo dies in ~10 min. Your call.`, { tag: 'maya-combo', requireInteraction: true })
      }
    }

    // 4. Overdue tasks (after 2pm, still incomplete, once per task per day)
    if (hour >= 14) {
      (state.tasks || []).forEach(t => {
        if (t.completed || t.skipped) return
        const key = `overdue_${today}_${t.id}`
        if (!firedKeys.has(key)) {
          firedKeys.add(key)
          notify('Task still waiting', `"${t.name}" hasn't been touched yet today.`, { tag: `maya-task-${t.id}` })
        }
      })
    }
  } catch (e) { console.warn('scheduler tick error', e) }
}

function startWatchdog(getState) {
  if (watchdogId) return
  watchdogId = setInterval(() => tick(getState), 60 * 1000)
  // Initial tick
  setTimeout(() => tick(getState), 2000)
}

function stopWatchdog() {
  if (watchdogId) clearInterval(watchdogId)
  watchdogId = null
}

export { startWatchdog, stopWatchdog }
