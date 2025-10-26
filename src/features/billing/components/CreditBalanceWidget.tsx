'use client';

import { useRealtimeCredits } from '../hooks/useRealtimeCredits';
import { formatDistanceToNow } from 'date-fns';

interface CreditBalanceWidgetProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export default function CreditBalanceWidget({ 
  className = '', 
  showDetails = true,
  compact = false 
}: CreditBalanceWidgetProps) {
  const { creditBalance, loading, error } = useRealtimeCredits();

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

  if (error || !creditBalance) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-red-600">Unable to load credit data</span>
        </div>
      </div>
    );
  }

  const usagePercentage = (creditBalance.totalAllocated - creditBalance.remainingCredits) / creditBalance.totalAllocated * 100;
  const isLowCredits = creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.2);
  const isCriticalCredits = creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.1);

  const getStatusColor = () => {
    if (isCriticalCredits) return 'text-red-600';
    if (isLowCredits) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBgColor = () => {
    if (isCriticalCredits) return 'bg-red-50 border-red-200';
    if (isLowCredits) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getProgressBarColor = () => {
    if (isCriticalCredits) return 'bg-red-500';
    if (isLowCredits) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <div className={`${getStatusBgColor()} border rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isCriticalCredits ? 'bg-red-500' : isLowCredits ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {creditBalance.remainingCredits.toFixed(1)} credits
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(creditBalance.resetDate, { addSuffix: true })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getStatusBgColor()} border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Credit Balance</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isCriticalCredits ? 'bg-red-500' : isLowCredits ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {isCriticalCredits ? 'Critical' : isLowCredits ? 'Low' : 'Healthy'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Used: {creditBalance.totalAllocated - creditBalance.remainingCredits}</span>
            <span>Total: {creditBalance.totalAllocated}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Credit Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {creditBalance.remainingCredits.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {creditBalance.totalAllocated.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Allocated</div>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Usage Rate:</span>
              <span className="font-medium">{creditBalance.usageRate.toFixed(2)} credits/hour</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reset Date:</span>
              <span className="font-medium">
                {formatDistanceToNow(creditBalance.resetDate, { addSuffix: true })}
              </span>
            </div>
            {creditBalance.projectedExhaustion && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Projected Exhaustion:</span>
                <span className="font-medium">
                  {formatDistanceToNow(creditBalance.projectedExhaustion, { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
