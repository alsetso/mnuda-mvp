'use client';

import { useUsageAnalytics } from '../hooks/useUsageAnalytics';

interface UsageAnalyticsProps {
  className?: string;
  showChart?: boolean;
  compact?: boolean;
}

export default function UsageAnalytics({ 
  className = '', 
  showChart = true,
  compact = false 
}: UsageAnalyticsProps) {
  const { analytics, loading, error } = useUsageAnalytics();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-red-600">Unable to load usage analytics</span>
        </div>
      </div>
    );
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBg = (rate: number) => {
    if (rate >= 95) return 'bg-green-100';
    if (rate >= 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Usage Analytics</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSuccessRateBg(analytics.successRate)} ${getSuccessRateColor(analytics.successRate)}`}>
            {analytics.successRate.toFixed(1)}% success
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Credits</div>
            <div className="font-semibold">{analytics.totalCreditsUsed.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-gray-500">API Calls</div>
            <div className="font-semibold">{analytics.totalApiCalls}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Usage Analytics</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuccessRateBg(analytics.successRate)} ${getSuccessRateColor(analytics.successRate)}`}>
          {analytics.successRate.toFixed(1)}% Success Rate
        </div>
      </div>

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{analytics.totalCreditsUsed.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Total Credits Used</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{analytics.totalApiCalls}</div>
            <div className="text-sm text-gray-500">Total API Calls</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{formatResponseTime(analytics.averageResponseTime)}</div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
        </div>

        {/* API Type Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">API Usage Breakdown</h4>
          <div className="space-y-3">
            {analytics.apiTypeBreakdown.map((api, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{api.apiName}</div>
                  <div className="text-sm text-gray-500">
                    {api.callCount} calls • {api.creditsConsumed.toFixed(1)} credits
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    {formatResponseTime(api.averageResponseTime)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSuccessRateBg(api.successRate)} ${getSuccessRateColor(api.successRate)}`}>
                    {api.successRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Usage Hours */}
        {analytics.peakUsageHours.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Peak Usage Hours</h4>
            <div className="flex flex-wrap gap-2">
              {analytics.peakUsageHours.map((hour, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {hour}:00
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daily Usage Chart Placeholder */}
        {showChart && analytics.dailyUsage.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Daily Usage (Last 7 Days)</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-7 gap-2">
                {analytics.dailyUsage.slice(-7).map((day, index) => {
                  const maxUsage = Math.max(...analytics.dailyUsage.map(d => d.creditsUsed));
                  const height = maxUsage > 0 ? (day.creditsUsed / maxUsage) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      <div className="w-full bg-gray-200 rounded-t" style={{ height: '60px' }}>
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="text-xs font-medium text-gray-700">
                        {day.creditsUsed.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
