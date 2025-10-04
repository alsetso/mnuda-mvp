import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminSiteMgmt, AdminSiteMgmtUpdate, AdminSiteMgmtInsert } from '@/types/supabase';

/**
 * Service for managing site-wide admin configuration
 * This table is public and has no RLS, making it accessible to all users
 */
export class AdminSiteMgmtService {
  private static readonly TABLE_NAME = 'admin_public_site_mgmt';
  private static readonly SINGLE_RECORD_ID = 1;

  /**
   * Get the current site management configuration
   * Returns the single row record with all admin flags
   */
  static async getSiteConfig(): Promise<AdminSiteMgmt | null> {
    try {
      const { data, error } = await supabase
        .from('admin_public_site_mgmt')
        .select('*')
        .eq('id', this.SINGLE_RECORD_ID)
        .single();

      if (error) {
        console.error('Error fetching site config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching site config:', error);
      return null;
    }
  }

  /**
   * Update site management configuration
   * Only updates the single row record
   */
  static async updateSiteConfig(updates: AdminSiteMgmtUpdate): Promise<AdminSiteMgmt | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('admin_public_site_mgmt')
        .update(updateData as never)
        .eq('id', this.SINGLE_RECORD_ID)
        .select()
        .single();

      if (error) {
        console.error('Error updating site config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating site config:', error);
      return null;
    }
  }

  /**
   * Initialize the admin table with default values
   * This should be run once to create the initial record
   */
  static async initializeSiteConfig(): Promise<AdminSiteMgmt | null> {
    try {
      const defaultConfig = {
        id: this.SINGLE_RECORD_ID,
        api_error_banner_enabled: false,
        maintenance_mode_enabled: false,
        new_user_registration_enabled: true,
        premium_features_enabled: true,
        site_wide_notification_enabled: false,
        site_wide_notification_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('admin_public_site_mgmt')
        .insert(defaultConfig as never)
        .select()
        .single();

      if (error) {
        console.error('Error initializing site config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error initializing site config:', error);
      return null;
    }
  }

  /**
   * Toggle specific admin flags
   */
  static async toggleApiErrorBanner(enabled: boolean): Promise<AdminSiteMgmt | null> {
    return this.updateSiteConfig({ api_error_banner_enabled: enabled });
  }

  static async toggleMaintenanceMode(enabled: boolean): Promise<AdminSiteMgmt | null> {
    return this.updateSiteConfig({ maintenance_mode_enabled: enabled });
  }

  static async toggleNewUserRegistration(enabled: boolean): Promise<AdminSiteMgmt | null> {
    return this.updateSiteConfig({ new_user_registration_enabled: enabled });
  }

  static async togglePremiumFeatures(enabled: boolean): Promise<AdminSiteMgmt | null> {
    return this.updateSiteConfig({ premium_features_enabled: enabled });
  }

  static async toggleSiteWideNotification(enabled: boolean, message?: string): Promise<AdminSiteMgmt | null> {
    return this.updateSiteConfig({ 
      site_wide_notification_enabled: enabled,
      site_wide_notification_message: message || null,
    });
  }
}

/**
 * React hook for using site configuration
 * Provides real-time updates when configuration changes
 */
export const useSiteConfig = () => {
  const [config, setConfig] = useState<AdminSiteMgmt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const siteConfig = await AdminSiteMgmtService.getSiteConfig();
        setConfig(siteConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch site config');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_site_mgmt_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_public_site_mgmt',
        },
        (payload) => {
          if (payload.new) {
            setConfig(payload.new as AdminSiteMgmt);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { config, loading, error };
};

