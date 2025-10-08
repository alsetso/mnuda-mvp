/**
 * Server-side Supabase clients for SSR, SSG, ISR, and Route Handlers
 * 
 * - createServerClient: anon client for public reads (RLS-protected)
 * - createServiceClient: service role for build-time operations and admin writes
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

/**
 * Server client with anonymous key (RLS-protected)
 * Use for public read operations in SSR/SSG
 */
export function createServerClient() {
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Service client with service role key (bypasses RLS)
 * Use for build-time operations, admin writes, and secure server actions
 * NEVER expose to client-side code
 */
export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

