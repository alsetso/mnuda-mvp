'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { CreditProfileModal } from '@/features/credit/components/CreditProfileModal';
import { CreditRestorationService } from '@/features/credit/services/creditRestorationService';
import { useAuth } from '@/features/auth';
import { ArrowRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/features/ui/hooks/useToast';

type UserState = 'loading' | 'not_logged_in' | 'no_profile' | 'has_profile';

export default function CreditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userState, setUserState] = useState<UserState>('loading');
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    const checkUserState = async () => {
      if (authLoading) {
        setUserState('loading');
        return;
      }

      if (!user) {
        setUserState('not_logged_in');
        return;
      }

      // User is logged in, check for profile
      setIsCheckingProfile(true);
      try {
        const profile = await CreditRestorationService.getCreditProfile();
        setUserState(profile ? 'has_profile' : 'no_profile');
      } catch (error) {
        console.error('Error checking profile:', error);
        setUserState('no_profile');
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserState();
  }, [user, authLoading]);

  const handleViewDashboard = () => {
    if (userState === 'not_logged_in') {
      router.push('/login?redirect=/credit/app&message=Please sign in to access your credit dashboard');
      return;
    }

    if (userState === 'no_profile') {
      setIsModalOpen(true);
      return;
    }

    if (userState === 'has_profile') {
      router.push('/credit/app');
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      router.push('/login?redirect=/credit&message=Please sign in to create your credit profile');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <PageLayout 
        showHeader={true} 
        showFooter={false} 
        containerMaxWidth="full" 
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100">
          {/* Hero Section */}
          <div className="bg-black text-white py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-6xl font-bold mb-6">
                  Restore Your Credit
                </h1>
                <p className="text-2xl text-white/80 mb-8 leading-relaxed">
                  Take control of your credit score. Dispute inaccurate items, track your progress, and build a better financial future.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {userState === 'has_profile' ? (
                    <button
                      onClick={() => router.push('/credit/app')}
                      className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                    >
                      Open App
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleGetStarted}
                        disabled={userState === 'loading' || isCheckingProfile}
                        className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {userState === 'loading' || isCheckingProfile ? (
                          <>
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            Get Started
                            <ArrowRightIcon className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleViewDashboard}
                        disabled={userState === 'loading' || isCheckingProfile || userState === 'not_logged_in'}
                        className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-lg hover:bg-white/20 transition-colors border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title={
                          userState === 'not_logged_in'
                            ? 'Please sign in to access dashboard'
                            : userState === 'no_profile'
                            ? 'Create a profile first'
                            : 'View Dashboard'
                        }
                      >
                        {userState === 'not_logged_in' && (
                          <LockClosedIcon className="w-5 h-5" />
                        )}
                        View Dashboard
                      </button>
                    </>
                  )}
                </div>
                {userState === 'has_profile' && (
                  <p className="text-sm text-white/70 mt-4">
                    Welcome back! You already have a credit profile set up.
                  </p>
                )}
                {userState === 'no_profile' && user && (
                  <p className="text-sm text-white/70 mt-4">
                    Create your credit profile to get started with credit restoration.
                  </p>
                )}
                {userState === 'not_logged_in' && (
                  <p className="text-sm text-white/70 mt-4">
                    Sign in to create your profile and access your credit dashboard.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-black mb-2">Track Your Progress</h3>
                <p className="text-gray-700">
                  Monitor your credit reports, scores, and negative items all in one place.
                </p>
              </div>
              <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="text-xl font-bold text-black mb-2">Dispute Letters</h3>
                <p className="text-gray-700">
                  Create and manage professional dispute letters to credit bureaus.
                </p>
              </div>
              <div className="bg-white border-2 border-gold-200 rounded-xl p-6">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-black mb-2">Learn & Improve</h3>
                <p className="text-gray-700">
                  Access comprehensive guides and resources to understand credit better.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="max-w-7xl mx-auto px-6 pb-16">
            <div className="bg-white border-2 border-gold-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-black mb-6 text-center">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleViewDashboard}
                  disabled={userState === 'not_logged_in' || userState === 'no_profile'}
                  className="px-6 py-3 bg-gold-100 hover:bg-gold-200 text-black font-semibold rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    userState === 'not_logged_in'
                      ? 'Sign in required'
                      : userState === 'no_profile'
                      ? 'Create profile first'
                      : 'View Dashboard'
                  }
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/credit/guide')}
                  className="px-6 py-3 bg-gold-100 hover:bg-gold-200 text-black font-semibold rounded-lg transition-colors text-left"
                >
                  Credit Guide
                </button>
                <button
                  onClick={() => router.push('/credit/bureaus')}
                  className="px-6 py-3 bg-gold-100 hover:bg-gold-200 text-black font-semibold rounded-lg transition-colors text-left"
                >
                  Credit Bureaus
                </button>
                {userState !== 'has_profile' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-left"
                  >
                    Create Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>

      <CreditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProfileCreated={() => {
          setIsModalOpen(false);
          // Refresh user state to update buttons
          const checkUserState = async () => {
            if (user) {
              setIsCheckingProfile(true);
              try {
                const profile = await CreditRestorationService.getCreditProfile();
                setUserState(profile ? 'has_profile' : 'no_profile');
                if (profile) {
                  router.push('/credit/app');
                }
              } catch (error) {
                console.error('Error checking profile:', error);
                setUserState('no_profile');
              } finally {
                setIsCheckingProfile(false);
              }
            }
          };
          checkUserState();
        }}
      />
    </>
  );
}
