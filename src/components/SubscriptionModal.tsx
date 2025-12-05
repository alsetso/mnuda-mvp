'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  PlusIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import type { PaymentMethod } from '@/lib/billingServer';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentMethods: PaymentMethod[];
  loading: boolean;
}

function PaymentMethodSelection({
  paymentMethods,
  onSelect,
  onAddNew,
  selectedId,
}: {
  paymentMethods: PaymentMethod[];
  onSelect: (paymentMethodId: string) => void;
  onAddNew: () => void;
  selectedId: string | null;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-black mb-4">Select Payment Method</h3>
      
      {paymentMethods.map((pm) => (
        <button
          key={pm.id}
          onClick={() => onSelect(pm.id)}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            selectedId === pm.id
              ? 'border-black bg-black text-white'
              : 'border-gray-200 hover:border-gray-300 bg-white text-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCardIcon className={`w-6 h-6 ${selectedId === pm.id ? 'text-white' : 'text-gray-600'}`} />
              <div>
                <div className="font-semibold">
                  {pm.card?.brand ? pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1) : 'Card'} •••• {pm.card?.last4}
                </div>
                <div className={`text-sm ${selectedId === pm.id ? 'text-gray-200' : 'text-gray-500'}`}>
                  Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                  {pm.is_default && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded">Default</span>
                  )}
                </div>
              </div>
            </div>
            {selectedId === pm.id && (
              <CheckIcon className="w-6 h-6 text-white" />
            )}
          </div>
        </button>
      ))}

      <button
        onClick={onAddNew}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-left hover:border-black hover:bg-gray-50 transition-all flex items-center gap-3"
      >
        <PlusIcon className="w-6 h-6 text-gray-600" />
        <span className="font-semibold text-black">Add New Payment Method</span>
      </button>
    </div>
  );
}

function NewPaymentMethodForm({
  onSuccess,
  onCancel,
  clientSecret,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Failed to submit payment');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/billing`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded - create subscription with the new payment method
      try {
        const response = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_method_id: paymentIntent.payment_method,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create subscription');
        }

        const subscriptionData = await response.json();
        
        // If subscription requires payment confirmation, handle it
        if (subscriptionData.requires_payment && subscriptionData.client_secret) {
          const { error: confirmSubError } = await stripe.confirmCardPayment(
            subscriptionData.client_secret
          );
          
          if (confirmSubError) {
            throw new Error(confirmSubError.message || 'Failed to confirm subscription payment');
          }
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete subscription');
        setProcessing(false);
      }
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-black text-black mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your Pro subscription is being activated...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              Subscribe to Pro - $20/month
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  paymentMethods,
  loading,
}: SubscriptionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(
    paymentMethods.find(pm => pm.is_default)?.id || null
  );
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [subscriptionClientSecret, setSubscriptionClientSecret] = useState<string | null>(null);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [isOpen, paymentMethods, selectedPaymentMethod]);

  const handleSubscribeWithExisting = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setCreatingSubscription(true);
      setError(null);

      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: selectedPaymentMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      const subscriptionData = await response.json();

      // If subscription requires payment confirmation
      if (subscriptionData.requires_payment && subscriptionData.client_secret) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error: confirmError } = await stripe.confirmCardPayment(
            subscriptionData.client_secret
          );
          
          if (confirmError) {
            throw new Error(confirmError.message || 'Failed to confirm subscription payment');
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
      setCreatingSubscription(false);
    }
  };

  const handleAddNewPaymentMethod = async () => {
    try {
      setCreatingSubscription(true);
      setError(null);
      
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize payment form');
      }

      const data = await response.json();
      setSubscriptionClientSecret(data.client_secret);
      setShowNewPaymentForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment form');
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleNewPaymentSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const handleCancel = () => {
    setShowNewPaymentForm(false);
    setSubscriptionClientSecret(null);
    setError(null);
    if (paymentMethods.length === 0) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full bg-white overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-black">Subscribe to Pro</h2>
              <p className="text-sm text-gray-600 mt-1">$20/month - Unlimited pins, areas, and features</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-black text-black mb-2">Subscription Successful!</h3>
                <p className="text-gray-600">Your Pro subscription is being activated...</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : showNewPaymentForm && subscriptionClientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: subscriptionClientSecret,
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
                <NewPaymentMethodForm
                  onSuccess={handleNewPaymentSuccess}
                  onCancel={handleCancel}
                  clientSecret={subscriptionClientSecret}
                />
              </Elements>
            ) : (
              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                    <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {paymentMethods.length > 0 ? (
                  <>
                    <PaymentMethodSelection
                      paymentMethods={paymentMethods}
                      onSelect={setSelectedPaymentMethod}
                      onAddNew={handleAddNewPaymentMethod}
                      selectedId={selectedPaymentMethod}
                    />
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSubscribeWithExisting}
                        disabled={creatingSubscription || !selectedPaymentMethod}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {creatingSubscription ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-5 h-5" />
                            Subscribe with Selected Card
                          </>
                        )}
                      </button>
                      <button
                        onClick={onClose}
                        disabled={creatingSubscription}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">No payment methods on file</p>
                    <button
                      onClick={handleAddNewPaymentMethod}
                      disabled={creatingSubscription}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creatingSubscription ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-5 h-5" />
                          Add Payment Method & Subscribe
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

