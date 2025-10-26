'use client';

import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

interface SubscriptionPanelProps {
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function SubscriptionPanel({ 
  className = '', 
  showActions = true,
  compact = false 
}: SubscriptionPanelProps) {
  const { subscriptionHealth, loading, error } = useSubscriptionStatus();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !subscriptionHealth) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-red-600">Unable to load subscription data</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trialing':
        return 'text-blue-600 bg-blue-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        return 'text-red-600 bg-red-100';
      case 'incomplete':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      case 'incomplete':
        return 'Incomplete';
      case 'incomplete_expired':
        return 'Expired';
      case 'free':
        return 'Free';
      default:
        return 'Unknown';
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">
              {subscriptionHealth.planDetails?.name || 'Free Plan'}
            </div>
            <div className="text-sm text-gray-500">
              {subscriptionHealth.planDetails ? formatPrice(subscriptionHealth.planDetails.priceCents) : 'No cost'}
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriptionHealth.status)}`}>
            {getStatusText(subscriptionHealth.status)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionHealth.status)}`}>
          {getStatusText(subscriptionHealth.status)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Plan Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">
              {subscriptionHealth.planDetails?.name || 'Free Plan'}
            </h4>
            <div className="text-lg font-bold text-gray-900">
              {subscriptionHealth.planDetails ? formatPrice(subscriptionHealth.planDetails.priceCents) : 'Free'}
            </div>
          </div>
          {subscriptionHealth.planDetails && (
            <div className="text-sm text-gray-600 mb-2">
              {subscriptionHealth.planDetails.description}
            </div>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              {subscriptionHealth.planDetails?.creditsPerPeriod || 0} credits per {subscriptionHealth.planDetails?.billingInterval || 'period'}
            </span>
            {subscriptionHealth.planDetails?.billingInterval && (
              <span>
                Billed {subscriptionHealth.planDetails.billingInterval}
              </span>
            )}
          </div>
        </div>

        {/* Billing Information */}
        {subscriptionHealth.nextBillingDate && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Next Billing Date:</span>
              <span className="font-medium">
                {subscriptionHealth.nextBillingDate.toLocaleDateString()}
              </span>
            </div>
            {subscriptionHealth.daysUntilRenewal !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Days Until Renewal:</span>
                <span className="font-medium">
                  {subscriptionHealth.daysUntilRenewal} days
                </span>
              </div>
            )}
          </div>
        )}

        {/* Subscription Health Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                subscriptionHealth.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {subscriptionHealth.isActive ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
          </div>
          
          {subscriptionHealth.upgradeEligibility && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Upgrade Available:</span>
              <span className="text-green-600 font-medium">Yes</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
