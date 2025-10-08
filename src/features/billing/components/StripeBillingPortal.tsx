'use client';

import { useState, useEffect } from 'react';
import { ProfileService } from '@/features/auth';
import { Profile } from '@/types/supabase';

interface StripeBillingPortalProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

interface StripeCustomer {
  id: string;
  default_payment_method: string | null;
  payment_methods: Array<{
    id: string;
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  }>;
}

export default function StripeBillingPortal({ profile, onProfileUpdate }: StripeBillingPortalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load customer data when profile has stripe_customer_id
  const loadCustomerData = async () => {
    if (profile.stripe_customer_id) {
      setCustomerLoading(true);
      setError('');
      try {
        const response = await fetch('/api/stripe/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: profile.stripe_customer_id })
        });
        
        if (response.ok) {
          const customerData = await response.json();
          setCustomer(customerData);
        } else {
          setError('Failed to load customer data');
        }
      } catch (_err) {
        setError('Failed to load customer data');
      } finally {
        setCustomerLoading(false);
      }
    } else {
      setCustomer(null);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [profile.stripe_customer_id]);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCreateCustomer = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          metadata: { userId: profile.id }
        })
      });
      
      if (response.ok) {
        const { customerId } = await response.json();
        const updatedProfile = await ProfileService.updateCurrentProfile({ stripe_customer_id: customerId });
        if (updatedProfile) {
          onProfileUpdate(updatedProfile);
          setCustomer({ id: customerId, default_payment_method: null, payment_methods: [] });
          setSuccess('Billing account set up successfully!');
        }
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (_err) {
      setError('Failed to set up billing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!profile.stripe_customer_id) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: profile.stripe_customer_id
        })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to open billing portal');
      }
    } catch (_err) {
      setError('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeToTestPlan = async () => {
    if (!profile.stripe_customer_id) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: profile.stripe_customer_id
        })
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (_err) {
      setError('Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardBrand = (brand: string | undefined | null): string => {
    if (!brand) return 'Card';
    
    const brandMap: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay'
    };
    return brandMap[brand.toLowerCase()] || brand.toUpperCase();
  };

  const formatExpiryDate = (month: number, year: number): string => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const formatSubscriptionStatus = (status: string): { text: string; color: string; bgColor: string } => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
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

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Billing Methods</h3>
        {profile.stripe_customer_id && (
          <button
            onClick={loadCustomerData}
            disabled={customerLoading}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-1 ${customerLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      {!profile.stripe_customer_id ? (
        <div className="text-center py-6">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No billing method on file</h4>
          <p className="text-gray-600 mb-4">Set up billing to manage your subscription and payment methods.</p>
          <button
            onClick={handleCreateCustomer}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1dd1f5] hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up...
              </>
            ) : (
              'Set Up Billing'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subscription Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Subscription Status</h4>
              <p className="text-xs text-gray-500">Current plan status</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatSubscriptionStatus(profile.subscription_status).bgColor} ${formatSubscriptionStatus(profile.subscription_status).color}`}>
              {formatSubscriptionStatus(profile.subscription_status).text}
            </span>
          </div>

          {customerLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1dd1f5]"></div>
              <span className="ml-2 text-gray-600">Loading payment methods...</span>
            </div>
          ) : customer ? (
            <>
              
              {customer.payment_methods && customer.payment_methods.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Payment Methods</h4>
                  {customer.payment_methods.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {formatCardBrand(card.brand).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCardBrand(card.brand)} {card.last4 ? `•••• ${card.last4}` : ''}
                          </p>
                          {card.exp_month && card.exp_year && (
                            <p className="text-xs text-gray-500">
                              Expires {formatExpiryDate(card.exp_month, card.exp_year)}
                            </p>
                          )}
                        </div>
                      </div>
                      {card.id === customer.default_payment_method && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">No payment methods on file</p>
                  <p className="text-xs text-gray-500">Add a payment method using the billing portal below</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-3">Customer data not loaded</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleOpenBillingPortal}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Opening...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Billing
                </>
              )}
            </button>

            {/* Test Plan Subscription Button */}
            {profile.subscription_status === 'free' && (
              <button
                onClick={handleSubscribeToTestPlan}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#1dd1f5] hover:bg-[#014463] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Subscribe to Test Plan ($1/month)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
