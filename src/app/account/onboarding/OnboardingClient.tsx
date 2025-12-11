'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountService, Account } from '@/features/auth';
import { ImageUpload } from '@/features/ui/components/ImageUpload';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface OnboardingClientProps {
  initialAccount: Account | null;
  redirectTo?: string;
}

export default function OnboardingClient({ initialAccount, redirectTo }: OnboardingClientProps) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [loading, setLoading] = useState(!initialAccount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    gender: '',
    age: '',
    image_url: null as string | null,
  });

  // Load account data if not provided
  // REMOVED: Client-side onboarding check - server component handles redirects
  // This prevents duplicate checks and potential loops
  useEffect(() => {
    if (initialAccount) {
      setAccount(initialAccount);
      setFormData({
        username: initialAccount.username || '',
        first_name: initialAccount.first_name || '',
        last_name: initialAccount.last_name || '',
        gender: initialAccount.gender || '',
        age: initialAccount.age?.toString() || '',
        image_url: initialAccount.image_url,
      });
      setLoading(false);
      return;
    }
    
    // Only fetch if not provided (shouldn't happen, but handle gracefully)
    const loadAccount = async () => {
      try {
        const accountData = await AccountService.getCurrentAccount();
        if (accountData) {
          setAccount(accountData);
          setFormData({
            username: accountData.username || '',
            first_name: accountData.first_name || '',
            last_name: accountData.last_name || '',
            gender: accountData.gender || '',
            age: accountData.age?.toString() || '',
            image_url: accountData.image_url,
          });
        }
      } catch (error) {
        console.error('Error loading account:', error);
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [initialAccount]);

  // Check username availability
  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/accounts/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username !== account?.username) {
        checkUsername(formData.username);
      } else if (formData.username === account?.username) {
        setUsernameAvailable(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate required fields
    if (!formData.username.trim() || !formData.first_name.trim() || !formData.last_name.trim() || !formData.gender || !formData.age || !formData.image_url) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    // Validate username
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      setSaving(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      setSaving(false);
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is not available. Please choose another.');
      setSaving(false);
      return;
    }

    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18) {
      setError('Age must be 18 or older');
      setSaving(false);
      return;
    }

    try {
      // Update account using AccountService (handles auth, validation, error handling)
      await AccountService.updateCurrentAccount({
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        age: ageNum,
        image_url: formData.image_url,
      });

      // Set onboarded flag (use existing account.id if available, otherwise fetch)
      const supabase = (await import('@/lib/supabase')).supabase;
      const accountId = account?.id;
      
      if (!accountId) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          throw new Error('Not authenticated');
        }
        const { data: accountRecord } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1)
          .single();
        if (!accountRecord) {
          throw new Error('Account not found');
        }
        const { error: onboardError } = await supabase
          .from('accounts')
          .update({ onboarded: true })
          .eq('id', accountRecord.id);
        if (onboardError) throw onboardError;
      } else {
        const { error: onboardError } = await supabase
          .from('accounts')
          .update({ onboarded: true })
          .eq('id', accountId);
        if (onboardError) throw onboardError;
      }

      // Use Next.js router with revalidation for clean state
      const redirectPath = redirectTo || '/map';
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      console.error('Error saving account:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to save account';
      if (error instanceof Error) {
        if (error.message.includes('username') || error.message.includes('unique')) {
          errorMessage = 'Username is already taken. Please choose another.';
        } else if (error.message.includes('constraint')) {
          errorMessage = 'Invalid data provided. Please check your inputs.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof typeof formData, value: string | string[] | null) => {
    // For image_url, ensure we only use string | null (not string[])
    const normalizedValue = field === 'image_url' 
      ? (Array.isArray(value) ? value[0] || null : value)
      : (Array.isArray(value) ? value[0] || '' : value);
    
    setFormData(prev => ({
      ...prev,
      [field]: normalizedValue
    }));
    setError('');
    if (field === 'username') {
      setUsernameAvailable(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-[10px] bg-white border border-gray-200 rounded-md">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M6.343 6.343l-.707.707m12.728 0l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-gray-900">Complete Your Account</h1>
        </div>
        <p className="text-xs text-gray-600">Let&apos;s get to know you better</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-md p-[10px] border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="px-[10px] py-[10px] rounded-md text-xs bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-gray-900 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleFormChange('username', e.target.value)}
                className={`w-full px-[10px] py-[10px] border rounded-md text-xs focus:outline-none focus:ring-1 transition-colors ${
                  usernameAvailable === true
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                    : usernameAvailable === false
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
                }`}
                placeholder="johndoe"
                disabled={saving}
                pattern="[a-zA-Z0-9_-]+"
                minLength={3}
                maxLength={30}
              />
              {checkingUsername && (
                <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {!checkingUsername && usernameAvailable === true && (
                <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {usernameAvailable === true
                ? 'Username available'
                : usernameAvailable === false
                ? 'Username taken'
                : '3-30 characters, letters, numbers, hyphens, and underscores'}
            </p>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Profile Photo <span className="text-red-500">*</span>
            </label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => handleFormChange('image_url', url)}
              bucket="logos"
              table="accounts"
              column="image_url"
              label="Upload photo"
              className="w-full"
            />
          </div>

          {/* Name Fields - Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="first_name" className="block text-xs font-medium text-gray-900 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => handleFormChange('first_name', e.target.value)}
                className="w-full px-[10px] py-[10px] border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:border-gray-900 focus:ring-gray-900 transition-colors"
                placeholder="John"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-xs font-medium text-gray-900 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => handleFormChange('last_name', e.target.value)}
                className="w-full px-[10px] py-[10px] border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:border-gray-900 focus:ring-gray-900 transition-colors"
                placeholder="Doe"
                disabled={saving}
              />
            </div>
          </div>

          {/* Gender and Age - Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="gender" className="block text-xs font-medium text-gray-900 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                required
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
                className="w-full px-[10px] py-[10px] border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:border-gray-900 focus:ring-gray-900 transition-colors"
                disabled={saving}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="age" className="block text-xs font-medium text-gray-900 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                type="number"
                required
                min="18"
                value={formData.age}
                onChange={(e) => handleFormChange('age', e.target.value)}
                className="w-full px-[10px] py-[10px] border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:border-gray-900 focus:ring-gray-900 transition-colors"
                placeholder="25"
                disabled={saving}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving || usernameAvailable === false || checkingUsername}
              className="w-full flex justify-center items-center gap-1.5 px-[10px] py-[10px] border border-transparent rounded-md text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete Account
                  <ArrowRightIcon className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
