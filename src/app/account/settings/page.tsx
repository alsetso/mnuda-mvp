'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ProfileService } from '@/features/auth';
import { Profile } from '@/types/supabase';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import ProfilePhoto from '@/components/ProfilePhoto';

export default function SettingsPage() {
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
    company: '',
    job_title: '',
    location: '',
    bio: '',
    website: '',
    linkedin_url: '',
    timezone: 'UTC'
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



  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        location: profile.location || '',
        bio: profile.bio || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        timezone: profile.timezone || 'UTC'
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
      company: '',
      job_title: '',
      location: '',
      bio: '',
      website: '',
      linkedin_url: '',
      timezone: 'UTC'
    });
  };

  const handleEditSave = async () => {
    if (!profile) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      if (!user?.id) {
        setEditError('User not authenticated');
        return;
      }
      
      const updatedProfile = await ProfileService.updateCurrentProfile(user.id, {
        first_name: editForm.first_name || undefined,
        last_name: editForm.last_name || undefined,
        phone: editForm.phone || undefined,
        company: editForm.company || undefined,
        job_title: editForm.job_title || undefined,
        location: editForm.location || undefined,
        bio: editForm.bio || undefined,
        website: editForm.website || undefined,
        linkedin_url: editForm.linkedin_url || undefined,
        timezone: editForm.timezone || undefined
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
      if (user?.id) {
        setProfileLoading(true);
        setProfileError('');
        try {
          const userProfile = await ProfileService.getCurrentProfile(user.id);
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

      {/* Profile Information */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
          {!isEditing ? (
            <button 
              onClick={handleEditClick}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
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
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
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
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
            {editError}
          </div>
        )}
        
        {profileLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        ) : isEditing ? (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-500 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-500 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={editForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h4>
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-500 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={editForm.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label htmlFor="job_title" className="block text-sm font-medium text-gray-500 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    value={editForm.job_title}
                    onChange={(e) => handleFormChange('job_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="Your role"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">About</h4>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-500 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => handleFormChange('bio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Online Presence */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Online Presence</h4>
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-500 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={editForm.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-500 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    id="linkedin_url"
                    value={editForm.linkedin_url}
                    onChange={(e) => handleFormChange('linkedin_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Preferences</h4>
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-500 mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={editForm.timezone}
                  onChange={(e) => handleFormChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <ProfilePhoto 
                profile={profile} 
                size="lg" 
                editable={true}
                onUpdate={setProfile}
              />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Profile Photo</h4>
                <p className="text-xs text-gray-500">Click to upload or change your profile photo</p>
              </div>
            </div>

            {/* Profile Information */}
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile?.first_name || profile?.last_name
                    ? [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
                    : (profile?.full_name || 'Not set')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">First name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.first_name || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.last_name || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.location || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.company || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Job title</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.job_title || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile?.website ? (
                    <a href={profile.website} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                      {profile.website}
                    </a>
                  ) : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile?.linkedin_url ? (
                    <a href={profile.linkedin_url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                      {profile.linkedin_url}
                    </a>
                  ) : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile?.timezone || 'UTC'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile?.bio || 'Not set'}</dd>
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
              <div>
                <dt className="text-sm font-medium text-gray-500">Email verified</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.email_confirmed_at ? 'Verified' : 'Pending'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <p className="text-xs text-gray-500">Update your password to keep your account secure</p>
            </div>
            <button
              onClick={handleChangePasswordClick}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
              </svg>
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button
              disabled
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
        
        {signOutError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
            {signOutError}
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Sign Out</h4>
              <p className="text-xs text-gray-500">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleSignOutClick}
              disabled={isLoading || isSigningOut}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing out...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
              <p className="text-xs text-red-600">Permanently delete your account and all data</p>
            </div>
            <button
              disabled
              className="flex items-center px-3 py-2 text-sm font-medium text-red-400 bg-red-100 border border-red-200 rounded cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Coming Soon
            </button>
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
                    disabled={isSigningOut}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
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
