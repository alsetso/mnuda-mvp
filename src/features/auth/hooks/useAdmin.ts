'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';
import { Profile } from '@/types/supabase';

export interface UseAdminReturn {
  isAdmin: boolean;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if the current user is an admin
 * Provides admin status, profile data, and loading states
 */
export function useAdmin(): UseAdminReturn {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          setIsAdmin(false);
          setProfile(null);
          return;
        }

        const userProfile = await ProfileService.getCurrentProfile();
        
        if (!userProfile) {
          setIsAdmin(false);
          setProfile(null);
          setError('Profile not found');
          return;
        }

        setProfile(userProfile);
        setIsAdmin(ProfileService.isAdmin(userProfile));
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to check admin status');
        setIsAdmin(false);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return {
    isAdmin,
    profile,
    isLoading,
    error,
  };
}
