'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountSidebar from '@/components/AccountSidebar';
import AccountHero from '@/components/AccountHero';
import { 
  CreditCardIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentMethod, BillingData } from '@/lib/billingServer';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface BillingClientProps {
  initialBillingData: BillingData;
}

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Failed to submit payment method');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Failed to add payment method');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.protocol === 'http:' && (
        <div className="p-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg text-sm">
          <p className="font-semibold mb-1">Development Mode Notice</p>
          <p className="text-xs">
            The &quot;secure connection&quot; warning is expected in development. Stripe Elements still processes payments securely. 
            To enable autofill, use HTTPS: <code className="bg-blue-100 px-1 rounded">npm run dev:https</code>
          </p>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <CheckIcon className="w-4 h-4" />
          Add Payment Method
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function BillingClient({ initialBillingData }: BillingClientProps) {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData>(initialBillingData);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [creatingSetupIntent, setCreatingSetupIntent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setError(null);
      const response = await fetch('/api/billing/payment-methods');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      const data = await response.json();
      setBillingData(prev => ({
        ...prev,
        paymentMethods: data.payment_methods || [],
      }));
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    }
  };

  // Create setup intent for adding payment method
  // Automatically creates Stripe customer if it doesn't exist
  const createSetupIntent = async () => {
    try {
      setCreatingSetupIntent(true);
      setError(null);
      const response = await fetch('/api/billing/setup-intent', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create setup intent');
      }

      const data = await response.json();
      setSetupIntentClientSecret(data.client_secret);
      
      // Update billing data if customer was created
      if (data.customer_id && !billingData.hasCustomer) {
        setBillingData(prev => ({
          ...prev,
          hasCustomer: true,
          customerId: data.customer_id,
        }));
      }
      
      setShowAddForm(true);
    } catch (err) {
      console.error('Error creating setup intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment form');
    } finally {
      setCreatingSetupIntent(false);
    }
  };

  // Set default payment method
  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set default payment method');
      }

      await fetchPaymentMethods();
      router.refresh();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/billing/payment-methods?payment_method_id=${paymentMethodId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete payment method');
      }

      await fetchPaymentMethods();
      router.refresh();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  // Open Stripe Customer Portal
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

  const handleAddSuccess = () => {
    setShowAddForm(false);
    setSetupIntentClientSecret(null);
    fetchPaymentMethods();
    router.refresh();
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
    setSetupIntentClientSecret(null);
  };

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
            <div className="space-y-6">
      
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Methods Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCardIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-black text-black">Payment Methods</h2>
            </div>
            {!showAddForm && (
              <button
                onClick={createSetupIntent}
                disabled={creatingSetupIntent}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                {creatingSetupIntent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Payment Method
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {showAddForm && setupIntentClientSecret ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Add New Payment Method</h3>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: setupIntentClientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#000000',
                      colorBackground: '#ffffff',
                      colorText: '#000000',
                      colorDanger: '#dc2626',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <AddPaymentMethodForm
                  onSuccess={handleAddSuccess}
                  onCancel={handleAddCancel}
                />
              </Elements>
            </div>
          ) : billingData.hasCustomer && billingData.paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No payment methods on file</p>
              <button
                onClick={createSetupIntent}
                disabled={creatingSetupIntent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingSetupIntent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Your First Payment Method
                  </>
                )}
              </button>
            </div>
          ) : billingData.hasCustomer ? (
            <div className="space-y-3">
              {billingData.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-black">
                      {pm.card?.brand ? pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1) : 'Card'} •••• {pm.card?.last4}
                    </span>
                    {pm.is_default && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-black text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!pm.is_default && (
                      <button
                        onClick={() => setDefaultPaymentMethod(pm.id)}
                        className="px-3 py-1.5 text-sm font-semibold text-black border-2 border-black rounded hover:bg-black hover:text-white transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => deletePaymentMethod(pm.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove payment method"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Get started by adding a payment method</p>
              <button
                onClick={createSetupIntent}
                disabled={creatingSetupIntent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingSetupIntent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Payment Method
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscriptions Section */}
      {billingData.hasCustomer && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-black text-black mb-2">Subscriptions & Billing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage your subscriptions, view invoices, and update billing information through the Stripe Customer Portal.
              </p>
            </div>
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading || billingData.paymentMethods.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {portalLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Opening...
                </>
              ) : (
                <>
                  Manage Subscriptions
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {billingData.paymentMethods.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please add a payment method before managing subscriptions.
              </p>
            </div>
          )}
        </div>
      )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

