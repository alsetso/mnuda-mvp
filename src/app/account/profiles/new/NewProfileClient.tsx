'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { Account, ProfileType } from '@/features/auth';
import { ProfileService } from '@/features/profiles/services/profileService';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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

interface NewProfileClientProps {
  initialAccount: Account;
}

export default function NewProfileClient({ initialAccount }: NewProfileClientProps) {
  const router = useRouter();
  const [account] = useState<Account>(initialAccount);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<ProfileType | ''>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const checkUsernameAvailability = async (usernameValue: string) => {
    if (!usernameValue || usernameValue.length <= 4) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/profiles/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameValue }),
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

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length <= 4) {
      setError('Username must be more than 4 characters');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(username.trim())) {
      setError('Invalid username format');
      return;
    }

    if (!profileType) {
      setError('Please select a profile type');
      return;
    }

    // Check availability if not already checked
    if (usernameAvailable === null) {
      await checkUsernameAvailability(username.trim());
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ProfileService.createProfile({
        account_id: account.id,
        username: username.trim(),
        profile_image: profileImage || null,
        profile_type: profileType,
      });

      router.push('/account/profiles');
      router.refresh();
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AccountHero onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AccountSidebar 
          className="border-r-2 border-gray-200 bg-gray-50" 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 safe-area-inset">
            {/* Back Button */}
            <Link
              href="/account/profiles"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Profiles
            </Link>

            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-black mb-1">
                Create New Profile
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Set up a new operational profile
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Compact Form */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="space-y-4">
                {/* Username and Account Type Row - Inline on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                          setUsername(value);
                          setError('');
                          setUsernameAvailable(null);
                        }}
                        onBlur={() => {
                          if (username.trim()) {
                            checkUsernameAvailability(username.trim());
                          }
                        }}
                        className={`w-full px-3 py-2 pr-9 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          usernameAvailable === false
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : usernameAvailable === true
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                        placeholder="johndoe"
                        required
                        disabled={loading || checkingUsername}
                      />
                        {checkingUsername && (
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {!checkingUsername && usernameAvailable === true && (
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {!checkingUsername && usernameAvailable === false && (
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                    </div>
                    <p className="text-xs mt-1 text-gray-500">
                      {username.length <= 4 && username.length > 0 ? (
                        <span className="text-red-500">Must be more than 4 characters</span>
                      ) : usernameAvailable === false ? (
                        <span className="text-red-500">Already taken</span>
                      ) : usernameAvailable === true ? (
                        <span className="text-green-600">Available</span>
                      ) : (
                        <span>Letters, numbers, hyphens</span>
                      )}
                    </p>
                  </div>

                  {/* Profile Type - Compact Select */}
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                      Profile Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as ProfileType)}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select type...</option>
                      {PROFILE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profile Image - Compact */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5">
                    Profile Image <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <ImageUpload
                    value={profileImage}
                    onChange={(url) => setProfileImage(url as string | null)}
                    bucket="profile-images"
                    table="profiles"
                    column="profile_image"
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !username.trim() || !profileType || usernameAvailable === false}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-900 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px]"
                  >
                    {loading ? 'Creating...' : 'Create Profile'}
                    {!loading && <ArrowRightIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

