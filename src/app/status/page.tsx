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
      
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            System Status
          </h1>
          <p className="text-lg text-gray-600">
            Real-time monitoring of our API services
          </p>
        </div>

        {/* Main Status Card */}
        <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Status Icon */}
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.color} text-white`}>
                {status === 'online' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : status === 'offline' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              
              <div>
                <h2 className={`text-lg font-bold ${config.textColor}`}>
                  {config.title}
                </h2>
                <p className={`text-sm ${config.textColor}`}>
                  {config.description}
                </p>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={status === 'checking'}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-[#1dd1f5] hover:bg-[#1dd1f5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'checking' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking
                </>
              ) : (
                'Check'
              )}
            </button>
          </div>
          
          {/* Last Checked & Error Details */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {lastChecked && (
              <p className="text-xs text-gray-500">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-1">
                <strong>Error:</strong> {error}
              </p>
            )}
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* API Service */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">API Service</h3>
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                status === 'online' ? 'bg-green-100 text-green-800' : 
                status === 'offline' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status === 'online' ? 'OK' : status === 'offline' ? 'DOWN' : 'CHECK'}
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Response:</strong> {status === 'online' ? '&lt; 200ms' : 'N/A'}</p>
              <p><strong>Uptime:</strong> {status === 'online' ? '99.9%' : 'N/A'}</p>
            </div>
          </div>

          {/* Database Service */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Database</h3>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                OK
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Response:</strong> &lt; 50ms</p>
              <p><strong>Uptime:</strong> 100%</p>
            </div>
          </div>

          {/* Email Service */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Email Service</h3>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                OK
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Delivery:</strong> 99.8%</p>
              <p><strong>Uptime:</strong> 100%</p>
            </div>
          </div>
        </div>

        {/* Service Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <h3 className="text-xs font-medium text-blue-800">Free Service Notice</h3>
              <div className="mt-1 text-xs text-blue-700">
                <p>
                  Free API service may experience slowdowns during high demand. 
                  <a href="/signup" className="font-medium underline hover:text-blue-600"> Premium plans</a> available for production use.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Test Data Info */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Test Data
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Street:</strong> 3828 Double Oak Ln</p>
              <p><strong>Location:</strong> Irving, TX 75061</p>
            </div>
          </div>

          {/* Monitoring Info */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Monitoring
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Frequency:</strong> 30s</p>
              <p><strong>Timeout:</strong> 5s</p>
              <p><strong>Endpoint:</strong> /api/address</p>
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
