'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface FeedStats {
  total_loads: number;
  unique_visitors: number;
  accounts_active: number;
}

type TimePeriod = 24 | 168;

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function FeedStatsCard() {
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(24);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/feed-stats?hours=${timePeriod}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching feed stats:', error);
        // Set default values on error
        setStats({
          total_loads: 0,
          unique_visitors: 0,
          accounts_active: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timePeriod]);

  const toggleTimePeriod = () => {
    setTimePeriod(prev => prev === 24 ? 168 : 24);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-[10px]">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const statsData = stats || {
    total_loads: 0,
    unique_visitors: 0,
    accounts_active: 0,
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-[10px] py-[10px] border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-900">Feed Stats</span>
          </div>
          <button
            onClick={toggleTimePeriod}
            className="p-[10px] rounded-md hover:bg-gray-50 transition-colors group"
            title={timePeriod === 24 ? 'Switch to 7 days' : 'Switch to 24 hours'}
            aria-label={timePeriod === 24 ? 'Switch to 7 days' : 'Switch to 24 hours'}
          >
            <ClockIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
        <div className="mt-0.5">
          <span className="text-[10px] text-gray-400">
            {timePeriod === 24 ? 'Last 24 hours' : 'Last 7 days'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-[10px] py-[10px] space-y-3">
        {/* Visitors (unique) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Visitors</span>
            <span className="text-xs font-medium text-gray-900">
              {formatNumber(statsData.unique_visitors)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Unique visitors</p>
        </div>

        {/* Loads (total views) */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Loads</span>
            <span className="text-xs font-medium text-gray-900">
              {formatNumber(statsData.total_loads)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Total views</p>
        </div>

        {/* Accounts Active */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Accounts Active</span>
            <span className="text-xs font-medium text-gray-900">
              {formatNumber(statsData.accounts_active)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Unique accounts</p>
        </div>
      </div>
    </div>
  );
}

