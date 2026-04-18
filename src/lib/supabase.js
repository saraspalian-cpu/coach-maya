/**
 * Supabase client — initialized lazily from env vars.
 * Returns null if not configured (app falls back to localStorage).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
let _initialized = false

function _init() {
  if (_initialized) return
  _initialized = true
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    import('@supabase/supabase-js').then(({ createClient }) => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    }).catch(() => {})
  }
}

export function getSupabase() {
  _init()
  return supabase
}

export function isCloudEnabled() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export default null
