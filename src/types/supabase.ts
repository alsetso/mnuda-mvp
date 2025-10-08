export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          user_type: 'realtor' | 'investor' | 'wholesaler' | 'buyer' | 'owner' | 'lender' | 'appraiser' | 'contractor' | 'other' | 'admin';
          subscription_status: 'free' | 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          stripe_customer_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          user_type?: 'realtor' | 'investor' | 'wholesaler' | 'buyer' | 'owner' | 'lender' | 'appraiser' | 'contractor' | 'other' | 'admin';
          subscription_status?: 'free' | 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          stripe_customer_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          user_type?: 'realtor' | 'investor' | 'wholesaler' | 'buyer' | 'owner' | 'lender' | 'appraiser' | 'contractor' | 'other' | 'admin';
          subscription_status?: 'free' | 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          stripe_customer_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_public_site_mgmt: {
        Row: {
          id: number;
          api_error_banner_enabled: boolean;
          maintenance_mode_enabled: boolean;
          new_user_registration_enabled: boolean;
          premium_features_enabled: boolean;
          site_wide_notification_enabled: boolean;
          site_wide_notification_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          api_error_banner_enabled?: boolean;
          maintenance_mode_enabled?: boolean;
          new_user_registration_enabled?: boolean;
          premium_features_enabled?: boolean;
          site_wide_notification_enabled?: boolean;
          site_wide_notification_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          api_error_banner_enabled?: boolean;
          maintenance_mode_enabled?: boolean;
          new_user_registration_enabled?: boolean;
          premium_features_enabled?: boolean;
          site_wide_notification_enabled?: boolean;
          site_wide_notification_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserType = 'realtor' | 'investor' | 'wholesaler' | 'buyer' | 'owner' | 'lender' | 'appraiser' | 'contractor' | 'other' | 'admin';
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';

export type AdminSiteMgmt = Database['public']['Tables']['admin_public_site_mgmt']['Row'];
export type AdminSiteMgmtInsert = Database['public']['Tables']['admin_public_site_mgmt']['Insert'];
export type AdminSiteMgmtUpdate = Database['public']['Tables']['admin_public_site_mgmt']['Update'];
