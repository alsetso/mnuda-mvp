'use client';

import { useRealtimeCredits } from '../hooks/useRealtimeCredits';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

interface CompactUsageIndicatorProps {
  className?: string;
}

export default function CompactUsageIndicator({ className = '' }: CompactUsageIndicatorProps) {
  const { creditBalance } = useRealtimeCredits();
  const { subscriptionHealth } = useSubscriptionStatus();

  if (!creditBalance) {
    return null;
  }

  const isLowCredits = creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.2);
  const isCriticalCredits = creditBalance.remainingCredits < (creditBalance.totalAllocated * 0.1);

  const getStatusColor = () => {
    if (isCriticalCredits) return 'text-red-600';
    if (isLowCredits) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBg = () => {
    if (isCriticalCredits) return 'bg-red-50 border-red-200';
    if (isLowCredits) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className={`inline-flex items-center space-x-2 text-xs ${className}`}>
      {/* Credit Status Dot */}
      <div className={`w-2 h-2 rounded-full ${
        isCriticalCredits ? 'bg-red-500' : 
        isLowCredits ? 'bg-yellow-500' : 
        'bg-green-500'
      }`}></div>
      
      {/* Credit Count */}
      <span className={`font-medium ${getStatusColor()}`}>
        {creditBalance.remainingCredits.toFixed(0)}
      </span>
      
      {/* Plan Badge */}
      {subscriptionHealth && (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          subscriptionHealth.status === 'active' ? 'bg-green-100 text-green-700' :
          subscriptionHealth.status === 'trialing' ? 'bg-blue-100 text-blue-700' :
          subscriptionHealth.status === 'free' ? 'bg-gray-100 text-gray-700' :
          'bg-red-100 text-red-700'
        }`}>
          {subscriptionHealth.planDetails?.name || 'Free'}
        </span>
      )}
    </div>
  );
}
