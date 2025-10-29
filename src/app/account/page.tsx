'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ProfileService } from '@/features/auth';
import { Profile } from '@/types/supabase';
import ProfilePhoto from '@/components/ProfilePhoto';
// Billing UI removed

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState('');

  const getDisplayName = (): string => {
    if (profile) {
      return ProfileService.getDisplayName(profile);
    }
    return user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Load profile data when user is available
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        setProfileError('');
        try {
          const userProfile = await ProfileService.getCurrentProfile(user.id);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
          setProfileError('Failed to load profile information');
        }
      }
    };

    loadProfile();
  }, [user]);

  // Redirect to login if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && !user) {
      // Add a small delay to prevent race conditions with OAuth redirects
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Profile Error */}
      {profileError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
          {profileError}
        </div>
      )}

      {/* Account Summary */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <ProfilePhoto 
            profile={profile} 
            size="md" 
            editable={false}
          />
          <div>
            <h2 className="text-lg font-medium text-gray-900">{getDisplayName()}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Removed billing components */}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
        <Link
          href="/account/settings"
          className="p-3 border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Settings</span>
          </div>
        </Link>

        <Link
          href="/map"
          className="p-3 border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Map</span>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
        <div className="text-center py-6">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  );
}