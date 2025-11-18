import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';

export interface Business {
  id: string;
  member_id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessData {
  name: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export interface UpdateBusinessData {
  name?: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export class BusinessService {
  /**
   * Normalize state value to proper format
   * Converts "MN" or "Minnesota" (case-insensitive) to "MN"
   * Returns null for invalid/empty values (database constraint requires 'MN' or NULL)
   */
  private static normalizeState(state: string | null | undefined): string | null {
    if (!state || typeof state !== 'string') return null;
    const normalized = state.trim();
    if (!normalized) return null; // Empty string after trim
    if (normalized.toUpperCase() === 'MN' || normalized.toLowerCase() === 'minnesota') {
      return 'MN';
    }
    // Database constraint only allows 'MN' or NULL, so return null for invalid values
    return null;
  }

  /**
   * Get all businesses for the current user
   */
  static async getUserBusinesses(): Promise<Business[]> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching businesses:', error);
        throw new Error(`Failed to fetch businesses: ${error.message}`);
      }

      return data || [];
    }, 'Get user businesses');
  }

  /**
   * Get a business by ID (owner only - for editing)
   */
  static async getBusinessById(id: string): Promise<Business | null> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .eq('member_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching business:', error);
        throw new Error(`Failed to fetch business: ${error.message}`);
      }

      return data;
    }, 'Get business by ID');
  }

  /**
   * Get a business by ID for public viewing (any authenticated user can view)
   * Returns the business and whether the current user is the owner
   */
  static async getBusinessForViewing(id: string): Promise<{ business: Business | null; isOwner: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { business: null, isOwner: false };
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { business: null, isOwner: false };
        }
        console.error('Error fetching business:', error);
        return { business: null, isOwner: false };
      }

      if (!data) {
        return { business: null, isOwner: false };
      }

      const isOwner = data.member_id === user.id;

      return { business: data, isOwner };
    } catch (error) {
      console.error('Error in getBusinessForViewing:', error);
      return { business: null, isOwner: false };
    }
  }

  /**
   * Create a new business
   */
  static async createBusiness(data: CreateBusinessData): Promise<Business> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Normalize state - must be 'MN' or NULL per database constraint
      const normalizedState = this.normalizeState(data.state);
      
      const businessData = {
        ...data,
        member_id: user.id,
        state: normalizedState ?? 'MN', // Default to 'MN' if null/undefined
      };

      const { data: business, error } = await supabase
        .from('businesses')
        .insert(businessData)
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        throw new Error(`Failed to create business: ${error.message}`);
      }

      if (!business) {
        throw new Error('Failed to create business: no data returned');
      }

      return business;
    }, 'Create business');
  }

  /**
   * Update a business
   */
  static async updateBusiness(id: string, data: UpdateBusinessData): Promise<Business> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Remove undefined values and normalize state
      const cleanedData: UpdateBusinessData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'state') {
            // Normalize state - must be 'MN' or NULL per database constraint
            const normalizedState = this.normalizeState(value as string);
            cleanedData[key as keyof UpdateBusinessData] = normalizedState ?? 'MN';
          } else {
            cleanedData[key as keyof UpdateBusinessData] = value;
          }
        }
      });

      const { data: business, error } = await supabase
        .from('businesses')
        .update(cleanedData)
        .eq('id', id)
        .eq('member_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating business:', error);
        throw new Error(`Failed to update business: ${error.message}`);
      }

      if (!business) {
        throw new Error('Failed to update business: no data returned');
      }

      return business;
    }, 'Update business');
  }

  /**
   * Delete a business
   */
  static async deleteBusiness(id: string): Promise<void> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id)
        .eq('member_id', user.id);

      if (error) {
        console.error('Error deleting business:', error);
        throw new Error(`Failed to delete business: ${error.message}`);
      }
    }, 'Delete business');
  }
}

