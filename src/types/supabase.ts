export type UserType = 
  | 'free'
  | 'premium'
  | 'admin'
  | 'buyer'
  | 'realtor'
  | 'investor'
  | 'wholesaler'
  | 'owner'
  | 'lender'
  | 'appraiser'
  | 'contractor'
  | 'other';

export type SubscriptionStatus = 
  | 'free'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: UserType;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_tier?: string;
  current_period_end?: string;
  default_payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: UserType;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_tier?: string;
  current_period_end?: string;
  default_payment_method?: string;
}

export interface ProfileUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: UserType;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_tier?: string;
  current_period_end?: string;
  default_payment_method?: string;
  updated_at?: string;
}

// Database schema types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      stripe_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
      };
    };
  };
}
