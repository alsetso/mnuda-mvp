import { supabase } from '@/lib/supabase';
import { Profile, ProfileInsert, ProfileUpdate, UserType, SubscriptionStatus } from '@/types/supabase';

export class ProfileService {
  /**
   * Get the current user's profile
   */
  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }

  /**
   * Get a profile by user ID
   */
  static async getProfileById(userId: string): Promise<Profile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile by ID:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting profile by ID:', error);
      return null;
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData: ProfileInsert): Promise<Profile | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Update a profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateCurrentProfile(updates: ProfileUpdate): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      return await this.updateProfile(user.id, updates);
    } catch (error) {
      console.error('Error updating current profile:', error);
      throw error;
    }
  }

  /**
   * Delete a profile (and associated user)
   */
  static async deleteProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Check if a profile exists for the current user
   */
  static async profileExists(): Promise<boolean> {
    try {
      const profile = await this.getCurrentProfile();
      return profile !== null;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }

  /**
   * Ensure a profile exists for the current user, create if it doesn't
   */
  static async ensureProfileExists(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      let profile = await this.getCurrentProfile();
      
      if (!profile) {
        // Create profile with basic info from auth user
        const profileData: ProfileInsert = {
          id: user.id,
          email: user.email!,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          phone: user.user_metadata?.phone || null,
          user_type: (user.user_metadata?.user_type as UserType) || 'buyer',
          subscription_status: (user.user_metadata?.subscription_status as SubscriptionStatus) || 'free',
        };
        
        profile = await this.createProfile(profileData);
      }

      return profile;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      return null;
    }
  }

  /**
   * Get user's full name (combines first_name and last_name)
   */
  static getFullName(profile: Profile): string {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  /**
   * Get user's display name (first name or full name)
   */
  static getDisplayName(profile: Profile): string {
    return profile.first_name || this.getFullName(profile) || 'User';
  }

  /**
   * Check if user has a specific user type
   */
  static hasUserType(profile: Profile, userType: UserType): boolean {
    return profile.user_type === userType;
  }

  /**
   * Check if user has a specific subscription status
   */
  static hasSubscriptionStatus(profile: Profile, status: SubscriptionStatus): boolean {
    return profile.subscription_status === status;
  }

  /**
   * Check if user has an active subscription
   */
  static hasActiveSubscription(profile: Profile): boolean {
    return ['active', 'trialing'].includes(profile.subscription_status);
  }

  /**
   * Check if user is a realtor
   */
  static isRealtor(profile: Profile): boolean {
    return this.hasUserType(profile, 'realtor');
  }

  /**
   * Check if user is an investor
   */
  static isInvestor(profile: Profile): boolean {
    return this.hasUserType(profile, 'investor');
  }

  /**
   * Check if user is a wholesaler
   */
  static isWholesaler(profile: Profile): boolean {
    return this.hasUserType(profile, 'wholesaler');
  }

  /**
   * Check if user is a buyer
   */
  static isBuyer(profile: Profile): boolean {
    return this.hasUserType(profile, 'buyer');
  }

  /**
   * Check if user is an admin
   */
  static isAdmin(profile: Profile): boolean {
    return this.hasUserType(profile, 'admin');
  }

  /**
   * Get all users with a specific user type
   */
  static async getUsersByType(userType: UserType): Promise<Profile[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', userType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users by type:', error);
        return [];
      }

      return profiles || [];
    } catch (error) {
      console.error('Error getting users by type:', error);
      return [];
    }
  }

  /**
   * Get all users with a specific subscription status
   */
  static async getUsersBySubscriptionStatus(status: SubscriptionStatus): Promise<Profile[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('subscription_status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users by subscription status:', error);
        return [];
      }

      return profiles || [];
    } catch (error) {
      console.error('Error getting users by subscription status:', error);
      return [];
    }
  }

  /**
   * Update user type
   */
  static async updateUserType(userId: string, newUserType: UserType): Promise<Profile | null> {
    try {
      return await this.updateProfile(userId, { user_type: newUserType });
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(userId: string, newStatus: SubscriptionStatus): Promise<Profile | null> {
    try {
      return await this.updateProfile(userId, { subscription_status: newStatus });
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Update Stripe customer ID
   */
  static async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<Profile | null> {
    try {
      return await this.updateProfile(userId, { stripe_customer_id: stripeCustomerId });
    } catch (error) {
      console.error('Error updating Stripe customer ID:', error);
      throw error;
    }
  }

  /**
   * Get profile by Stripe customer ID
   */
  static async getProfileByStripeCustomerId(stripeCustomerId: string): Promise<Profile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (error) {
        console.error('Error fetching profile by Stripe customer ID:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting profile by Stripe customer ID:', error);
      return null;
    }
  }
}
