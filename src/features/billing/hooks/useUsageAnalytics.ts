'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

export interface UsageData {
  date: string;
  creditsUsed: number;
  apiCalls: number;
  successRate: number;
}

export interface ApiUsageStats {
  apiType: string;
  apiName: string;
  creditsConsumed: number;
  callCount: number;
  successRate: number;
  averageResponseTime: number;
}

export interface UsageAnalytics {
  dailyUsage: UsageData[];
  apiTypeBreakdown: ApiUsageStats[];
  successRate: number;
  averageResponseTime: number;
  peakUsageHours: number[];
  totalCreditsUsed: number;
  totalApiCalls: number;
}

export function useUsageAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // User data is now handled by the billing portal API

      // Get usage events from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: usageEvents, error: usageError } = await supabase
        .from('usage_events')
        .select(`
          credits_consumed,
          success,
          processing_time_ms,
          created_at,
          api_types!inner(
            api_key,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (usageError) {
        console.error('Error fetching usage events:', usageError);
        setAnalytics({
          dailyUsage: [],
          apiTypeBreakdown: [],
          successRate: 100,
          averageResponseTime: 0,
          peakUsageHours: [],
          totalCreditsUsed: 0,
          totalApiCalls: 0,
        });
        return;
      }

      // Process daily usage data
      const dailyUsageMap = new Map<string, { creditsUsed: number; apiCalls: number; successes: number }>();
      
      usageEvents?.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        const existing = dailyUsageMap.get(date) || { creditsUsed: 0, apiCalls: 0, successes: 0 };
        
        dailyUsageMap.set(date, {
          creditsUsed: existing.creditsUsed + event.credits_consumed,
          apiCalls: existing.apiCalls + 1,
          successes: existing.successes + (event.success ? 1 : 0),
        });
      });

      const dailyUsage: UsageData[] = Array.from(dailyUsageMap.entries()).map(([date, data]) => ({
        date,
        creditsUsed: data.creditsUsed,
        apiCalls: data.apiCalls,
        successRate: data.apiCalls > 0 ? (data.successes / data.apiCalls) * 100 : 0,
      }));

      // Process API type breakdown
      const apiTypeMap = new Map<string, {
        creditsConsumed: number;
        callCount: number;
        successes: number;
        totalResponseTime: number;
      }>();

      usageEvents?.forEach(event => {
        const apiKey = event.api_types.api_key;
        const existing = apiTypeMap.get(apiKey) || {
          creditsConsumed: 0,
          callCount: 0,
          successes: 0,
          totalResponseTime: 0,
        };

        apiTypeMap.set(apiKey, {
          creditsConsumed: existing.creditsConsumed + event.credits_consumed,
          callCount: existing.callCount + 1,
          successes: existing.successes + (event.success ? 1 : 0),
          totalResponseTime: existing.totalResponseTime + (event.processing_time_ms || 0),
        });
      });

      const apiTypeBreakdown: ApiUsageStats[] = Array.from(apiTypeMap.entries()).map(([apiKey, data]) => ({
        apiType: apiKey,
        apiName: usageEvents?.find(e => e.api_types.api_key === apiKey)?.api_types.name || apiKey,
        creditsConsumed: data.creditsConsumed,
        callCount: data.callCount,
        successRate: data.callCount > 0 ? (data.successes / data.callCount) * 100 : 0,
        averageResponseTime: data.callCount > 0 ? data.totalResponseTime / data.callCount : 0,
      }));

      // Calculate overall metrics
      const totalCreditsUsed = usageEvents?.reduce((sum, event) => sum + event.credits_consumed, 0) || 0;
      const totalApiCalls = usageEvents?.length || 0;
      const totalSuccesses = usageEvents?.filter(event => event.success).length || 0;
      const successRate = totalApiCalls > 0 ? (totalSuccesses / totalApiCalls) * 100 : 0;
      const averageResponseTime = usageEvents?.length > 0 
        ? usageEvents.reduce((sum, event) => sum + (event.processing_time_ms || 0), 0) / usageEvents.length 
        : 0;

      // Calculate peak usage hours
      const hourlyUsage = new Array(24).fill(0);
      usageEvents?.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        hourlyUsage[hour] += event.credits_consumed;
      });
      
      const maxUsage = Math.max(...hourlyUsage);
      const peakUsageHours = hourlyUsage
        .map((usage, hour) => ({ hour, usage }))
        .filter(({ usage }) => usage >= maxUsage * 0.8)
        .map(({ hour }) => hour);

      const analytics: UsageAnalytics = {
        dailyUsage,
        apiTypeBreakdown,
        successRate,
        averageResponseTime,
        peakUsageHours,
        totalCreditsUsed,
        totalApiCalls,
      };

      setAnalytics(analytics);
    } catch (err) {
      console.error('Error fetching usage analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageAnalytics();

    // Set up real-time subscription for usage events
    if (user) {
      const subscription = supabase
        .channel('usage_analytics_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'usage_events',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUsageAnalytics();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchUsageAnalytics,
  };
}
