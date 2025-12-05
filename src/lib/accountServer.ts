import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Account, AccountType, AccountRole } from '@/features/auth/services/memberService';

/**
 * Get server-side Supabase client
 */
async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components can't set cookies
        },
      },
    }
  );
}

/**
 * Get the current user's account record (server-side)
 * Uses React cache() to deduplicate requests within the same render
 * Returns null if user is not authenticated or account doesn't exist
 */
export const getServerAccount = cache(async (): Promise<Account | null> => {
  const supabase = await getServerSupabase();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Account doesn't exist
    }
    console.error('Error fetching account:', error);
    return null;
  }

  return data as Account;
});

