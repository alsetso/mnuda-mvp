'use client';

import AppHeader from '@/features/session/components/AppHeader';
import { CreditBalanceWidget, UsageAnalytics, SubscriptionPanel } from '@/features/billing';
import { useAuth } from '@/features/auth';

export default function UsagePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          currentSession={null}
          sessions={[]}
          onNewSession={() => ({ id: '', name: '', createdAt: new Date() })}
          onSessionSwitch={() => {}}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#014463]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader
          currentSession={null}
          sessions={[]}
          onNewSession={() => ({ id: '', name: '', createdAt: new Date() })}
          onSessionSwitch={() => {}}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Usage Analytics</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your usage analytics.</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-[#014463] text-white rounded-lg hover:bg-[#014463]/90 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        currentSession={null}
        sessions={[]}
        onNewSession={() => ({ id: '', name: '', createdAt: new Date() })}
        onSessionSwitch={() => {}}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="mt-2 text-gray-600">Monitor your API usage, credits, and subscription status in real-time.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Credit Balance - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <CreditBalanceWidget showDetails={true} />
          </div>
          
          {/* Subscription Panel - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <SubscriptionPanel showActions={true} />
          </div>
          
          {/* Quick Stats - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Analytics - Full width */}
        <div className="mb-8">
          <UsageAnalytics showChart={true} />
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Address Search</span>
                <span className="text-sm font-medium text-gray-900">1.0 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name Search</span>
                <span className="text-sm font-medium text-gray-900">1.0 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Search</span>
                <span className="text-sm font-medium text-gray-900">1.0 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phone Search</span>
                <span className="text-sm font-medium text-gray-900">1.0 credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Zillow Search</span>
                <span className="text-sm font-medium text-gray-900">1.0 credits</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3">
              <a
                href="/account"
                className="block text-sm text-[#014463] hover:text-[#014463]/80 transition-colors"
              >
                Manage Billing →
              </a>
              <a
                href="/pricing"
                className="block text-sm text-[#014463] hover:text-[#014463]/80 transition-colors"
              >
                Upgrade Plan →
              </a>
              <a
                href="/support"
                className="block text-sm text-[#014463] hover:text-[#014463]/80 transition-colors"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
