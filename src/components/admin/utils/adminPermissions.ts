/**
 * Admin Permissions Utilities
 * 
 * Centralized permission checking and role-based access control
 * for admin functionality.
 */

import { Profile } from '@/types/supabase';

export interface AdminPermissions {
  canManageResources: boolean;
  canManageSite: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canAccessAdminPanel: boolean;
  canDeleteContent: boolean;
  canPublishContent: boolean;
  canEditPublishedContent: boolean;
}

export type AdminAction = 
  | 'create_resource'
  | 'edit_resource'
  | 'delete_resource'
  | 'publish_resource'
  | 'manage_site'
  | 'view_analytics'
  | 'manage_users'
  | 'access_admin_panel';

/**
 * Check if a user has admin privileges
 */
export function isAdmin(profile: Profile | null): boolean {
  return profile?.user_type === 'admin';
}

/**
 * Get comprehensive admin permissions for a user
 */
export function getAdminPermissions(profile: Profile | null): AdminPermissions {
  const isAdminUser = isAdmin(profile);
  
  return {
    canManageResources: isAdminUser,
    canManageSite: isAdminUser,
    canViewAnalytics: isAdminUser,
    canManageUsers: isAdminUser,
    canAccessAdminPanel: isAdminUser,
    canDeleteContent: isAdminUser,
    canPublishContent: isAdminUser,
    canEditPublishedContent: isAdminUser,
  };
}

/**
 * Check if a user can perform a specific admin action
 */
export function canPerformAction(
  profile: Profile | null, 
  action: AdminAction
): boolean {
  const permissions = getAdminPermissions(profile);
  
  switch (action) {
    case 'create_resource':
    case 'edit_resource':
    case 'delete_resource':
    case 'publish_resource':
      return permissions.canManageResources;
    
    case 'manage_site':
      return permissions.canManageSite;
    
    case 'view_analytics':
      return permissions.canViewAnalytics;
    
    case 'manage_users':
      return permissions.canManageUsers;
    
    case 'access_admin_panel':
      return permissions.canAccessAdminPanel;
    
    default:
      return false;
  }
}

/**
 * Get user role display information
 */
export function getUserRoleInfo(profile: Profile | null): {
  role: string;
  isAdmin: boolean;
  permissions: AdminPermissions;
} {
  const isAdminUser = isAdmin(profile);
  const permissions = getAdminPermissions(profile);
  
  return {
    role: profile?.user_type || 'guest',
    isAdmin: isAdminUser,
    permissions,
  };
}

/**
 * Validate admin action with error handling
 */
export function validateAdminAction(
  profile: Profile | null,
  action: AdminAction
): { allowed: boolean; error?: string } {
  if (!profile) {
    return { allowed: false, error: 'User not authenticated' };
  }
  
  if (!isAdmin(profile)) {
    return { allowed: false, error: 'Insufficient permissions' };
  }
  
  if (!canPerformAction(profile, action)) {
    return { allowed: false, error: 'Action not permitted' };
  }
  
  return { allowed: true };
}

/**
 * Admin action constants for consistent usage
 */
export const ADMIN_ACTIONS = {
  CREATE_RESOURCE: 'create_resource' as const,
  EDIT_RESOURCE: 'edit_resource' as const,
  DELETE_RESOURCE: 'delete_resource' as const,
  PUBLISH_RESOURCE: 'publish_resource' as const,
  MANAGE_SITE: 'manage_site' as const,
  VIEW_ANALYTICS: 'view_analytics' as const,
  MANAGE_USERS: 'manage_users' as const,
  ACCESS_ADMIN_PANEL: 'access_admin_panel' as const,
} as const;
