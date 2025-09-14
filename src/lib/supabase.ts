import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './env'

// Only create Supabase client if we have valid environment variables
// This prevents build errors when environment variables are not set
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.startsWith('placeholder_') && 
  !supabaseAnonKey.startsWith('placeholder_') &&
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here';

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
