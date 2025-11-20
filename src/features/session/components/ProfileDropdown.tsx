'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, AccountService, Account } from '@/features/auth';
import { ProfileService, Profile } from '@/features/profiles/services/profileService';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import ProfilePhoto from '@/components/ProfilePhoto';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = '' }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { selectedProfile, profiles, setSelectedProfile, refreshProfiles } = useProfile();

  useEffect(() => {
    const fetchAccount = async () => {
      if (user) {
        try {
          const accountData = await AccountService.getCurrentAccount();
          setAccount(accountData);
        } catch (error) {
          console.error('Error fetching account for ProfileDropdown:', error);
        }
      }
    };

    fetchAccount();
  }, [user]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  if (!user) {
    return (
      <Link
        href="/login"
        className={`px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-header-focus/60 border border-header-focus rounded transition-colors ${className}`}
      >
        Sign In
      </Link>
    );
  }

  const handleProfileSwitch = async (profile: Profile) => {
    setSelectedProfile(profile);
    setIsOpen(false);
    // Refresh the page to load new profile experience
    router.refresh();
  };

  const displayName = selectedProfile 
    ? ProfileService.getDisplayName(selectedProfile)
    : AccountService.getDisplayName(account);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Profile Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-2 px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border ${
          isOpen
            ? 'text-gold-400 bg-header-focus/60 border-header-focus'
            : 'text-gray-300 hover:text-gold-400 hover:bg-header-focus/60 border-transparent hover:border-header-focus'
        }`}
      >
        <ProfilePhoto 
          profile={selectedProfile}
          account={account}
          size="sm"
          editable={false}
        />
        <span className="hidden sm:inline text-xs max-w-[100px] truncate">{displayName}</span>
        <svg 
          className={`w-4 h-4 transition-all duration-200 ${isOpen ? 'rotate-180 text-gold-400' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full w-64 bg-black/95 backdrop-blur-md z-50 overflow-hidden rounded-lg border border-header-focus">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-header-focus">
              <p className="text-sm font-medium text-gray-100">{user.email}</p>
              <p className="text-xs text-gray-400">Account</p>
            </div>

            {/* Profile Switcher */}
            <div className="px-4 py-2 border-b border-header-focus">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Switch Profile</p>
              {profiles.length > 0 ? (
                <div className="space-y-1">
                  {profiles.map((profile) => {
                    const isSelected = selectedProfile?.id === profile.id;
                    const profileDisplayName = ProfileService.getDisplayName(profile);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleProfileSwitch(profile)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-all duration-200 ${
                          isSelected
                            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                            : 'text-gray-300 hover:text-gold-400 hover:bg-header-focus/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ProfilePhoto 
                            profile={profile}
                            account={account}
                            size="xs"
                            editable={false}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium truncate">{profileDisplayName}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {profile.profile_type?.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-gold-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">
                  <p className="mb-2">No profiles yet</p>
                  <Link
                    href="/account/profiles"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg transition-colors text-xs font-medium"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Set Up Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <Link
              href="/account/profiles"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Manage Profiles
            </Link>
            <Link
              href="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <Link
              href="/account/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing
            </Link>
            {/* Sign Out */}
            <div className="border-t border-header-focus mt-1">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-gray-800/60 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
