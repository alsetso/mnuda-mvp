'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/features/ui/components/Logo';
import { useAuth } from '@/features/auth';

const ALLOWED_EMAIL_DOMAIN = 'mnuda.com';

function isValidUsername(username: string): boolean {
  // Username should not be empty and should not contain @ symbol
  if (!username || username.includes('@')) {
    return false;
  }
  // Basic validation: alphanumeric, dots, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return usernameRegex.test(username);
}

function buildFullEmail(username: string): string {
  return `${username}@${ALLOWED_EMAIL_DOMAIN}`;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const { user, signInWithOtp, verifyOtp, isLoading } = useAuth();
  
  const fullEmail = username ? buildFullEmail(username) : '';

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setEmailError('');
    setMessage('');
  };

  const handleUsernameBlur = () => {
    if (username && !isValidUsername(username)) {
      setEmailError('Please enter a valid username');
    } else {
      setEmailError('');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setMessage('Please enter your username');
      setEmailError('Username is required');
      return;
    }

    // Validate username before sending OTP
    if (!isValidUsername(username)) {
      setEmailError('Please enter a valid username');
      setMessage('Please enter a valid username');
      return;
    }

    const email = buildFullEmail(username);

    setLoading(true);
    setMessage('');
    setEmailError('');

    try {
      // Always use shouldCreateUser: true for signup/login
      // This creates user ONLY when OTP is verified, not when sent
      await signInWithOtp(email);
      setOtpSent(true);
      setMessage('Check your email for the 6-digit code!');
    } catch (error: unknown) {
      console.error('OTP error:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to send code'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const email = buildFullEmail(username);
      await verifyOtp(email, otp, 'email');
      setMessage('Login successful! Redirecting...');
      // Wait for auth state to update - user will be set by auth state change listener
      // The useEffect below will handle redirect when user is available
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Invalid code');
      setLoading(false);
    }
  };

  // Redirect if already authenticated (after OTP verification or on page load)
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/account');
    }
  }, [isLoading, user, router]);

  // Show loading state while checking authentication or verifying OTP
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (will redirect)
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to MNUDA
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!otpSent ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              {message && (
                <div className={`px-4 py-3 rounded text-sm ${
                  message.includes('Check your email') 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={handleUsernameBlur}
                    className={`appearance-none block flex-1 px-3 py-2 border rounded-l-md rounded-r-none placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm ${
                      emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="yourname"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm rounded-r-md">
                    @{ALLOWED_EMAIL_DOMAIN}
                  </span>
                </div>
                {fullEmail && (
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    {fullEmail}
                  </p>
                )}
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1dd1f5] hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending code...
                    </div>
                  ) : (
                    'Send verification code'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {message && (
                <div className={`px-4 py-3 rounded text-sm ${
                  message.includes('successful') 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#1dd1f5] focus:border-[#1dd1f5] sm:text-sm text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to {fullEmail}
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1dd1f5] hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify code'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setMessage('');
                    setEmailError('');
                  }}
                  className="text-sm text-[#1dd1f5] hover:text-[#014463] transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
