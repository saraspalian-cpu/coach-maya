/**
 * Supabase client — initialized from env vars.
 * Returns null if not configured (app falls back to localStorage).
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export function getSupabase() {
  return supabase
}

export function isCloudEnabled() {
  return supabase !== null
}

export default supabase
