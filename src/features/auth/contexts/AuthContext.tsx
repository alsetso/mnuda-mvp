'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ProfileService } from '../services/profileService';

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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (session?.user) {
          setUser(session.user);
          
          // Link invited user to workspaces if they just signed up
          if (event === 'SIGNED_IN' && session.user.email) {
            try {
              await ProfileService.linkInvitedUserToWorkspaces(session.user.id, session.user.email);
            } catch (error) {
              console.error('Error linking user to workspaces:', error);
            }
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
          emailRedirectTo: `${window.location.origin}/account`,
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
          emailRedirectTo: `${window.location.origin}/account`,
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
          emailRedirectTo: `${window.location.origin}/account`,
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
      
      // User will be set by the auth state change listener
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
