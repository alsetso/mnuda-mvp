/**
 * Admin Components Index
 * 
 * This file exports all admin-related components and utilities
 * for managing the application's admin functionality.
 */

// Resource Management Components
export { default as EditArticleAdminPanel } from './resources/EditArticleAdminPanel';

// Site Management Components
export { AdminPanel } from './site/AdminPanel';

// Admin Context and Providers
export { AdminProvider, useAdminContext, useAdminFeatures } from './contexts/AdminContext';

// Admin Utilities
export { 
  getAdminPermissions, 
  canPerformAction, 
  validateAdminAction,
  getUserRoleInfo,
  ADMIN_ACTIONS 
} from './utils/adminPermissions';

// Admin Configuration
export { getAdminConfig, validateAdminConfig, DEFAULT_ADMIN_CONFIG } from './config/adminConfig';
export type { AdminConfig, BlockType } from './config/adminConfig';
export type { AdminPermissions, AdminAction } from './utils/adminPermissions';

// Admin Hooks and Services
export { useAdmin } from '@/features/auth/hooks/useAdmin';
export { ResourcesService } from '@/features/help/services/resourcesService';
export { AdminSiteMgmtService } from '@/features/shared/services/adminSiteMgmtService';

// Types
export type { HelpArticle, CreateResourceData, UpdateResourceData } from '@/features/help/services/resourcesService';
export type { UseAdminReturn } from '@/features/auth/hooks/useAdmin';
