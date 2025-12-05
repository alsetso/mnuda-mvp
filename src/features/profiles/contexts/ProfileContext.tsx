'use client';

import { createContext, useContext, ReactNode } from 'react';

// Stub interface - profiles table has been removed
export interface Profile {
  id: string;
  account_id: string;
  username: string;
  profile_image: string | null;
  profile_type: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  selectedProfile: Profile | null;
  profiles: Profile[];
  setSelectedProfile: (profile: Profile | null) => void;
  refreshProfiles: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Stub implementation - profiles table removed
  const value: ProfileContextType = {
    selectedProfile: null,
    profiles: [],
    setSelectedProfile: () => {},
    refreshProfiles: async () => {},
    isLoading: false,
  };

  return (
    <ProfileContext.Provider value={value}>
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

