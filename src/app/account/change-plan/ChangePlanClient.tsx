'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { BillingData } from '@/lib/billingServer';

interface ChangePlanClientProps {
  initialBillingData: BillingData;
}

export default function ChangePlanClient({ initialBillingData }: ChangePlanClientProps) {
  const router = useRouter();
  const [billingData] = useState<BillingData>(initialBillingData);
  const [error, setError] = useState<string | null>(null);
  const [creatingCheckout, setCreatingCheckout] = useState(false);

  // Create checkout session and redirect to Stripe Checkout for Pro plan
  const handleProCheckout = async () => {
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

  // Handle Pro+ contact
  const handleProPlusContact = () => {
    // Open email client or redirect to contact form
    window.location.href = 'mailto:support@mnuda.com?subject=Pro+ Plan Inquiry';
  };

  const currentPlan = billingData.plan;
  const isProActive = currentPlan === 'pro' && billingData.isActive;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-[10px] bg-gray-100 rounded-md">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-gray-900">Change Plan</h1>
        </div>
        <p className="text-xs text-gray-600">Choose the plan that works best for you</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-[10px] py-[10px] rounded-md text-xs flex items-start gap-2">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Hobby Plan */}
        <div className={`bg-white border rounded-md overflow-hidden ${
          currentPlan === 'hobby' 
            ? 'border-gray-900 ring-2 ring-gray-900' 
            : 'border-gray-200'
        }`}>
          <div className="px-[10px] py-[10px] border-b border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Hobby</h3>
              {currentPlan === 'hobby' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">$0</span>
              <span className="text-xs text-gray-600">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Default plan</p>
          </div>
          <div className="px-[10px] py-[10px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>10 pins</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>3 areas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>1 profile</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Public visibility</span>
            </div>
          </div>
          <div className="px-[10px] py-[10px] border-t border-gray-200 bg-gray-50">
            {currentPlan === 'hobby' ? (
              <button
                disabled
                className="w-full px-[10px] py-[10px] bg-gray-200 text-gray-500 rounded-md text-xs font-medium cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => {
                  // For downgrading, redirect to billing page where they can manage subscription
                  router.push('/account/billing');
                }}
                className="w-full px-[10px] py-[10px] bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Switch to Hobby
              </button>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`bg-white border rounded-md overflow-hidden ${
          isProActive 
            ? 'border-gray-900 ring-2 ring-gray-900' 
            : 'border-gray-200'
        }`}>
          <div className="px-[10px] py-[10px] border-b border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Pro</h3>
              {isProActive && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">$20</span>
              <span className="text-xs text-gray-600">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Most popular</p>
          </div>
          <div className="px-[10px] py-[10px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Unlimited pins</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Unlimited areas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Multiple profiles</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Private visibility</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Priority support</span>
            </div>
          </div>
          <div className="px-[10px] py-[10px] border-t border-gray-200 bg-gray-50">
            {isProActive ? (
              <button
                disabled
                className="w-full px-[10px] py-[10px] bg-gray-200 text-gray-500 rounded-md text-xs font-medium cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={handleProCheckout}
                disabled={creatingCheckout}
                className="w-full px-[10px] py-[10px] bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {creatingCheckout ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe to Pro
                    <ArrowRightIcon className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pro+ Plan */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-[10px] py-[10px] border-b border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-semibold text-gray-900">Pro+</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">$80</span>
              <span className="text-xs text-gray-600">/month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enterprise features</p>
          </div>
          <div className="px-[10px] py-[10px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Everything in Pro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Custom integrations</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Dedicated support</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>Custom branding</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckIcon className="w-3 h-3 text-gray-500" />
              <span>API access</span>
            </div>
          </div>
          <div className="px-[10px] py-[10px] border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleProPlusContact}
              className="w-full px-[10px] py-[10px] bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <EnvelopeIcon className="w-3 h-3" />
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white border border-gray-200 rounded-md p-[10px]">
        <p className="text-xs text-gray-600">
          Need help choosing a plan? <a href="mailto:support@mnuda.com" className="text-gray-900 font-medium hover:underline">Contact our team</a> for personalized recommendations.
        </p>
      </div>
    </div>
  );
}
