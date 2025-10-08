'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/features/session/components/AppHeader';
import { useAuth, ProfileService } from '@/features/auth';
import { Profile, UserType, SubscriptionStatus } from '@/types/supabase';
import { StripeBillingPortal } from '@/features/billing';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'buyer' as UserType
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
      buyer: 'Home Buyer',
      realtor: 'Real Estate Agent',
      investor: 'Real Estate Investor',
      wholesaler: 'Wholesaler',
      owner: 'Property Owner',
      lender: 'Lender',
      appraiser: 'Appraiser',
      contractor: 'Contractor',
      other: 'Other',
      admin: 'Administrator'
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

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        user_type: profile.user_type
      });
      setIsEditing(true);
      setEditError('');
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError('');
    setEditForm({
      first_name: '',
      last_name: '',
      phone: '',
      user_type: 'buyer'
    });
  };

  const handleEditSave = async () => {
    if (!profile) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      const updatedProfile = await ProfileService.updateCurrentProfile({
        first_name: editForm.first_name || null,
        last_name: editForm.last_name || null,
        phone: editForm.phone || null,
        user_type: editForm.user_type
      });
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader
        currentSession={null}
        sessions={[]}
        onNewSession={() => ({
          id: '',
          name: '',
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          nodes: [],
          locationTrackingActive: false
        })}
        onSessionSwitch={() => {}}
        updateUrl={false}
        showSessionSelector={false}
        showMobileToggle={false}
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="max-w-2xl mx-auto">
              {/* Profile Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#1dd1f5] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {getDisplayName()}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    {profile && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status).bgColor} ${formatSubscriptionStatus(profile.subscription_status).color}`}>
                          {formatSubscriptionStatus(profile.subscription_status).text}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatUserType(profile.user_type)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Error */}
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
                  {profileError}
                </div>
              )}

              {/* Account Information */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                  {!isEditing ? (
                    <button 
                      onClick={handleEditClick}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleEditCancel}
                        disabled={editLoading}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleEditSave}
                        disabled={editLoading}
                        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-transparent rounded-md hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors disabled:opacity-50"
                      >
                        {editLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {editError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {editError}
                  </div>
                )}
                
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1dd1f5]"></div>
                    <span className="ml-2 text-gray-600">Loading profile...</span>
                  </div>
                ) : isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-500 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          value={editForm.first_name}
                          onChange={(e) => handleFormChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] text-sm"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-500 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          value={editForm.last_name}
                          onChange={(e) => handleFormChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] text-sm"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] text-sm"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label htmlFor="user_type" className="block text-sm font-medium text-gray-500 mb-1">
                          User Type
                        </label>
                        <select
                          id="user_type"
                          value={editForm.user_type}
                          onChange={(e) => handleFormChange('user_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] text-sm"
                        >
                          <option value="buyer">Home Buyer</option>
                          <option value="realtor">Real Estate Agent</option>
                          <option value="investor">Real Estate Investor</option>
                          <option value="wholesaler">Wholesaler</option>
                          <option value="owner">Property Owner</option>
                          <option value="lender">Lender</option>
                          <option value="appraiser">Appraiser</option>
                          <option value="contractor">Contractor</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Read-only fields in edit mode */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Account Details (Read-only)</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Subscription status</dt>
                          <dd className="mt-1">
                            {profile ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status).bgColor} ${formatSubscriptionStatus(profile.subscription_status).color}`}>
                                {formatSubscriptionStatus(profile.subscription_status).text}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-900">Unknown</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Member since</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.email_confirmed_at ? 'Verified' : 'Pending'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                    </div>
                    {(profile?.first_name || profile?.last_name) && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Full name</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Not provided'}
                        </dd>
                      </div>
                    )}
                    {profile?.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profile.phone}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">User type</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile ? formatUserType(profile.user_type) : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subscription status</dt>
                      <dd className="mt-1">
                        {profile ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status).bgColor} ${formatSubscriptionStatus(profile.subscription_status).color}`}>
                            {formatSubscriptionStatus(profile.subscription_status).text}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-900">Unknown</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last login</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                      </dd>
                    </div>
                    {profile?.stripe_customer_id && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{profile.stripe_customer_id}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.email_confirmed_at ? 'Verified' : 'Pending'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Billing Methods */}
              {profile && (
                <StripeBillingPortal 
                  profile={profile} 
                  onProfileUpdate={handleProfileUpdate} 
                />
              )}

              {/* Subscription & Pricing Plans */}
              {profile && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
                    <p className="text-gray-600">Upgrade to unlock premium features and get the most out of MNUDA</p>
                  </div>

                  {/* Current Plan Status */}
                  {ProfileService.hasActiveSubscription(profile) ? (
                    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-green-800">Active Subscription</p>
                            <p className="text-xs text-green-600">You have access to premium features</p>
                          </div>
                        </div>
                        <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                          Manage Subscription
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-800">Free Account</p>
                            <p className="text-xs text-blue-600">Upgrade to unlock premium features</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Free Plan */}
                    <div className={`bg-white border rounded-md shadow-sm overflow-hidden ${
                      profile?.subscription_status === 'free' 
                        ? 'border-2 border-[#1dd1f5]' 
                        : 'border border-gray-200'
                    }`}>
                      <div className="p-6">
                        <h4 className="text-xl font-medium text-gray-900 mb-2">Free</h4>
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-gray-900">$0</span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        <p className="text-gray-600 mb-6">Get started with basic features</p>
                      </div>
                      
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="space-y-2 mb-6 text-sm text-gray-600">
                          <div>10 searches per month</div>
                          <div>Basic property data</div>
                          <div>Community support</div>
                          <div>Limited features</div>
                        </div>
                        
                        <button className={`w-full py-3 px-4 font-medium rounded-md ${
                          profile?.subscription_status === 'free'
                            ? 'bg-[#1dd1f5] text-white'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`} disabled={profile?.subscription_status === 'free'}>
                          {profile?.subscription_status === 'free' ? 'Current Plan' : 'Choose Free'}
                        </button>
                      </div>
                    </div>

                    {/* Test Plan */}
                    <div className={`bg-white border rounded-md shadow-sm overflow-hidden ${
                      profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'
                        ? 'border-2 border-[#1dd1f5]' 
                        : 'border border-gray-200'
                    }`}>
                      <div className="p-6">
                        <h4 className="text-xl font-medium text-gray-900 mb-2">Test Plan</h4>
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-gray-900">$1</span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        <p className="text-gray-600 mb-6">Test subscription with full features</p>
                      </div>
                      
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="space-y-2 mb-6 text-sm text-gray-600">
                          <div>Unlimited searches</div>
                          <div>Advanced property data</div>
                          <div>Full feature access</div>
                          <div>Email support</div>
                        </div>
                        
                        <button className={`w-full py-3 px-4 font-medium rounded-md ${
                          profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'
                            ? 'bg-[#1dd1f5] text-white'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`} disabled={profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'}>
                          {profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing' ? 'Current Plan' : 'Subscribe via Billing Portal'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                      All plans include a 14-day free trial. Cancel anytime.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                
                {signOutError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {signOutError}
                  </div>
                )}
                
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/help-center')}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help Center
                  </button>
                  
                  <button 
                    onClick={handleChangePasswordClick}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                  
                  <button
                    onClick={handleSignOutClick}
                    disabled={isLoading || isSigningOut}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                  >
                    {isSigningOut ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'white' }}>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing out...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sign out of your account?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  You&apos;ll need to sign in again to access your account and sessions.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSignOutCancel}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOutConfirm}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={handleCloseChangePasswordModal}
        userEmail={user?.email || ''}
      />
    </div>
  );
}

