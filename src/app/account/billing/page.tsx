'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ProfileService } from '@/features/auth';
import { Profile, UserType, SubscriptionStatus } from '@/types/supabase';
import { SubscriptionPanel } from '@/features/billing';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  stripe_price_id: string;
  credits_per_period: number;
  billing_interval: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

  // Helper functions for formatting
  const formatUserType = (userType: UserType): string => {
    const typeMap: Record<UserType, string> = {
      free: 'Free User',
      premium: 'Premium User',
      admin: 'Administrator',
      buyer: 'Home Buyer',
      realtor: 'Real Estate Agent',
      investor: 'Real Estate Investor',
      wholesaler: 'Wholesaler',
      owner: 'Property Owner',
      lender: 'Lender',
      appraiser: 'Appraiser',
      contractor: 'Contractor',
      other: 'Other'
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

  // Load plans data
  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const { data: plansData, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_cents', { ascending: true });

        if (error) {
          console.error('Error loading plans:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('Plans loaded successfully:', plansData);
          setPlans(plansData || []);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Load payment methods when profile is available
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (profile?.stripe_customer_id) {
        setPaymentMethodsLoading(true);
        try {
          const response = await fetch(`/api/stripe/payment-methods?customerId=${profile.stripe_customer_id}`);
          if (response.ok) {
            const data = await response.json();
            setPaymentMethods(data.paymentMethods || []);
          }
        } catch (error) {
          console.error('Error loading payment methods:', error);
        } finally {
          setPaymentMethodsLoading(false);
        }
      } else {
        // No stripe_customer_id yet - user hasn't set up billing
        setPaymentMethods([]);
        setPaymentMethodsLoading(false);
      }
    };

    loadPaymentMethods();
  }, [profile?.stripe_customer_id]);

  const handleUpgrade = async (stripePriceId: string) => {
    if (!user?.email) {
      setProfileError('User email not found. Please log in again.');
      return;
    }

    setUpgradeLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: stripePriceId,
          customerEmail: user.email // ✅ Pass the user email
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const { error } = await response.json();
        setProfileError(error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      setProfileError('Failed to create checkout session');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManagePayments = async () => {
    if (!user?.id) {
      setProfileError('User not authenticated. Please log in again.');
      return;
    }

    try {
      const response = await fetch('/api/stripe/manage-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const { error } = await response.json();
        setProfileError(error || 'Failed to open payment management');
      }
    } catch (error) {
      console.error('Error:', error);
      setProfileError('Failed to open payment management');
    }
  };

  // Redirect to login if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscription</h1>
      
      {/* Current Plan Status */}
      {profile && (
        <div className="mb-6">
          <SubscriptionPanel />
        </div>
      )}

      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h2>
        
        {plansLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading plans...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = profile?.plan_tier === plan.name.toLowerCase() || 
                                  (plan.price_cents === 0 && profile?.subscription_status === 'free');
              const price = plan.price_cents / 100; // Convert cents to dollars
              const isPopular = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
              
              return (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 ${
                    isPopular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  } ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}`}
                >
                  {isPopular && (
                    <div className="text-center mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${price}
                      </span>
                      <span className="text-gray-600">/{plan.billing_interval}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.credits_per_period} credits per {plan.billing_interval}
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.billing_interval} billing
                    </li>
                    {plan.price_cents > 0 && (
                      <li className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Premium features included
                      </li>
                    )}
                  </ul>

                  <div className="text-center">
                    {isCurrentPlan ? (
                      <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm font-medium">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.stripe_price_id)}
                        disabled={upgradeLoading || !plan.stripe_price_id}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isPopular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {upgradeLoading ? 'Processing...' : plan.price_cents === 0 ? 'Downgrade' : 'Upgrade'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
        
        {!profile?.stripe_customer_id ? (
          // User hasn't upgraded yet
          <div className="border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">Upgrade to a paid plan to manage payment methods</p>
            <p className="text-sm text-gray-500">Payment methods will be available after your first subscription</p>
          </div>
        ) : paymentMethodsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading payment methods...</span>
          </div>
        ) : paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {method.card.brand.toUpperCase()} •••• {method.card.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                      </p>
                    </div>
                  </div>
                  {method.id === profile.default_payment_method && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">No payment methods on file</p>
          </div>
        )}

        {profile?.stripe_customer_id && (
          <div className="mt-4">
            <button
              onClick={handleManagePayments}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Manage Payment Methods
            </button>
          </div>
        )}
      </div>

      {/* Billing Information */}
      {profile && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status || 'free').bgColor} ${formatSubscriptionStatus(profile.subscription_status || 'free').color}`}>
                    {formatSubscriptionStatus(profile.subscription_status || 'free').text}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Stripe Customer ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {profile.stripe_customer_id || 'Empty'}
                </dd>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatUserType(profile.user_type || 'free')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
