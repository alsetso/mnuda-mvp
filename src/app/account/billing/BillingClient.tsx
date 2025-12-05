'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import type { BillingData } from '@/lib/billingServer';

interface BillingClientProps {
  initialBillingData: BillingData;
}

export default function BillingClient({ initialBillingData }: BillingClientProps) {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData>(initialBillingData);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);


  // Create checkout session and redirect to Stripe Checkout
  const handleCheckout = async () => {
    try {
      setCreatingCheckout(true);
      setError(null);
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setCreatingCheckout(false);
    }
  };

  // Handle checkout session completion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (sessionId) {
      // Checkout completed successfully
      setError(null);
      // Force a full page refresh to get latest subscription status
      // Stripe Checkout automatically saves payment methods to the customer
      window.location.href = '/account/billing';
    } else if (canceled) {
      // Checkout was canceled
      setError('Checkout was canceled. You can try again anytime.');
      // Clean up URL
      window.history.replaceState({}, '', '/account/billing');
    }
  }, [router]);

  // Open Stripe Customer Portal (for managing existing subscriptions)
  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      setError(null);
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: `${window.location.origin}/account/billing`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open customer portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
      setPortalLoading(false);
    }
  };



  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-[10px] bg-gray-100 rounded-md">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-gray-900">Billing</h1>
        </div>
        <p className="text-xs text-gray-600">Manage your subscription and billing</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-[10px] py-[10px] rounded-md text-xs flex items-start gap-2">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-md p-[10px]">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Plan</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">
              {billingData.plan === 'pro' ? 'Pro' : 'Hobby'}
            </span>
            {billingData.isTrial && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Trial
              </span>
            )}
            {billingData.subscription_status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                billingData.isActive
                  ? 'bg-green-100 text-green-800'
                  : billingData.subscription_status === 'past_due'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {billingData.subscription_status === 'active' ? 'Active' :
                 billingData.subscription_status === 'trialing' ? 'Trialing' :
                 billingData.subscription_status === 'past_due' ? 'Past Due' :
                 billingData.subscription_status === 'canceled' ? 'Canceled' :
                 billingData.subscription_status === 'incomplete' ? 'Incomplete' :
                 billingData.subscription_status}
              </span>
            )}
          </div>
          {billingData.plan === 'pro' && billingData.billing_mode === 'standard' && (
            <p className="text-xs text-gray-600">$20/month</p>
          )}
          {billingData.plan === 'hobby' && (
            <p className="text-xs text-gray-600">Free plan</p>
          )}
          {billingData.stripe_subscription_id && (
            <p className="text-xs text-gray-500">
              Subscription ID: {billingData.stripe_subscription_id.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>

      {/* Plans Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-[10px] py-[10px] border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Plans & Features</h2>
          <p className="text-xs text-gray-600 mt-0.5">Compare Free and Pro plans</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-[10px] py-[10px] text-left text-xs font-semibold text-gray-900">Feature</th>
                <th className="px-[10px] py-[10px] text-center text-xs font-semibold text-gray-900">Free</th>
                <th className="px-[10px] py-[10px] text-center text-xs font-semibold text-gray-900 bg-gray-900 text-white">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Price</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">Free</td>
                <td className="px-[10px] py-[10px] text-center text-xs font-medium text-gray-900 bg-gray-50">$20/month</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Pins</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">10 pins</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Unlimited</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Areas</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">3 areas</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Unlimited</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Visibility</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">Public only</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Private + accounts_only</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Profiles</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">1 profile</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Multiple profiles</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">My Homes</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">1 home</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Unlimited</td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Notifications</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">—</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">
                  <CheckIcon className="w-3 h-3 mx-auto text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Area Alerts</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">—</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">
                  <CheckIcon className="w-3 h-3 mx-auto text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Pin Analytics</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">—</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">
                  <CheckIcon className="w-3 h-3 mx-auto text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Data Export</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">—</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">
                  <CheckIcon className="w-3 h-3 mx-auto text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="px-[10px] py-[10px] text-xs font-medium text-gray-900">Support</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-600">Community</td>
                <td className="px-[10px] py-[10px] text-center text-xs text-gray-900 bg-gray-50">Priority support</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-[10px] py-[10px] border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-2">
            {billingData.plan === 'hobby' ? (
              <button
                onClick={handleCheckout}
                disabled={creatingCheckout}
                className="flex items-center gap-1.5 px-[10px] py-[10px] bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingCheckout ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Subscribe to Pro
                    <ArrowRightIcon className="w-3 h-3" />
                  </>
                )}
              </button>
            ) : (
              <p className="text-xs text-gray-600">
                You&apos;re on the Pro plan
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions & Billing Section */}
      {billingData.hasCustomer && (
        <div className="bg-white border border-gray-200 rounded-md p-[10px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Subscriptions & Billing</h3>
              <p className="text-xs text-gray-600">
                Access the Stripe Customer Portal to manage your subscription, update payment methods, view billing history and invoices, 
                update your billing address, and cancel or modify your subscription. All payment methods are securely managed through Stripe.
              </p>
            </div>
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 px-[10px] py-[10px] bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {portalLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Opening...
                </>
              ) : (
                <>
                  Manage Subscriptions
                  <ArrowRightIcon className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

