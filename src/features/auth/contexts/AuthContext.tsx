'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthUser = User;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  signUpWithOtp: (email: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUpWithMagicLink: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string, type: 'email') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Get initial user - getUser() validates token server-side and triggers auto-refresh if needed
    const getInitialUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Session check timeout, assuming no session');
            setUser(null);
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout

        // Use getUser() instead of getSession() - validates token and triggers refresh if needed
        const { data: { user }, error } = await supabase.auth.getUser();
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;

        if (error) {
          // AuthSessionMissingError is expected on public pages, don't log it as an error
          const errorMessage = error.message || '';
          const errorName = (error as { name?: string })?.name || '';
          const isSessionMissingError = 
            errorMessage.includes('Auth session missing') || 
            errorMessage.includes('session') ||
            errorName === 'AuthSessionMissingError';
          
          if (!isSessionMissingError) {
            console.error('Error getting initial user:', error);
          }
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        setUser(user);
        setIsLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        // AuthSessionMissingError is expected on public pages, don't log it as an error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = (error as { name?: string })?.name || '';
        const isSessionMissingError = 
          errorMessage.includes('Auth session missing') || 
          errorMessage.includes('session') ||
          errorName === 'AuthSessionMissingError';
        
        if (!isSessionMissingError) {
          console.error('Error getting initial user:', error);
        }
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    getInitialUser();

    // Listen for auth changes - Supabase handles automatic token refresh via autoRefreshToken
    // The TOKEN_REFRESHED event will fire automatically when tokens are refreshed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Handle all auth state changes
        if (session?.user) {
          setUser(session.user);
          
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent infinite re-renders

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account/settings`,
        },
      });
      if (error) throw error;
      
      
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const signInWithOtp = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Creates user ONLY when OTP is verified
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in with OTP error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithOtp = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Create account if doesn't exist
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign up with OTP error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Only existing users
          emailRedirectTo: `${window.location.origin}/account/settings`,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in with magic link error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithMagicLink = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Create account if doesn't exist
          emailRedirectTo: `${window.location.origin}/account/settings`,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign up with magic link error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'email') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: type
      });
      if (error) throw error;
      
      // Wait for user to be established - getUser() validates and refreshes token
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
      // Auth state change listener will also fire, but we set user here for immediate update
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user state immediately for better UX
      setUser(null);
      
      
      // Clear any local storage data
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      localStorage.removeItem('freemap_api_usage');
      
      // User will also be cleared by the auth state change listener
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithOtp,
    signUpWithOtp,
    signInWithMagicLink,
    signUpWithMagicLink,
    verifyOtp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
