'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUsageService } from '../services/apiUsageService';
import { useApiUsageContext } from '../contexts/ApiUsageContext';

interface UsageDropdownProps {
  className?: string;
}

export default function UsageDropdown({ className = '' }: UsageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { apiUsage, loading, refreshApiUsage } = useApiUsageContext();

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
        className="relative p-2 text-gray-400 hover:text-[#1dd1f5] hover:bg-[#1dd1f5]/10 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2"
        title="View API credits"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {/* Credit count badge */}
        {apiUsage && (
          <span className="absolute -top-1 -right-1 text-xs font-medium text-gray-500">
            {apiUsage.hasUnlimitedCredits ? '∞' : apiUsage.creditsRemaining}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg z-50 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Credit Balance</h3>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1dd1f5] border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : apiUsage ? (
              <div className="space-y-4">
                {/* Credit List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {apiUsage.hasUnlimitedCredits ? 'Paid Credits' : 'Free Daily'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {apiUsage.hasUnlimitedCredits ? '∞' : apiUsage.creditsRemaining}
                    </span>
                  </div>
                  {apiUsage.hasUnlimitedCredits && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✓ Unlimited API access
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-sm text-gray-500">Unable to load API usage data</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            {/* Reset countdown - only show for non-authenticated users */}
            {timeUntilReset && !apiUsage?.hasUnlimitedCredits && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium">Credits reset in:</span>
                  <span className="text-xs text-blue-800 font-mono">{timeUntilReset}</span>
                </div>
              </div>
            )}
            
            {/* Show different button based on authentication status */}
            {apiUsage?.hasUnlimitedCredits ? (
              <div className="text-center">
                <div className="text-xs text-green-600 font-medium">
                  You have unlimited API access
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/signup');
                }}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 transition-colors"
              >
                Buy Credits
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
