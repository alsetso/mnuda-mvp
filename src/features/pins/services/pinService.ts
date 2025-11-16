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
  created_at: string;
  updated_at: string;
}

export interface Pin {
  id: string;
  user_id: string;
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
}

export class PinService {
  /**
   * Get all public pins and user's own pins (if authenticated)
   * For anonymous users, returns only public pins
   */
  static async getAllPins(): Promise<Pin[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('pins')
      .select('*');

    if (user) {
      // Authenticated users can see public pins OR their own pins
      query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
    } else {
      // Anonymous users can only see public pins
      query = query.eq('visibility', 'public');
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

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
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
  static async createPin(data: CreatePinData): Promise<Pin> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: pin, error } = await supabase
      .from('pins')
      .insert({
        user_id: user.id,
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

    const { data: pin, error } = await supabase
      .from('pins')
      .update(data)
      .eq('id', pinId)
      .eq('user_id', user.id)
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

    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId)
      .eq('user_id', user.id);

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
      // Authenticated users can see public pins OR their own pins
      query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
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

