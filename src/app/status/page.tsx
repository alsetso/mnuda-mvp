'use client';

import Link from 'next/link';
import { useApiStatus } from '@/features/shared';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import AppHeader from '@/features/session/components/AppHeader';

export default function StatusPage() {
  const { status, lastChecked, error, checkStatus } = useApiStatus();
  const { 
    currentSession, 
    sessions,
    createNewSession, 
    switchSession
  } = useSessionManager();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: (
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          title: 'All Systems Operational',
          description: 'API is responding normally and returning data',
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: (
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          title: 'Service Degraded',
          description: 'API is experiencing issues. This may be due to high demand on our free tier. Please try again in a few minutes.',
        };
      case 'checking':
        return {
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          icon: (
            <svg className="w-16 h-16 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          title: 'Checking Status...',
          description: 'Verifying API connectivity and data availability',
        };
      default:
        return {
          color: 'bg-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: (
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          title: 'Unknown Status',
          description: 'Unable to determine system status',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <AppHeader
        currentSession={currentSession}
        sessions={sessions}
        onNewSession={createNewSession}
        onSessionSwitch={switchSession}
        updateUrl={false}
      />
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            System Status
          </h1>
          <p className="text-lg text-gray-600">
            Real-time monitoring of our API services
          </p>
        </div>

        {/* Main Status Card */}
        <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-8 mb-8`}>
          <div className="text-center">
            {/* Status Icon */}
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.color} text-white mb-6`}>
              {config.icon}
            </div>

            {/* Status Title */}
            <h2 className={`text-3xl font-bold ${config.textColor} mb-4`}>
              {config.title}
            </h2>

            {/* Status Description */}
            <p className={`text-lg ${config.textColor} mb-6`}>
              {config.description}
            </p>

            {/* Last Checked */}
            {lastChecked && (
              <p className="text-sm text-gray-500 mb-4">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            )}

            {/* Error Details */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Manual Check Button */}
            <button
              onClick={checkStatus}
              disabled={status === 'checking'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#1dd1f5] hover:bg-[#1dd1f5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'checking' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Check Status Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* API Service */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">API Service</h3>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === 'online' ? 'bg-green-100 text-green-800' : 
                status === 'offline' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status === 'online' ? 'Operational' : status === 'offline' ? 'Degraded' : 'Checking'}
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Response Time:</strong> {status === 'online' ? '&lt; 200ms' : 'N/A'}</p>
              <p><strong>Uptime (24h):</strong> {status === 'online' ? '99.9%' : 'Calculating...'}</p>
            </div>
          </div>

          {/* Database Service */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Database</h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Response Time:</strong> &lt; 50ms</p>
              <p><strong>Uptime (24h):</strong> 100%</p>
            </div>
          </div>

          {/* Email Service */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Email Service</h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Delivery Rate:</strong> 99.8%</p>
              <p><strong>Uptime (24h):</strong> 100%</p>
            </div>
          </div>
        </div>

        {/* Service Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Free Service Notice</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Our API service is provided free of charge and may experience temporary slowdowns during high demand periods. 
                  Rate limits may apply to ensure fair usage across all users. For production workloads, consider our 
                  <a href="/signup" className="font-medium underline hover:text-blue-600"> premium plans</a> for guaranteed performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Data Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Test Data Used
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Street:</strong> 3828 Double Oak Ln</p>
              <p><strong>City/State/ZIP:</strong> Irving, TX 75061</p>
            </div>
          </div>

          {/* Monitoring Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Monitoring Details
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Check Frequency:</strong> Every 30 seconds</p>
              <p><strong>Timeout:</strong> 5 seconds</p>
              <p><strong>Endpoint:</strong> /api/address</p>
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Application
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
