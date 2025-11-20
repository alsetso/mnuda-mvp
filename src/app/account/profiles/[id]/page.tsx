'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, AccountService, Account, ProfileType } from '@/features/auth';
import { ProfileService, Profile } from '@/features/profiles/services/profileService';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PROFILE_TYPE_OPTIONS: { value: ProfileType; label: string }[] = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'renter', label: 'Resident' },
  { value: 'investor', label: 'Investor' },
  { value: 'realtor', label: 'Realtor' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'services', label: 'Services' },
  { value: 'developer', label: 'Developer' },
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'organization', label: 'Organization' },
];

export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  const [form, setForm] = useState({
    username: '',
    profile_image: null as string | null,
    profile_type: 'homeowner' as ProfileType,
  });

  // Load data
  useEffect(() => {
    if (!user || authLoading) return;
    
    const load = async () => {
      try {
        const [profileData, accountData] = await Promise.all([
          ProfileService.getProfileById(profileId),
          AccountService.getCurrentAccount(),
        ]);

        if (!profileData) {
          setError('Profile not found');
          return;
        }

        setProfile(profileData);
        setAccount(accountData);
        setForm({
          username: profileData.username || '',
          profile_image: profileData.profile_image,
          profile_type: profileData.profile_type || 'homeowner',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, profileId, authLoading]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length <= 4) {
      setUsernameAvailable(false);
      return;
    }

    if (username === profile?.username) {
      setUsernameAvailable(true);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/profiles/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, profileId }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
      
      if (!data.available && data.error) {
        setError(data.error);
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !form.username.trim()) {
      setError('Username is required');
      return;
    }

    if (form.username.trim().length <= 4) {
      setError('Username must be more than 4 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      setError('Invalid username format');
      return;
    }

    // Check availability if username changed
    if (form.username.trim() !== profile.username) {
      if (usernameAvailable === null) {
        await checkUsernameAvailability(form.username.trim());
        return;
      }

      if (usernameAvailable === false) {
        setError('Username is already taken');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const updated = await ProfileService.updateProfile(profile.id, {
        username: form.username.trim(),
        profile_image: form.profile_image,
        profile_type: form.profile_type,
      });

      setProfile(updated);
      setIsEditing(false);
      setUsernameAvailable(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof typeof form, value: string | ProfileType | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'username') {
      setUsernameAvailable(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !account) return null;

  const displayName = ProfileService.getDisplayName(profile);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AccountHero onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AccountSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <button 
              onClick={() => router.push('/account/profiles')} 
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back to Profiles
            </button>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {profile.profile_image ? (
                    <img 
                      src={profile.profile_image} 
                      alt={displayName}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-black text-gray-400">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-black">{displayName}</h1>
                    <p className="text-sm text-gray-600 capitalize mt-1">
                      {profile.profile_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profile Image
                    </label>
                    <ImageUpload
                      value={form.profile_image}
                      onChange={(url) => handleFormChange('profile_image', url as string | null)}
                      bucket="profile-images"
                      table="profiles"
                      column="profile_image"
                      label="Upload profile image"
                      className="w-full"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                          handleFormChange('username', value);
                        }}
                        onBlur={() => {
                          if (form.username.trim() && form.username.trim() !== profile.username) {
                            checkUsernameAvailability(form.username.trim());
                          }
                        }}
                        className={`w-full px-4 py-2.5 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          usernameAvailable === false
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : usernameAvailable === true
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                        placeholder="johndoe"
                        required
                        disabled={saving || checkingUsername}
                      />
                      {checkingUsername && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === true && form.username.trim() !== profile.username && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1.5">
                      {form.username.length <= 4 && form.username.length > 0 ? (
                        <span className="text-red-500">Username must be more than 4 characters</span>
                      ) : usernameAvailable === false ? (
                        <span className="text-red-500">Username is already taken</span>
                      ) : usernameAvailable === true && form.username.trim() !== profile.username ? (
                        <span className="text-green-600">Username is available</span>
                      ) : (
                        <span className="text-gray-500">Letters, numbers, and hyphens only</span>
                      )}
                    </p>
                  </div>

                  {/* Profile Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profile Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.profile_type}
                      onChange={(e) => handleFormChange('profile_type', e.target.value as ProfileType)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black bg-white"
                      required
                      disabled={saving}
                    >
                      {PROFILE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.username.trim() || checkingUsername}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <CheckIcon className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setError('');
                        setUsernameAvailable(null);
                        // Reset form to original values
                        if (profile) {
                          setForm({
                            username: profile.username || '',
                            profile_image: profile.profile_image,
                            profile_type: profile.profile_type || 'homeowner',
                          });
                        }
                      }}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <XMarkIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-black mb-4">Profile Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase mb-1">Username</dt>
                        <dd className="text-base font-medium text-black">{profile.username}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase mb-1">Profile Type</dt>
                        <dd className="text-base font-medium text-black capitalize">
                          {profile.profile_type.replace(/_/g, ' ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase mb-1">Created</dt>
                        <dd className="text-base font-medium text-black">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</dt>
                        <dd className="text-base font-medium text-black">
                          {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
