import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './env'

// Only create Supabase client if we have valid environment variables
// This prevents build errors when environment variables are not set
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.startsWith('placeholder_') && 
  !supabaseAnonKey.startsWith('placeholder_');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
