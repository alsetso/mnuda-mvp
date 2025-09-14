import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './env'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
