'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApiUsageContext } from '../contexts/ApiUsageContext';

interface CreditsExhaustedOverlayProps {
  className?: string;
}

export default function CreditsExhaustedOverlay({ 
  className = '' 
}: CreditsExhaustedOverlayProps) {
  const { apiUsage, showCreditsModal } = useApiUsageContext();
  const [isVisible, setIsVisible] = useState(false);

  // Check if credits are exhausted (but not for authenticated users with unlimited credits)
  const isCreditsExhausted = (apiUsage?.isLimitReached && !apiUsage?.hasUnlimitedCredits) || false;

  // Show overlay when credits are exhausted
  useEffect(() => {
    if (isCreditsExhausted) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isCreditsExhausted]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showCreditsModal();
  }, [showCreditsModal]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isCreditsExhausted && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      showCreditsModal();
    }
  }, [isCreditsExhausted, showCreditsModal]);

  return (
    <>
      {/* Credits Exhausted Overlay */}
      {isVisible && (
        <div
          className={`${className} z-40 bg-red-500/20 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300`}
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Credits exhausted - click to view options"
        >
          {/* Overlay Content */}
          <div className="bg-white/90 backdrop-blur-sm border-2 border-red-300 rounded-lg p-6 shadow-lg max-w-sm mx-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Credits Exhausted
            </h3>
            
            <p className="text-sm text-red-600 mb-4">
              You&apos;ve used all your free daily credits. Click here to view your options.
            </p>
            
            <div className="text-xs text-red-500">
              Credits reset at midnight or purchase more to continue
            </div>
          </div>
        </div>
      )}
    </>
  );
}
