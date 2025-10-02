'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useEmailNotifications } from '@/features/email/hooks/useEmailNotifications';

type AuthUser = User;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const emailNotifications = useEmailNotifications();

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
          
          // Send welcome email on first sign in
          if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
            const welcomeResult = await emailNotifications.sendWelcomeEmail(
              session.user.email!,
              session.user.user_metadata?.full_name
            );
            
            if (!welcomeResult.success) {
              console.warn('Custom welcome email failed:', welcomeResult.error);
            }
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [emailNotifications]);

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
      
      // Send custom signup confirmation email if user needs to confirm
      if (data.user && !data.user.email_confirmed_at) {
        const confirmationUrl = `${window.location.origin}/account?token=${data.user.id}`;
        const emailResult = await emailNotifications.sendSignupConfirmation(
          email,
          confirmationUrl,
          data.user.user_metadata?.full_name
        );
        
        if (!emailResult.success) {
          console.warn('Custom signup email failed, Supabase default email will be sent:', emailResult.error);
        }
      }
      
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Sign up error:', error);
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
