import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { MemberRole } from '@/features/auth/services/memberService';
import { Database } from '@/types/supabase';

export interface ServerAuthUser {
  id: string;
  email: string;
  role: MemberRole | null;
  name: string | null;
}

/**
 * Get the current authenticated user's auth and role information
 * Uses React cache() to deduplicate requests within the same render
 * Returns null if user is not authenticated
 * 
 * This is the primary function to use in server components for checking auth/role
 */
export const getServerAuth = cache(async (): Promise<ServerAuthUser | null> => {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
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
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Get member role in the same query
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('role, name, email')
    .eq('id', user.id)
    .single();

  if (memberError) {
    console.error('Error fetching member:', memberError);
    // User exists in auth but not in members table - return user without role
    return {
      id: user.id,
      email: user.email || '',
      role: null,
      name: user.user_metadata?.name || null,
    };
  }

  if (!member) {
    // User exists in auth but not in members table - return user without role
    return {
      id: user.id,
      email: user.email || '',
      role: null,
      name: user.user_metadata?.name || null,
    };
  }

  // Ensure role is a string (PostgreSQL enums can sometimes be returned differently)
  // Handle both string and enum types from PostgreSQL
  let roleValue: string;
  if (typeof member.role === 'string') {
    roleValue = member.role.toLowerCase().trim();
  } else {
    // If it's an object (PostgreSQL enum), extract the value
    roleValue = String(member.role).toLowerCase().trim();
  }
  
  // Validate role is one of the expected values
  const validRoles: MemberRole[] = ['general', 'investor', 'admin'];
  const normalizedRole: MemberRole | null = validRoles.includes(roleValue as MemberRole) 
    ? (roleValue as MemberRole) 
    : null;
  
  // Debug logging for role normalization (only log if there's an issue)
  if (!normalizedRole && member.role) {
    console.warn('Role normalization issue:', {
      original: member.role,
      originalType: typeof member.role,
      normalized: normalizedRole,
      roleValue,
      userId: user.id,
      email: user.email,
    });
  }

  return {
    id: user.id,
    email: member.email || user.email || '',
    role: normalizedRole,
    name: member.name,
  };
});

/**
 * Get the current user's role only
 * Convenience function that returns just the role
 */
export const getServerRole = cache(async (): Promise<MemberRole | null> => {
  const auth = await getServerAuth();
  return auth?.role || null;
});

/**
 * Check if the current user is an admin
 * Convenience function for admin checks
 */
export const isServerAdmin = cache(async (): Promise<boolean> => {
  const auth = await getServerAuth();
  return auth?.role === 'admin';
});

/**
 * Require authentication - throws/redirects if not authenticated
 * Use in server components that require auth
 */
export async function requireServerAuth(): Promise<ServerAuthUser> {
  const auth = await getServerAuth();
  
  if (!auth) {
    // In server components, we can't redirect directly
    // The calling component should handle the redirect
    throw new Error('UNAUTHENTICATED');
  }
  
  return auth;
}

/**
 * Require admin role - throws if not admin
 * Use in server components that require admin
 */
export async function requireServerAdmin(): Promise<ServerAuthUser> {
  const auth = await requireServerAuth();
  
  if (auth.role !== 'admin') {
    throw new Error('UNAUTHORIZED');
  }
  
  return auth;
}

