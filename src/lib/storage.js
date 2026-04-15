/**
 * Storage abstraction — localStorage first, Supabase sync when available.
 *
 * Every read hits localStorage (instant). Writes go to localStorage AND Supabase.
 * On login, cloud data is pulled down and merged into localStorage.
 *
 * This means the app always works offline. Cloud is a backup + sync layer.
 */
import { getSupabase, isCloudEnabled } from './supabase'

// ─── Current child context ───
let _activeChildId = localStorage.getItem('maya_active_child') || null

export function setActiveChild(childId) {
  _activeChildId = childId
  if (childId) localStorage.setItem('maya_active_child', childId)
  else localStorage.removeItem('maya_active_child')
}

export function getActiveChild() {
  return _activeChildId
}

// ─── Local storage (always works) ───
function localGet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function localSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ─── Cloud sync (best-effort, non-blocking) ───
async function cloudGet(key) {
  const sb = getSupabase()
  if (!sb || !_activeChildId) return null
  try {
    const { data } = await sb
      .from('data_store')
      .select('data')
      .eq('child_id', _activeChildId)
      .eq('key', key)
      .single()
    return data?.data || null
  } catch { return null }
}

async function cloudSet(key, value) {
  const sb = getSupabase()
  if (!sb || !_activeChildId) return
  try {
    await sb
      .from('data_store')
      .upsert({
        child_id: _activeChildId,
        key,
        data: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'child_id,key' })
  } catch {}
}

// ─── Public API ───

/**
 * Read data — always from localStorage (instant).
 */
export function read(key, fallback = null) {
  return localGet(key) ?? fallback
}

/**
 * Write data — localStorage + fire-and-forget cloud sync.
 */
export function write(key, data) {
  localSet(key, data)
  // Non-blocking cloud sync
  if (isCloudEnabled() && _activeChildId) {
    cloudSet(key, data).catch(() => {})
  }
}

/**
 * Pull all cloud data for active child into localStorage.
 * Called on login / child switch.
 */
export async function pullFromCloud() {
  const sb = getSupabase()
  if (!sb || !_activeChildId) return false
  try {
    const { data: rows } = await sb
      .from('data_store')
      .select('key, data, updated_at')
      .eq('child_id', _activeChildId)

    if (!rows || rows.length === 0) return false

    for (const row of rows) {
      // Only overwrite local if cloud is newer
      const localUpdated = localGet(`${row.key}_updated`)
      if (!localUpdated || new Date(row.updated_at) > new Date(localUpdated)) {
        localSet(row.key, row.data)
        localSet(`${row.key}_updated`, row.updated_at)
      }
    }
    return true
  } catch { return false }
}

/**
 * Push all localStorage data to cloud for active child.
 * Called on first cloud setup to migrate existing data.
 */
export async function pushToCloud() {
  const sb = getSupabase()
  if (!sb || !_activeChildId) return false

  const MAYA_KEYS = [
    'maya_state', 'maya_schedule', 'maya_profile', 'maya_memory',
    'maya_lessons', 'maya_vocab', 'maya_intelligence', 'maya_habits',
    'maya_water', 'maya_sleep', 'maya_moods', 'maya_screen_time',
    'maya_typing_records', 'maya_reading', 'maya_math_records',
    'maya_tennis', 'maya_piano', 'maya_workouts', 'maya_journal',
    'maya_challenges', 'maya_shop', 'maya_redemptions',
  ]

  try {
    const rows = MAYA_KEYS
      .map(key => {
        const data = localGet(key)
        if (data === null) return null
        return {
          child_id: _activeChildId,
          key,
          data,
          updated_at: new Date().toISOString(),
        }
      })
      .filter(Boolean)

    if (rows.length > 0) {
      await sb.from('data_store').upsert(rows, { onConflict: 'child_id,key' })
    }
    return true
  } catch { return false }
}

// ─── Profile helpers (special case — profile is used everywhere) ───
export function readProfile() {
  return read('maya_profile', {})
}

export function writeProfile(data) {
  write('maya_profile', data)
}

// ─── Schedule helpers ───
export function readSchedule() {
  return read('maya_schedule', [])
}

export function writeSchedule(data) {
  write('maya_schedule', data)
}
