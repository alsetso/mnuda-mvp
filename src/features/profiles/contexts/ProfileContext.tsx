'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../services/profileService';
import { ProfileService } from '../services/profileService';
import { useAuth } from '@/features/auth';

interface ProfileContextType {
  selectedProfile: Profile | null;
  profiles: Profile[];
  setSelectedProfile: (profile: Profile | null) => void;
  refreshProfiles: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const SELECTED_PROFILE_KEY = 'mnuda_selected_profile_id';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfileState] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setSelectedProfileState(null);
      setIsLoading(false);
      return;
    }

    try {
      const allProfiles = await ProfileService.getCurrentAccountProfiles();
      setProfiles(allProfiles);

      // Load selected profile from localStorage
      const savedProfileId = localStorage.getItem(SELECTED_PROFILE_KEY);
      if (savedProfileId) {
        const savedProfile = allProfiles.find(p => p.id === savedProfileId);
        if (savedProfile) {
          setSelectedProfileState(savedProfile);
          return;
        }
      }

      // Default to first profile if no saved selection
      const defaultProfile = allProfiles[0] || null;
      setSelectedProfileState(defaultProfile);
      if (defaultProfile) {
        localStorage.setItem(SELECTED_PROFILE_KEY, defaultProfile.id);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedProfile = (profile: Profile | null) => {
    setSelectedProfileState(profile);
    if (profile) {
      localStorage.setItem(SELECTED_PROFILE_KEY, profile.id);
    } else {
      localStorage.removeItem(SELECTED_PROFILE_KEY);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        selectedProfile,
        profiles,
        setSelectedProfile,
        refreshProfiles: loadProfiles,
        isLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

