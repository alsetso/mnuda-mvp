import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import type { AccountRole, MemberRole } from '@/features/auth/services/memberService';

// Route protection configuration
const ROUTE_PROTECTION: Record<string, { 
  auth: boolean; 
  roles?: AccountRole[];
}> = {
  '/account': { auth: true },
  '/account/settings': { auth: true },
  '/account/billing': { auth: true },
  '/map-test': { auth: true },
};

/**
 * Check if account has all required fields
 */
function isAccountComplete(account: {
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  age: number | null;
  image_url: string | null;
  username: string | null;
} | null): boolean {
  if (!account) return false;
  
  return !!(
    account.username &&
    account.first_name &&
    account.last_name &&
    account.gender &&
    account.age &&
    account.image_url
  );
}

/**
 * Get user account data (role, onboarded status, and completeness)
 */
async function getUserAccountData(
  supabase: ReturnType<typeof createServerClient>, 
  userId: string
): Promise<{
  role: AccountRole | null;
  onboarded: boolean | null;
  isComplete: boolean;
}> {
  // Try to get account role, onboarded status, and completeness fields
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('role, onboarded, username, first_name, last_name, gender, age, image_url')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  // If account doesn't exist or query fails, allow access (account will be created)
  if (accountError || !account) {
    if (accountError && accountError.code !== 'PGRST116') {
      console.warn('[middleware] Account lookup error:', accountError);
    }
    return {
      role: null,
      onboarded: null,
      isComplete: false,
    };
  }

  // Normalize role value
  let roleValue: string;
  if (typeof account.role === 'string') {
    roleValue = account.role.toLowerCase().trim();
  } else {
    roleValue = String(account.role).toLowerCase().trim();
  }

  const validRoles: AccountRole[] = ['general', 'admin'];
  const role: AccountRole | null = validRoles.includes(roleValue as AccountRole) 
    ? (roleValue as AccountRole) 
    : null;

  // Check if account is complete (all required fields filled)
  const isComplete = isAccountComplete(account);
  
  // Check onboarded status
  const onboarded = account.onboarded === true ? true : false;
  
  return {
    role,
    onboarded,
    isComplete,
  };
}

/**
 * Check if path matches protected route pattern
 */
function matchesProtectedRoute(pathname: string): { 
  auth: boolean; 
  roles?: AccountRole[];
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

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const pathname = req.nextUrl.pathname;
  const protection = matchesProtectedRoute(pathname);

  // Always refresh session for API routes to ensure cookies are set
  // This is critical for authenticated API calls
  const isApiRoute = pathname.startsWith('/api/');

  // Create Supabase client to refresh session
  // Use getAll() pattern like other server-side code to ensure cookies are read correctly
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // Refresh session for API routes (this ensures cookies are set)
  if (isApiRoute) {
    await supabase.auth.getUser();
    return response;
  }

  // Get session and refresh if needed (getUser triggers refresh, getSession does not)
  // This helps keep sessions alive across requests
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // MIDDLEWARE ONLY HANDLES AUTHENTICATION, NOT ONBOARDING
  // Onboarding checks are handled at the page level to prevent redirect loops
  // This simplifies the flow and makes it easier to debug

  // No protection needed for this route
  if (!protection) {
    return response;
  }

  // Check authentication requirement for protected routes
  // Only redirect if there's actually no user
  // If user exists, allow access even if there was an auth error (might be session refresh issue)
  if (protection.auth && !user) {
    // Log auth errors for debugging
    if (authError) {
      const errorMessage = authError.message || '';
      const isSessionError = errorMessage.includes('session') || 
                            errorMessage.includes('Session') ||
                            errorMessage.includes('Auth session missing');
      
      if (!isSessionError) {
        console.warn('[middleware] Auth error:', authError.message);
      }
    }
    
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    redirectUrl.searchParams.set('message', 'Please sign in to access this page');
    return NextResponse.redirect(redirectUrl);
  }

  // Get account data if we need role check
  let accountData: { role: AccountRole | null; onboarded: boolean | null; isComplete: boolean } | null = null;
  
  if (user && protection?.auth) {
    accountData = await getUserAccountData(supabase, user.id);
  }

  // Check role requirement
  if (protection.roles && protection.roles.length > 0 && user && accountData) {
    if (!accountData.role || !protection.roles.includes(accountData.role)) {
      const redirectUrl = new URL('/', req.url);
      redirectUrl.searchParams.set('message', `Access denied. Required role: ${protection.roles.join(' or ')}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Update last_visit for authenticated users (except for static assets and API routes)
  if (user && protection?.auth && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    // Update last_visit asynchronously (don't block response)
    supabase
      .from('accounts')
      .update({ last_visit: new Date().toISOString() })
      .eq('user_id', user.id)
      .then(() => {
        // Silently handle - don't block request
      })
      .catch((error) => {
        // Log but don't fail request
        console.error('Failed to update last_visit:', error);
      });
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
