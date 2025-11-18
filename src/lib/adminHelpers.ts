import { redirect } from 'next/navigation';
import { getServerAuth, requireServerAdmin } from '@/lib/authServer';

/**
 * Check if the current user is an admin
 * Returns the member record if admin, null otherwise
 * @deprecated Use getServerAuth() or isServerAdmin() from '@/lib/authServer' instead
 */
export async function checkAdminAccess(): Promise<{ id: string; email: string; name: string | null } | null> {
  const auth = await getServerAuth();
  
  if (!auth || auth.role !== 'admin') {
    return null;
  }

  return {
    id: auth.id,
    email: auth.email,
    name: auth.name,
  };
}

/**
 * Require admin access - redirects to login if not authenticated or to home if not admin
 * Use this in server components and route handlers
 * @deprecated Use requireServerAdmin() from '@/lib/authServer' instead, with manual redirect handling
 */
export async function requireAdmin(): Promise<{ id: string; email: string; name: string | null }> {
  try {
    const auth = await requireServerAdmin();
    return {
      id: auth.id,
      email: auth.email,
      name: auth.name,
    };
  } catch (error) {
    const auth = await getServerAuth();
    
    if (!auth) {
      redirect('/login?redirect=/admin&message=Please sign in to access admin panel');
    }
    
    // User is authenticated but not admin
    redirect('/?message=Access denied. Admin privileges required.');
  }
}

/**
 * Get admin status for client components
 * Returns true if user is admin, false otherwise
 * @deprecated Use isServerAdmin() from '@/lib/authServer' instead
 */
export async function isAdmin(): Promise<boolean> {
  const auth = await getServerAuth();
  return auth?.role === 'admin';
}

