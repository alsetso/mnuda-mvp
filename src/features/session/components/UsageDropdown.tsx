'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUsageService } from '../services/apiUsageService';
import { useApiUsageContext } from '../contexts/ApiUsageContext';
import { useRealtimeCredits, useSubscriptionStatus } from '@/features/billing';
import { formatDistanceToNow } from 'date-fns';

interface UsageDropdownProps {
  className?: string;
}

export default function UsageDropdown({ className = '' }: UsageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { apiUsage, loading, refreshApiUsage } = useApiUsageContext();
  const { creditBalance } = useRealtimeCredits();
  const { subscriptionHealth } = useSubscriptionStatus();

  const handleToggle = () => {
    if (!isOpen) {
      refreshApiUsage();
    }
    setIsOpen(!isOpen);
  };

  const handleViewMore = () => {
    setIsOpen(false);
    router.push('/usage');
  };

  // Update countdown every 30 seconds
  useEffect(() => {
    const updateCountdown = () => {
      setTimeUntilReset(apiUsageService.getTimeUntilResetFormatted());
    };

    // Update immediately
    updateCountdown();

    // Update every 30 seconds for better user experience
    const interval = setInterval(updateCountdown, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleViewMore();
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);


  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* API Credits Icon Button */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`flex items-center space-x-1.5 px-2.5 py-2 border rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#014463] focus:ring-offset-2 ${
          apiUsage?.hasUnlimitedCredits 
            ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200' 
            : apiUsage?.creditsRemaining && apiUsage.creditsRemaining <= 1
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
            : apiUsage?.creditsRemaining && apiUsage.creditsRemaining <= 3
            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200'
            : 'text-gray-500 hover:text-[#014463] hover:bg-gray-50 border-gray-200'
        }`}
        title="View API credits"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className={`w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center ${
          apiUsage?.hasUnlimitedCredits 
            ? 'bg-green-100' 
            : apiUsage?.creditsRemaining && apiUsage.creditsRemaining <= 1
            ? 'bg-red-100'
            : apiUsage?.creditsRemaining && apiUsage.creditsRemaining <= 3
            ? 'bg-yellow-100'
            : 'bg-gray-100'
        }`}>
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        {/* Credit count */}
        {apiUsage && (
          <span className="text-xs font-medium">
            {apiUsage.hasUnlimitedCredits ? '∞' : apiUsageService.formatCredits(apiUsage.creditsRemaining)}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg z-50 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Usage Dashboard</h3>
              {subscriptionHealth && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subscriptionHealth.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscriptionHealth.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                  subscriptionHealth.status === 'free' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {subscriptionHealth.planDetails?.name || 'Free Plan'}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#014463] border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real-time Credit Balance */}
                {creditBalance && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Credits</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.1) ? 'bg-red-500' :
                          creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.2) ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-semibold text-gray-900">
                          {creditBalance.remainingCredits.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.1) ? 'bg-red-500' :
                          creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.2) ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, ((creditBalance.totalAllocated - creditBalance.remainingCredits) / creditBalance.totalAllocated) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used: {(creditBalance.totalAllocated - creditBalance.remainingCredits).toFixed(1)}</span>
                      <span>Total: {creditBalance.totalAllocated.toFixed(1)}</span>
                    </div>
                    
                    {/* Reset Info */}
                    <div className="mt-2 text-xs text-gray-500">
                      Resets {formatDistanceToNow(creditBalance.resetDate, { addSuffix: true })}
                    </div>
                  </div>
                )}

                {/* Usage Rate */}
                {creditBalance && creditBalance.usageRate > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">Usage Rate</span>
                      <span className="text-sm font-medium text-blue-900">
                        {creditBalance.usageRate.toFixed(2)} credits/hour
                      </span>
                    </div>
                    {creditBalance.projectedExhaustion && (
                      <div className="mt-1 text-xs text-blue-600">
                        Projected exhaustion: {formatDistanceToNow(creditBalance.projectedExhaustion, { addSuffix: true })}
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy API Usage (fallback) */}
                {apiUsage && !creditBalance && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {apiUsage.hasUnlimitedCredits ? 'Paid Credits' : 'Free Daily'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {apiUsage.hasUnlimitedCredits ? '∞' : apiUsageService.formatCredits(apiUsage.creditsRemaining)}
                      </span>
                    </div>
                    
                    {!apiUsage.hasUnlimitedCredits && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              apiUsage.creditsRemaining <= 1 ? 'bg-red-500' : 
                              apiUsage.creditsRemaining <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (apiUsage.creditsUsed / apiUsage.totalCredits) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Used: {apiUsageService.formatCreditsWithDollar(apiUsage.creditsUsed)}</span>
                          <span>Total: {apiUsageService.formatCreditsWithDollar(apiUsage.totalCredits)}</span>
                        </div>
                      </div>
                    )}
                    
                    {apiUsage.hasUnlimitedCredits && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✓ Unlimited API access
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            {/* Reset countdown */}
            {timeUntilReset && (
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Credits reset in:</span>
                  <span className="text-xs text-gray-900 font-mono">{timeUntilReset}</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/usage');
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#014463] focus:ring-offset-2 transition-colors"
              >
                Usage Details
              </button>
              
              {subscriptionHealth?.canUpgrade && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/pricing');
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#014463] rounded-md hover:bg-[#014463]/90 focus:outline-none focus:ring-2 focus:ring-[#014463] focus:ring-offset-2 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
