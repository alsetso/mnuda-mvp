'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ProfileService } from '@/features/auth';
import { Profile, UserType, SubscriptionStatus } from '@/types/supabase';
import { CreditBalanceWidget, SubscriptionPanel, CompactUsageIndicator } from '@/features/billing';

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    setSignOutError('');
    setShowSignOutConfirm(false);
    
    try {
      await signOut();
      // Clear any local session data
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setSignOutError('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  // Helper functions for formatting
  const formatUserType = (userType: UserType): string => {
    const typeMap: Record<UserType, string> = {
      free: 'Free User',
      premium: 'Premium User',
      admin: 'Administrator',
      buyer: 'Home Buyer',
      realtor: 'Real Estate Agent',
      investor: 'Real Estate Investor',
      wholesaler: 'Wholesaler',
      owner: 'Property Owner',
      lender: 'Lender',
      appraiser: 'Appraiser',
      contractor: 'Contractor',
      other: 'Other'
    };
    return typeMap[userType] || userType;
  };

  const formatSubscriptionStatus = (status: SubscriptionStatus): { text: string; color: string; bgColor: string } => {
    const statusMap: Record<SubscriptionStatus, { text: string; color: string; bgColor: string }> = {
      free: { text: 'Free', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      trial: { text: 'Trial', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      active: { text: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
      past_due: { text: 'Past Due', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      canceled: { text: 'Canceled', color: 'text-red-600', bgColor: 'bg-red-100' },
      unpaid: { text: 'Unpaid', color: 'text-red-600', bgColor: 'bg-red-100' },
      incomplete: { text: 'Incomplete', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      incomplete_expired: { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' },
      trialing: { text: 'Trialing', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    };
    return statusMap[status] || { text: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const getDisplayName = (): string => {
    if (profile) {
      return ProfileService.getDisplayName(profile);
    }
    return user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Load profile data when user is available
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setProfileLoading(true);
        setProfileError('');
        try {
          const userProfile = await ProfileService.getCurrentProfile();
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
          setProfileError('Failed to load profile information');
        } finally {
          setProfileLoading(false);
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
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">{getDisplayName()}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            {profile && (
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status || 'free').bgColor} ${formatSubscriptionStatus(profile.subscription_status || 'free').color}`}>
                  {formatSubscriptionStatus(profile.subscription_status || 'free').text}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {formatUserType(profile.user_type || 'free')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CreditBalanceWidget showDetails={false} compact={true} />
        <SubscriptionPanel showActions={false} compact={true} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link
          href="/account/billing"
          className="p-3 border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Billing</span>
          </div>
        </Link>

        <Link
          href="/account/usage"
          className="p-3 border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Usage</span>
          </div>
        </Link>

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