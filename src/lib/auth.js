/**
 * Auth helpers — parent signup, login, session management.
 * Works with Supabase Auth. When Supabase isn't configured, auth is skipped
 * and the app runs in single-user local mode.
 */
import { getSupabase } from './supabase'

const SESSION_KEY = 'maya_auth_session'

/**
 * Sign up a new parent account.
 */
export async function signUp(email, password) {
  const sb = getSupabase()
  if (!sb) return { error: 'Cloud not configured' }

  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // Create parent record
  if (data.user) {
    await sb.from('parents').upsert({
      id: data.user.id,
      email,
    })
  }

  return { user: data.user, session: data.session }
}

/**
 * Log in an existing parent.
 */
export async function logIn(email, password) {
  const sb = getSupabase()
  if (!sb) return { error: 'Cloud not configured' }

  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { user: data.user, session: data.session }
}

/**
 * Log out.
 */
export async function logOut() {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
  localStorage.removeItem('maya_active_child')
}

/**
 * Get current session (user).
 */
export async function getSession() {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data?.session || null
}

/**
 * Get current user.
 */
export async function getUser() {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

/**
 * Listen for auth state changes.
 */
export function onAuthChange(callback) {
  const sb = getSupabase()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return data.subscription.unsubscribe
}

// ─── Child Management ───

/**
 * Get all children for current parent.
 */
export async function getChildren() {
  const sb = getSupabase()
  if (!sb) return []
  const user = await getUser()
  if (!user) return []

  const { data } = await sb
    .from('children')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at')

  return data || []
}

/**
 * Add a new child.
 */
export async function addChild(name, age = 12) {
  const sb = getSupabase()
  if (!sb) return null
  const user = await getUser()
  if (!user) return null

  const { data, error } = await sb
    .from('children')
    .insert({ parent_id: user.id, name, age })
    .select()
    .single()

  if (error) return null

  // Create empty profile and schedule for the child
  await sb.from('profiles').upsert({ child_id: data.id, data: {} })
  await sb.from('schedules').upsert({ child_id: data.id, tasks: [] })

  return data
}

/**
 * Remove a child.
 */
export async function removeChild(childId) {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from('children').delete().eq('id', childId)
  return !error
}

/**
 * Update child info.
 */
export async function updateChild(childId, updates) {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from('children').update(updates).eq('id', childId)
  return !error
}
