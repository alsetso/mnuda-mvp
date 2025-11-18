'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/features/ui/components/Logo';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

function isValidEmail(email: string): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const { user, signInWithOtp, verifyOtp, isLoading } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
    setMessage('');
  };

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setEmailError('Email address is required');
      return;
    }

    // Validate email before sending OTP
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');
    setEmailError('');

    try {
      await signInWithOtp(email.trim().toLowerCase());
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
      await verifyOtp(email.trim().toLowerCase(), otp, 'email');
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
      router.push('/account/settings');
    }
  }, [isLoading, user, router]);

  // Show loading state while checking authentication or verifying OTP
  if (isLoading || loading) {
    return (
      <PageLayout showHeader={false} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100 flex items-center justify-center">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
      </PageLayout>
    );
  }

  // Don't render login form if user is authenticated (will redirect)
  if (user) {
    return (
      <PageLayout showHeader={false} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <div className="min-h-screen bg-gold-100 flex items-center justify-center">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={false} showFooter={false} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <section className="min-h-screen flex items-center bg-gradient-to-b from-gold-100 via-gold-50 to-gold-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity">
                <Logo size="lg" variant="default" />
          </Link>
        </div>

            {/* Hero Section */}
            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-gold-600 bg-gold-200/50 px-4 py-2 rounded-full">
                  Sign In
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black mb-4 leading-tight">
                Welcome Back
              </h1>
              <p className="text-lg text-gray-700">
                Enter your email address to continue to your account
        </p>
      </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl p-8 border border-gold-200 shadow-lg">
          {!otpSent ? (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${
                  message.includes('Check your email') 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address
                </label>
                    <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm ${
                      emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {emailError && (
                      <p className="mt-2 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                      className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending code...
                        </>
                  ) : (
                        <>
                          Send Verification Code
                          <ArrowRightIcon className="w-5 h-5" />
                        </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${
                  message.includes('successful') 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-2">
                      Verification Code
                </label>
                    <div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="appearance-none block w-full px-4 py-4 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-base text-center text-3xl tracking-widest font-mono text-gray-900"
                    placeholder="000000"
                  />
                </div>
                    <p className="mt-3 text-sm text-gray-600">
                      Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                      className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                        </>
                  ) : (
                        <>
                          Verify Code
                          <ArrowRightIcon className="w-5 h-5" />
                        </>
                  )}
                </button>
              </div>

                  <div className="text-center pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setMessage('');
                    setEmailError('');
                    setEmail('');
                  }}
                      className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>

            {/* Footer Link */}
            <div className="text-center mt-8">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                ← Back to home
              </Link>
            </div>
      </div>
    </div>
      </section>
    </PageLayout>
  );
}
