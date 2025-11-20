import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import type { AccountRole, MemberRole } from '@/features/auth/services/memberService';

// Route protection configuration
const ROUTE_PROTECTION: Record<string, { 
  auth: boolean; 
  roles?: AccountRole[];
  requireAccountComplete?: boolean;
}> = {
  '/admin': { auth: true, roles: ['admin'] },
  '/account': { auth: true },
  '/account/onboarding': { auth: true, requireAccountComplete: false },
  '/account/profiles': { auth: true, requireAccountComplete: true },
  '/account/settings': { auth: true, requireAccountComplete: true },
  '/account/billing': { auth: true, requireAccountComplete: true },
};

/**
 * Get user role from database
 */
async function getUserRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<AccountRole | null> {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !account) {
    return null;
  }

  // Normalize role value
  let roleValue: string;
  if (typeof account.role === 'string') {
    roleValue = account.role.toLowerCase().trim();
  } else {
    roleValue = String(account.role).toLowerCase().trim();
  }

  const validRoles: AccountRole[] = ['general', 'admin'];
  return validRoles.includes(roleValue as AccountRole) ? (roleValue as AccountRole) : null;
}

/**
 * Check if path matches protected route pattern
 */
function matchesProtectedRoute(pathname: string): { 
  auth: boolean; 
  roles?: AccountRole[];
  requireAccountComplete?: boolean;
} | null {
  // Exact matches first (most specific)
  if (ROUTE_PROTECTION[pathname]) {
    return ROUTE_PROTECTION[pathname];
  }

  // Prefix matches (e.g., /admin/articles matches /admin)
  for (const [route, config] of Object.entries(ROUTE_PROTECTION)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }

  return null;
}

/**
 * Check if account is complete (has profile with username)
 */
async function isAccountComplete(
  supabase: ReturnType<typeof createServerClient>, 
  userId: string
): Promise<boolean> {
  // Check if account exists (accounts no longer have required fields like username)
  // Username is now on profiles, so we just check if account exists
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  // Account is "complete" if it exists - user manages profiles separately
  return !error && !!account;
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const pathname = req.nextUrl.pathname;
  const protection = matchesProtectedRoute(pathname);

  // No protection needed for this route
  if (!protection) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get session and refresh if needed (getUser triggers refresh, getSession does not)
  // This helps keep sessions alive across requests
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Check authentication requirement
  if (protection.auth && (!user || authError)) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    redirectUrl.searchParams.set('message', 'Please sign in to access this page');
    return NextResponse.redirect(redirectUrl);
  }

  // Check role requirement
  if (protection.roles && protection.roles.length > 0 && user) {
    const userRole = await getUserRole(supabase, user.id);
    
    if (!userRole || !protection.roles.includes(userRole)) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('message', `Access denied. Required role: ${protection.roles.join(' or ')}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check account completeness requirement
  if (protection.requireAccountComplete && user) {
    const accountComplete = await isAccountComplete(supabase, user.id);
    
    if (!accountComplete) {
      // Redirect to account onboarding if account is not complete
      const redirectUrl = new URL('/account/onboarding', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      redirectUrl.searchParams.set('message', 'Please complete your account setup first');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If on onboarding page but account already exists, redirect to profiles
  if (pathname === '/account/onboarding' && user) {
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    // If account exists, redirect to profiles (user should manage profiles there)
    if (account) {
      return NextResponse.redirect(new URL('/account/profiles', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
