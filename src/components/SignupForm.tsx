'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEmailNotifications } from '@/features/email/hooks/useEmailNotifications';
import { ProfileService } from '@/features/auth';
import { UserType } from '@/types/supabase';

interface SignupFormProps {
  /**
   * Redirect URL after successful signup
   * @default '/account'
   */
  redirectUrl?: string;
  /**
   * Show logo above the form
   * @default true
   */
  showLogo?: boolean;
  /**
   * Show link to login page
   * @default true
   */
  showLoginLink?: boolean;
  /**
   * Additional CSS classes for the form container
   */
  className?: string;
  /**
   * Callback fired on successful signup
   */
  onSuccess?: () => void;
  /**
   * Callback fired on signup error
   */
  onError?: (error: string) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: UserType;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

const PASSWORD_MIN_LENGTH = 6;
const PHONE_REGEX = /^[\d\s()+-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm({
  redirectUrl = '/account',
  showLogo = true,
  showLoginLink = true,
  className = '',
  onSuccess,
  onError,
}: SignupFormProps) {
  const router = useRouter();
  const emailNotifications = useEmailNotifications();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'buyer',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Validates form data and returns errors if any
   */
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  /**
   * Handles input changes with validation
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear submit error on any change
    if (errors.submit) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectUrl}`,
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim(),
            user_type: formData.userType,
            subscription_status: 'free',
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Handle successful signup
      if (data.user) {
        // Ensure profile is created (the trigger should handle this, but let's be safe)
        try {
          await ProfileService.ensureProfileExists();
        } catch (profileError) {
          console.warn('Profile creation failed, but user was created:', profileError);
        }

        // Send custom signup confirmation email if user needs to confirm
        if (!data.user.email_confirmed_at) {
          const confirmationUrl = `${window.location.origin}/account?token=${data.user.id}`;
          const emailResult = await emailNotifications.sendSignupConfirmation(
            formData.email.trim(),
            confirmationUrl,
            `${formData.firstName.trim()} ${formData.lastName.trim()}`
          );

          if (!emailResult.success) {
            console.warn('Custom signup email failed, Supabase default email will be sent:', emailResult.error);
          }
        }

        setIsSuccess(true);
        onSuccess?.();

        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectUrl);
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);

      let errorMessage = 'Sign up failed. Please try again.';

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const message = error.message.toLowerCase();

        if (message.includes('user already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (message.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please try a stronger password.';
        } else if (message.includes('too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Please check your email to confirm your account.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you to your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 ${className}`}>
      {showLogo && (
        <div className="flex justify-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-4xl font-bold">
              <span className="text-[#014463]">MN</span>
              <span className="text-[#1dd1f5]">UDA</span>
            </h1>
          </Link>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
            {errors.submit}
          </div>
        )}

        {/* First Name Field */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="John"
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
        </div>

        {/* Last Name Field */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="Doe"
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="john@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* User Type Field */}
        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
            I am a... <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <select
              id="userType"
              name="userType"
              required
              value={formData.userType}
              onChange={(e) => handleInputChange('userType', e.target.value as UserType)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.userType ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              disabled={isLoading}
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
            {errors.userType && (
              <p className="mt-1 text-sm text-red-600">{errors.userType}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This helps us customize your experience
            </p>
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            {!errors.password && (
              <p className="mt-1 text-xs text-gray-500">
                Minimum {PASSWORD_MIN_LENGTH} characters
              </p>
            )}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1dd1f5] hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>

        {/* Login Link */}
        {showLoginLink && (
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-[#1dd1f5] hover:text-[#014463] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

