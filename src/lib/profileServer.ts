import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { Profile } from '@/features/profiles/services/profileService';

/**
 * Get server-side Supabase client
 */
function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        set() {
          // Server components can't set cookies
        },
        remove() {
          // Server components can't remove cookies
        },
      },
    }
  );
}

/**
 * Get all profiles for the current user's account (server-side)
 * Uses React cache() to deduplicate requests within the same render
 */
export const getServerProfiles = cache(async (): Promise<Profile[]> => {
  const supabase = getServerSupabase();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return [];
  }

  // Get account for current user
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!account) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return (data || []) as Profile[];
});

/**
 * Get a specific profile by ID (server-side)
 * Uses React cache() to deduplicate requests within the same render
 */
export const getServerProfile = cache(async (profileId: string): Promise<Profile | null> => {
  const supabase = getServerSupabase();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Get account for current user
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!account) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('account_id', account.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Profile doesn't exist
    }
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
});

