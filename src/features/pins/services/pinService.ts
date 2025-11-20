import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';

export interface PinCategory {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pin {
  id: string;
  profile_id: string | null;
  emoji: string;
  name: string;
  visibility: 'public' | 'private';
  description: string | null;
  address: string;
  lat: number;
  long: number;
  category_id: string | null;
  subcategory: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePinData {
  emoji: string;
  name: string;
  visibility?: 'public' | 'private';
  description?: string | null;
  address: string;
  lat: number;
  long: number;
  category_id?: string | null;
  subcategory?: string | null;
}

export interface UpdatePinData {
  emoji?: string;
  name?: string;
  visibility?: 'public' | 'private';
  description?: string | null;
  address?: string;
  lat?: number;
  long?: number;
  category_id?: string | null;
  subcategory?: string | null;
}

export class PinCategoryService {
  /**
   * Get all active pin categories
   */
  static async getCategories(): Promise<PinCategory[]> {
    const { data, error } = await supabase
      .from('pins_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching pin categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all public pin categories (for map filters)
   * Optionally filter by profile_type by checking pins table access_list
   */
  static async getPublicCategories(profileType?: string): Promise<PinCategory[]> {
    const { data, error } = await supabase
      .from('pins_categories')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching public pin categories:', error);
      throw new Error(`Failed to fetch public categories: ${error.message}`);
    }

    if (!profileType || !data) {
      return data || [];
    }

    // If profile_type is provided, filter categories based on pins table access_list
    // Get all pins and their access_list to determine which categories are accessible
    const { data: pinsData } = await supabase
      .from('pins')
      .select('slug, category, access_list')
      .eq('status', 'active');

    if (!pinsData) {
      return data || [];
    }

    // Create a map of category -> has accessible pins
    const categoryAccessMap = new Map<string, boolean>();
    
    pinsData.forEach(pin => {
      const category = pin.category;
      const accessList = pin.access_list || [];
      // If access_list is empty, it's accessible to all
      const isAccessible = accessList.length === 0 || accessList.includes(accountType);
      
      if (!categoryAccessMap.has(category)) {
        categoryAccessMap.set(category, false);
      }
      if (isAccessible) {
        categoryAccessMap.set(category, true);
      }
    });

    // Filter categories: only include if at least one pin in that category is accessible
    return data.filter(cat => {
      // Map category slug to pin category enum value
      const categoryMap: Record<string, string> = {
        'project': 'project',
        'listing': 'property',
        'public_concern': 'concern',
      };
      const pinCategory = categoryMap[cat.slug];
      if (!pinCategory) return true; // Unknown category, allow it
      
      const hasAccess = categoryAccessMap.get(pinCategory);
      return hasAccess !== false; // Allow if true or undefined (no pins found)
    });
  }

  /**
   * Get all pin categories (including inactive ones)
   */
  static async getAllCategories(): Promise<PinCategory[]> {
    const { data, error } = await supabase
      .from('pins_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('is_active', { ascending: false }); // Active categories first

    if (error) {
      console.error('Error fetching all pin categories:', error);
      throw new Error(`Failed to fetch all categories: ${error.message}`);
    }

    return data || [];
  }
}

export class PinService {
  /**
   * Get all public pins and user's own pins (if authenticated)
   * For anonymous users, returns only public pins
   * Optionally filter by category IDs (server-side filtering)
   */
  static async getAllPins(categoryIds?: string[]): Promise<Pin[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('pins')
      .select('*');

    if (user) {
      // Get user's profile IDs through accounts
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', account.id);

        const profileIds = profiles?.map(p => p.id) || [];
        
        if (profileIds.length > 0) {
          // Authenticated users can see public pins OR their own pins (by profile_id)
          const profileIdFilters = profileIds.map(id => `profile_id.eq.${id}`).join(',');
          query = query.or(`visibility.eq.public,${profileIdFilters}`);
        } else {
          // No profiles, only public pins
          query = query.eq('visibility', 'public');
        }
      } else {
        // No account, only public pins
        query = query.eq('visibility', 'public');
      }
    } else {
      // Anonymous users can only see public pins
      query = query.eq('visibility', 'public');
    }

    // Filter by category IDs if provided (server-side filtering)
    // If empty array is passed, return empty result (no categories selected)
    // If undefined, return all pins (no filtering)
    if (categoryIds !== undefined) {
      if (categoryIds.length === 0) {
        // No categories selected, return empty array
        return [];
      }
      query = query.in('category_id', categoryIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pins:', error);
      throw new Error(`Failed to fetch pins: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's own pins
   */
  static async getUserPins(): Promise<Pin[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile IDs through accounts
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return [];
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', account.id);

    const profileIds = profiles?.map(p => p.id) || [];
    
    if (profileIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user pins:', error);
      throw new Error(`Failed to fetch user pins: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new pin
   */
  static async createPin(data: CreatePinData, profileId?: string): Promise<Pin> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get profile_id if not provided
    let pinProfileId = profileId;
    if (!pinProfileId) {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', account.id)
          .limit(1)
          .single();

        pinProfileId = profile?.id || null;
      }
    }

    const { data: pin, error } = await supabase
      .from('pins')
      .insert({
        profile_id: pinProfileId,
        emoji: data.emoji,
        name: data.name,
        visibility: data.visibility || 'public',
        description: data.description || null,
        address: data.address,
        lat: data.lat,
        long: data.long,
        category_id: data.category_id || null,
        subcategory: data.subcategory || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pin:', error);
      throw new Error(`Failed to create pin: ${error.message}`);
    }

    return pin;
  }

  /**
   * Update a pin
   */
  static async updatePin(pinId: string, data: UpdatePinData): Promise<Pin> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile IDs
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', account.id);

    const profileIds = profiles?.map(p => p.id) || [];
    
    if (profileIds.length === 0) {
      throw new Error('No profiles found');
    }

    const { data: pin, error } = await supabase
      .from('pins')
      .update(data)
      .eq('id', pinId)
      .in('profile_id', profileIds)
      .select()
      .single();

    if (error) {
      console.error('Error updating pin:', error);
      throw new Error(`Failed to update pin: ${error.message}`);
    }

    if (!pin) {
      throw new Error('Pin not found or access denied');
    }

    return pin;
  }

  /**
   * Delete a pin
   */
  static async deletePin(pinId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile IDs
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', account.id);

    const profileIds = profiles?.map(p => p.id) || [];
    
    if (profileIds.length === 0) {
      throw new Error('No profiles found');
    }

    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId)
      .in('profile_id', profileIds);

    if (error) {
      console.error('Error deleting pin:', error);
      throw new Error(`Failed to delete pin: ${error.message}`);
    }
  }

  /**
   * Get a pin by ID
   * For anonymous users, returns pin only if it's public
   */
  static async getPinById(pinId: string): Promise<Pin | null> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('pins')
      .select('*')
      .eq('id', pinId);

    if (user) {
      // Get user's profile IDs
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', account.id);

        const profileIds = profiles?.map(p => p.id) || [];
        
        if (profileIds.length > 0) {
          const profileIdFilters = profileIds.map(id => `profile_id.eq.${id}`).join(',');
          query = query.or(`visibility.eq.public,${profileIdFilters}`);
        } else {
          query = query.eq('visibility', 'public');
        }
      } else {
        query = query.eq('visibility', 'public');
      }
    } else {
      // Anonymous users can only see public pins
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching pin:', error);
      throw new Error(`Failed to fetch pin: ${error.message}`);
    }

    return data;
  }
}

