'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { UsageAnalytics, CreditBalanceWidget, useRealtimeCredits } from '@/features/billing';

export default function UsagePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { creditBalance, transactions, loading: creditsLoading, error: creditsError } = useRealtimeCredits();

  // Redirect to login if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dd1f5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Credit Balance Overview */}
      <div className="mb-6">
        <CreditBalanceWidget showDetails={true} />
      </div>

      {/* Usage Analytics */}
      <div className="mb-6">
        <UsageAnalytics showChart={true} />
      </div>

      {/* Credit Transaction History */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
          <div className="text-sm text-gray-500">
            Last 10 transactions
          </div>
        </div>

        {creditsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1dd1f5]"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        ) : creditsError ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-500">Unable to load transaction history</p>
            <p className="text-sm text-gray-400 mt-1">{creditsError}</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    transaction.transactionType === 'credit' 
                      ? 'bg-green-100 text-green-600'
                      : transaction.transactionType === 'usage'
                      ? 'bg-blue-100 text-blue-600'
                      : transaction.transactionType === 'refund'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {transaction.transactionType === 'credit' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : transaction.transactionType === 'usage' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ) : transaction.transactionType === 'refund' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.createdAt.toLocaleDateString()} at {transaction.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.transactionType === 'credit' || transaction.transactionType === 'refund'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.transactionType === 'credit' || transaction.transactionType === 'refund' ? '+' : '-'}
                    {Math.abs(transaction.amount).toFixed(2)} credits
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: {transaction.balanceAfter.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Usage Tips</h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc pl-4 space-y-1">
                <li>Each API call consumes credits based on the type of search performed</li>
                <li>Credits reset at the beginning of each billing period</li>
                <li>Monitor your usage to avoid running out of credits</li>
                <li>Upgrade your plan for more credits and advanced features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
