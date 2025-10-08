/**
 * Admin Configuration
 * 
 * Central configuration for admin functionality including permissions,
 * feature flags, and system settings.
 */

export interface AdminConfig {
  // Resource Management
  resources: {
    enabled: boolean;
    maxArticlesPerPage: number;
    allowedCategories: string[];
    allowedTags: string[];
    maxContentLength: number;
    autoSaveInterval: number; // in milliseconds
  };
  
  // Site Management
  site: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    premiumFeaturesEnabled: boolean;
    apiErrorBannerEnabled: boolean;
    siteWideNotificationEnabled: boolean;
  };
  
  // Editor Settings
  editor: {
    defaultMode: 'visual' | 'html' | 'markdown';
    supportedModes: ('visual' | 'html' | 'markdown')[];
    blockTypes: BlockType[];
    maxBlocksPerArticle: number;
  };
  
  // Security
  security: {
    requireAdminApproval: boolean;
    maxFileUploadSize: number; // in bytes
    allowedFileTypes: string[];
    sessionTimeout: number; // in minutes
  };
}

export interface BlockType {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  resources: {
    enabled: true,
    maxArticlesPerPage: 50,
    allowedCategories: [
      'Getting Started',
      'Features',
      'Troubleshooting',
      'API',
      'Billing',
      'Account',
      'General'
    ],
    allowedTags: [
      'beginner',
      'advanced',
      'api',
      'billing',
      'account',
      'troubleshooting',
      'feature',
      'update'
    ],
    maxContentLength: 100000, // 100KB
    autoSaveInterval: 30000, // 30 seconds
  },
  
  site: {
    maintenanceMode: false,
    registrationEnabled: true,
    premiumFeaturesEnabled: true,
    apiErrorBannerEnabled: true,
    siteWideNotificationEnabled: false,
  },
  
  editor: {
    defaultMode: 'visual',
    supportedModes: ['visual', 'html', 'markdown'],
    blockTypes: [
      {
        id: 'heading1',
        name: 'Heading 1',
        icon: 'H1',
        description: 'Main page heading',
        enabled: true,
      },
      {
        id: 'heading2',
        name: 'Heading 2',
        icon: 'H2',
        description: 'Section heading',
        enabled: true,
      },
      {
        id: 'heading3',
        name: 'Heading 3',
        icon: 'H3',
        description: 'Subsection heading',
        enabled: true,
      },
      {
        id: 'paragraph',
        name: 'Paragraph',
        icon: 'P',
        description: 'Regular text content',
        enabled: true,
      },
      {
        id: 'quote',
        name: 'Quote',
        icon: '"',
        description: 'Highlighted quote or callout',
        enabled: true,
      },
      {
        id: 'bullet',
        name: 'Bullet List',
        icon: '•',
        description: 'Unordered list items',
        enabled: true,
      },
      {
        id: 'number',
        name: 'Numbered List',
        icon: '1.',
        description: 'Ordered list items',
        enabled: true,
      },
      {
        id: 'divider',
        name: 'Divider',
        icon: '—',
        description: 'Horizontal line separator',
        enabled: true,
      },
    ],
    maxBlocksPerArticle: 1000,
  },
  
  security: {
    requireAdminApproval: false,
    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    sessionTimeout: 480, // 8 hours
  },
};

/**
 * Get admin configuration with environment-specific overrides
 */
export function getAdminConfig(): AdminConfig {
  const config = { ...DEFAULT_ADMIN_CONFIG };
  
  // Environment-specific overrides
  if (process.env.NODE_ENV === 'development') {
    config.security.sessionTimeout = 1440; // 24 hours in dev
    config.resources.autoSaveInterval = 10000; // 10 seconds in dev
  }
  
  if (process.env.NODE_ENV === 'production') {
    config.security.requireAdminApproval = true;
  }
  
  return config;
}

/**
 * Validate admin configuration
 */
export function validateAdminConfig(config: AdminConfig): string[] {
  const errors: string[] = [];
  
  if (config.resources.maxArticlesPerPage <= 0) {
    errors.push('maxArticlesPerPage must be greater than 0');
  }
  
  if (config.resources.maxContentLength <= 0) {
    errors.push('maxContentLength must be greater than 0');
  }
  
  if (config.editor.maxBlocksPerArticle <= 0) {
    errors.push('maxBlocksPerArticle must be greater than 0');
  }
  
  if (config.security.maxFileUploadSize <= 0) {
    errors.push('maxFileUploadSize must be greater than 0');
  }
  
  if (config.security.sessionTimeout <= 0) {
    errors.push('sessionTimeout must be greater than 0');
  }
  
  return errors;
}
