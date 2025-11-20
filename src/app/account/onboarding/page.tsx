'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { useAuth, AccountService, Account } from '@/features/auth';
import { ProfileService } from '@/features/profiles/services/profileService';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function AccountOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    image_url: null as string | null,
    username: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/account/onboarding');
    }
  }, [authLoading, user, router]);

  // Fetch account on mount - if account exists, redirect to profiles
  useEffect(() => {
    const fetchAccount = async () => {
      if (user) {
        try {
          const accountData = await AccountService.getCurrentAccount();
          if (accountData) {
            // Account exists - redirect to profiles setup
            router.push('/account/profiles');
            return;
          }
        } catch (err) {
          console.error('Error fetching account:', err);
        }
      }
    };

    if (user) {
      fetchAccount();
    }
  }, [user, router]);

  const handleFormChange = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length <= 4) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/profiles/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
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
    if (!formData.username.trim()) {
      setError('Please enter a username for your profile');
      return;
    }
    if (formData.username.trim().length <= 4) {
      setError('Username must be more than 4 characters');
      return;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(formData.username.trim())) {
      setError('Invalid username format');
      return;
    }

    // Check availability if not already checked
    if (usernameAvailable === null) {
      await checkUsernameAvailability(formData.username.trim());
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure account exists first
      await AccountService.ensureAccountExists();

      // Update account with personal info
      await AccountService.updateCurrentAccount({
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        image_url: formData.image_url,
      });

      // Get account to create profile
      const currentAccount = await AccountService.getCurrentAccount();
      if (!currentAccount) {
        throw new Error('Account not found');
      }

      // Create first profile with default profile_type
      await ProfileService.createProfile({
        account_id: currentAccount.id,
        username: formData.username.trim(),
        profile_image: null,
        profile_type: 'homeowner', // Default profile type
      });
      
      router.push('/account/profiles');
    } catch (err) {
      console.error('Error completing setup:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <AccountHero onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <AccountSidebar 
            className="border-r-2 border-gray-200 bg-gray-50" 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10 safe-area-inset">
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="w-full max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-black mb-1 sm:mb-2">
                    Account Setup
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                    Complete your profile information
                  </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 xl:p-10 border border-gray-200">
                  {error && (
                    <div className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                    {/* Profile Image */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        Profile Image
                      </label>
                      <ImageUpload
                        value={formData.image_url}
                        onChange={(url) => handleFormChange('image_url', url as string | null)}
                        bucket="logos"
                        table="accounts"
                        column="image_url"
                        label="Upload profile image"
                        className="w-full"
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                        placeholder="John"
                        disabled={loading}
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleFormChange('last_name', e.target.value)}
                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                        placeholder="Doe"
                        disabled={loading}
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                        disabled={loading}
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleFormChange('age', e.target.value)}
                        min="18"
                        className="w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-3.5 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-black focus:ring-black transition-colors"
                        placeholder="25"
                        disabled={loading}
                      />
                    </div>

                    {/* Profile Username */}
                    <div>
                      <label className="block text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
                        Profile Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            handleFormChange('username', value);
                          }}
                          onBlur={() => {
                            if (formData.username.trim()) {
                              checkUsernameAvailability(formData.username.trim());
                            }
                          }}
                          className={`w-full px-3 sm:px-4 lg:px-5 pr-10 py-2.5 sm:py-3 lg:py-3.5 text-sm sm:text-base lg:text-lg border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
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
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {!checkingUsername && usernameAvailable === true && (
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {!checkingUsername && usernameAvailable === false && (
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm mt-1 sm:mt-1.5">
                        {formData.username.length <= 4 && formData.username.length > 0 ? (
                          <span className="text-red-500">Username must be more than 4 characters</span>
                        ) : usernameAvailable === false ? (
                          <span className="text-red-500">Username is already taken</span>
                        ) : usernameAvailable === true ? (
                          <span className="text-green-600">Username is available</span>
                        ) : (
                          <span className="text-gray-500">Letters, numbers, and hyphens only</span>
                        )}
                      </p>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !formData.username.trim()}
                      className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-base lg:text-lg bg-black text-white rounded-lg font-semibold hover:bg-gray-900 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]"
                    >
                      {loading ? 'Saving...' : 'Complete your Account Information'}
                      {!loading && <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
