'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useApiUsage } from '../hooks/useApiUsage';
import { setApiUsageUpdateCallback } from '../../api/services/apiService';
import { ApiType } from '../services/apiUsageService';

interface ApiUsageContextType {
  apiUsage: ReturnType<typeof useApiUsage>['apiUsage'];
  loading: boolean;
  isConsuming: boolean;
  refreshApiUsage: () => void;
  canMakeRequest: () => boolean;
  canMakeApiRequest: (apiType: ApiType) => boolean;
  recordApiRequest: (apiType?: ApiType) => boolean;
  // Modal functionality
  isCreditsModalOpen: boolean;
  showCreditsModal: () => void;
  hideCreditsModal: () => void;
  checkCreditsAndShowModal: () => boolean;
  creditsRemaining: number;
}

const ApiUsageContext = createContext<ApiUsageContextType | undefined>(undefined);

interface ApiUsageProviderProps {
  children: ReactNode;
}

export function ApiUsageProvider({ children }: ApiUsageProviderProps) {
  const apiUsageHook = useApiUsage();
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const showCreditsModal = useCallback(() => {
    setIsCreditsModalOpen(true);
  }, []);

  const hideCreditsModal = useCallback(() => {
    setIsCreditsModalOpen(false);
  }, []);

  const checkCreditsAndShowModal = useCallback(() => {
    // Never show modal for authenticated users
    if (apiUsageHook.apiUsage?.hasUnlimitedCredits) {
      return true; // Always allow
    }
    
    // Show modal only for anonymous users who hit limit
    if (apiUsageHook.apiUsage?.isLimitReached) {
      showCreditsModal();
      return false; // Block the action
    }
    
    return true; // Allow the action
  }, [apiUsageHook.apiUsage?.isLimitReached, apiUsageHook.apiUsage?.hasUnlimitedCredits, showCreditsModal]);

  // Register the refresh callback with the API service
  useEffect(() => {
    setApiUsageUpdateCallback(apiUsageHook.refreshApiUsage);
    
    // Cleanup on unmount
    return () => {
      setApiUsageUpdateCallback(null);
    };
  }, [apiUsageHook.refreshApiUsage]);

  const contextValue = {
    ...apiUsageHook,
    isCreditsModalOpen,
    showCreditsModal,
    hideCreditsModal,
    checkCreditsAndShowModal,
    creditsRemaining: apiUsageHook.apiUsage?.creditsRemaining || 0,
  };

  return (
    <ApiUsageContext.Provider value={contextValue}>
      {children}
    </ApiUsageContext.Provider>
  );
}

export function useApiUsageContext() {
  const context = useContext(ApiUsageContext);
  if (context === undefined) {
    throw new Error('useApiUsageContext must be used within an ApiUsageProvider');
  }
  return context;
}
