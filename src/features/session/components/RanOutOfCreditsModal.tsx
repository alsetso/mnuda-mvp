'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUsageService } from '../services/apiUsageService';

interface RanOutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining?: number;
  totalCredits?: number;
  creditsUsed?: number;
}

export default function RanOutOfCreditsModal({ 
  isOpen, 
  onClose, 
  creditsRemaining = 0,
  totalCredits = 10,
  creditsUsed = 10
}: RanOutOfCreditsModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleBuyCredits = () => {
    handleClose();
    router.push('/signup');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-150 ${
          isClosing ? 'opacity-0' : 'opacity-50'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-150 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Header */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Daily Credits Exhausted
                </h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="text-sm text-gray-600 mb-4">
              You&apos;ve used all your free daily credits ({apiUsageService.formatCreditsWithDollar(totalCredits)}). 
              Your credits will reset at midnight, or you can purchase additional credits to continue.
            </div>

            {/* Credit Status */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Free Daily Credits</span>
                <span className="text-sm font-medium text-gray-900">
                  {apiUsageService.formatCreditsWithDollar(creditsUsed)} / {apiUsageService.formatCreditsWithDollar(totalCredits)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>

            {/* Reset countdown */}
            {timeUntilReset && (
              <div className="mt-4 p-3 bg-[#1dd1f5]/10 border border-[#1dd1f5]/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#014463] font-medium">Credits reset in:</span>
                  <span className="text-sm text-[#014463] font-mono font-semibold">{timeUntilReset}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 transition-colors"
              >
                Wait for Reset
              </button>
              <button
                onClick={handleBuyCredits}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-transparent rounded-md hover:bg-[#1dd1f5]/90 focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:ring-offset-2 transition-colors"
              >
                Buy Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
