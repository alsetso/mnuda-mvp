'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import MainContentNav from '@/components/MainContentNav';
import { 
  CreditCardIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
  is_default: boolean;
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
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          Add Payment Method
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [hasCustomer, setHasCustomer] = useState<boolean | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Check if customer exists
  const checkCustomer = async () => {
    try {
      const response = await fetch('/api/billing/customer');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check customer');
      }

      const data = await response.json();
      setHasCustomer(data.has_customer);
      return data.has_customer;
    } catch (err) {
      console.error('Error checking customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to check customer');
      setHasCustomer(false);
      return false;
    }
  };

  // Create Stripe customer
  const createCustomer = async () => {
    try {
      setCreatingCustomer(true);
      setError(null);
      const response = await fetch('/api/billing/customer', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create customer');
      }

      const data = await response.json();
      setHasCustomer(true);
      
      // After customer is created, fetch payment methods
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/billing/payment-methods');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.payment_methods || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  // Create setup intent for adding payment method
  const createSetupIntent = async () => {
    // First ensure customer exists
    if (!hasCustomer) {
      const customerExists = await checkCustomer();
      if (!customerExists) {
        setError('Please create a customer account first');
        return;
      }
    }

    try {
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
      setShowAddForm(true);
    } catch (err) {
      console.error('Error creating setup intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment form');
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

  useEffect(() => {
    if (!isLoading && user) {
      // First check if customer exists, then fetch payment methods
      checkCustomer().then((customerExists) => {
        if (customerExists) {
          fetchPaymentMethods();
        } else {
          setLoading(false);
        }
      });
    }
  }, [isLoading, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <MainContentNav title="Billing & Payment Methods" />
        <a
          href="/account/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Settings
        </a>
      </div>
      
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
            {!showAddForm && hasCustomer && (
              <button
                onClick={createSetupIntent}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Payment Method
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {hasCustomer === false ? (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Up Billing Account</h3>
              <p className="text-gray-600 mb-6">
                Create a Stripe customer account to start managing payment methods and subscriptions.
              </p>
              <button
                onClick={createCustomer}
                disabled={creatingCustomer}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingCustomer ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Create Billing Account
                  </>
                )}
              </button>
            </div>
          ) : showAddForm && setupIntentClientSecret ? (
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
                  onSuccess={() => {
                    setShowAddForm(false);
                    setSetupIntentClientSecret(null);
                    fetchPaymentMethods();
                  }}
                  onCancel={() => {
                    setShowAddForm(false);
                    setSetupIntentClientSecret(null);
                  }}
                />
              </Elements>
            </div>
          ) : hasCustomer && paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No payment methods on file</p>
              <button
                onClick={createSetupIntent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Your First Payment Method
              </button>
            </div>
          ) : hasCustomer ? (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
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
                        className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
          ) : null}
        </div>
      </div>

      {/* Subscriptions Section */}
      {hasCustomer && (
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
              disabled={portalLoading || paymentMethods.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          {paymentMethods.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please add a payment method before managing subscriptions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

