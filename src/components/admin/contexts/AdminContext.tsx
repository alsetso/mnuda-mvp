'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdmin } from '@/features/auth/hooks/useAdmin';
import { getAdminPermissions, AdminPermissions, AdminAction } from '../utils/adminPermissions';
import { getAdminConfig, AdminConfig } from '../config/adminConfig';

interface AdminContextType {
  // Admin status
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Permissions
  permissions: AdminPermissions;
  canPerformAction: (action: AdminAction) => boolean;
  
  // Configuration
  config: AdminConfig;
  
  // UI State
  isAdminPanelOpen: boolean;
  setAdminPanelOpen: (open: boolean) => void;
  
  // Actions
  refreshAdminStatus: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { isAdmin, isLoading, error, profile } = useAdmin();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Get permissions and config
  const permissions = getAdminPermissions(profile);
  const config = getAdminConfig();
  
  // Check if user can perform specific actions
  const canPerformAction = (): boolean => {
    // For now, all admin actions require admin access
    // In the future, this could be more granular based on the specific action
    return permissions.canAccessAdminPanel && isAdmin;
  };
  
  // Refresh admin status (useful for after role changes)
  const refreshAdminStatus = () => {
    // The useAdmin hook will automatically refresh when dependencies change
    window.location.reload(); // Simple refresh for now
  };
  
  // Auto-close admin panel when user loses admin status
  useEffect(() => {
    if (!isAdmin && isAdminPanelOpen) {
      setIsAdminPanelOpen(false);
    }
  }, [isAdmin, isAdminPanelOpen]);
  
  const value: AdminContextType = {
    isAdmin,
    isLoading,
    error,
    permissions,
    canPerformAction,
    config,
    isAdminPanelOpen,
    setAdminPanelOpen: setIsAdminPanelOpen,
    refreshAdminStatus,
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

/**
 * Hook to use admin context
 */
export function useAdminContext(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}

/**
 * Hook for admin-specific functionality
 */
export function useAdminFeatures() {
  const { isAdmin, permissions, config, canPerformAction } = useAdminContext();
  
  return {
    isAdmin,
    permissions,
    config,
    canPerformAction,
    
    // Convenience methods
    canManageResources: permissions.canManageResources,
    canManageSite: permissions.canManageSite,
    canDeleteContent: permissions.canDeleteContent,
    canPublishContent: permissions.canPublishContent,
  };
}
