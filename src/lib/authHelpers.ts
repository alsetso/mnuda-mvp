import { supabase } from './supabase';

/**
 * Checks if an error is an authentication-related error
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorObj = error as { code?: string; message?: string };
  
  // Check for common auth error codes and messages
  return !!(
    errorObj.code === 'PGRST301' ||
    errorObj.code === 'PGRST302' ||
    errorObj.message?.includes('JWT') ||
    errorObj.message?.includes('expired') ||
    errorObj.message?.includes('invalid') ||
    errorObj.message?.includes('authentication') ||
    errorObj.message?.includes('unauthorized')
  );
}

/**
 * Ensures a valid session exists, refreshing if necessary
 * Returns true if session is valid, false if refresh failed
 * Uses getUser() which validates token server-side and triggers auto-refresh if needed
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    // Use getUser() which validates token and triggers refresh if needed
    // Supabase auto-refresh handles token renewal in the background
    // If refresh token is expired, getUser() will fail immediately
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('Session validation failed:', error.message);
      return false;
    }
    
    return !!data.user;
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    return false;
  }
}

/**
 * Executes a Supabase operation with automatic session refresh on auth errors
 * Only refreshes when an actual auth error occurs (no pre-check to avoid false negatives)
 * Retries the operation once after refreshing the session
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Operation'
): Promise<T> {
  try {
    // Execute operation directly - Supabase client handles auto-refresh automatically
    return await operation();
  } catch (error) {
    // Only refresh and retry on actual auth errors
    if (isAuthError(error)) {
      console.warn(`${operationName} failed with auth error, attempting refresh and retry...`);
      
      const hasValidSession = await ensureValidSession();
      if (!hasValidSession) {
        throw new Error('Authentication required. Please refresh the page and try again.');
      }
      
      // Retry the operation once after refresh
      try {
        return await operation();
      } catch (retryError) {
        if (isAuthError(retryError)) {
          throw new Error('Authentication expired. Please refresh the page and try again.');
        }
        throw retryError;
      }
    }
    
    // Not an auth error, re-throw
    throw error;
  }
}

