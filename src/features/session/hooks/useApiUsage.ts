'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUsageService, ApiUsageState, ApiType } from '../services/apiUsageService';
import { useAuth } from '@/features/auth';

export function useApiUsage() {
  const [apiUsage, setApiUsage] = useState<ApiUsageState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const { user } = useAuth();

  const loadApiUsageData = useCallback(async () => {
    setLoading(true);
    try {
      // Update authentication state in the service
      apiUsageService.setAuthenticationState(!!user);
      const usage = apiUsageService.getUsageState();
      setApiUsage(usage);
    } catch (error) {
      console.error('Error loading API usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshApiUsage = useCallback(() => {
    loadApiUsageData();
  }, [loadApiUsageData]);

  const canMakeRequest = useCallback(() => {
    return apiUsageService.canMakeRequest();
  }, []);

  const canMakeApiRequest = useCallback((apiType: ApiType) => {
    return apiUsageService.canMakeApiRequest(apiType);
  }, []);

  const recordApiRequest = useCallback((apiType?: ApiType) => {
    setIsConsuming(true);
    const recorded = apiType 
      ? apiUsageService.recordApiRequest(apiType)
      : apiUsageService.recordApiRequestLegacy();
    if (recorded) {
      // Immediately refresh the usage data to reflect the change
      loadApiUsageData();
    }
    // Reset consuming state after a short delay
    setTimeout(() => setIsConsuming(false), 1000);
    return recorded;
  }, [loadApiUsageData]);

  // Load initial data and sync auth state immediately
  useEffect(() => {
    // Immediately sync auth state when user changes
    apiUsageService.setAuthenticationState(!!user);
    loadApiUsageData();
  }, [user, loadApiUsageData]);

  // Set up periodic refresh to handle day changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadApiUsageData();
    }, 60000); // Check every minute for day changes

    return () => clearInterval(interval);
  }, [loadApiUsageData]);

  return {
    apiUsage,
    loading,
    isConsuming,
    refreshApiUsage,
    canMakeRequest,
    canMakeApiRequest,
    recordApiRequest,
  };
}
