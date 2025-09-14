import { supabase } from './supabase';
import { Pin, CreatePinData } from '@/types/pin';

export class PinService {
  /**
   * Create a new pin
   * Simple, production-ready implementation
   */
  static async createPin(pinData: CreatePinData): Promise<Pin> {
    try {
      // Simple session check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Please log in to save pins');
      }

      // Insert pin with user_id manually set
      const { data, error } = await supabase
        .from('pins')
        .insert([{
          ...pinData,
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Pin creation error:', error);
        throw new Error(`Failed to save pin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating pin:', error);
      throw error;
    }
  }

  /**
   * Get all pins for the current authenticated user
   */
  static async getPins(): Promise<Pin[]> {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Please log in to view pins');
      }

      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pins: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pins:', error);
      throw error;
    }
  }

  /**
   * Get pins by specific user ID (for admin purposes)
   */
  static async getPinsByUserId(userId: string): Promise<Pin[]> {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pins for user: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pins by user ID:', error);
      throw error;
    }
  }

  /**
   * Get a pin by ID
   */
  static async getPinById(id: string): Promise<Pin | null> {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Pin not found
        }
        throw new Error(`Failed to fetch pin: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching pin by ID:', error);
      throw error;
    }
  }

  /**
   * Update a pin
   */
  static async updatePin(id: string, updates: Partial<CreatePinData>): Promise<Pin> {
    try {
      const { data, error } = await supabase
        .from('pins')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update pin: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from pin update');
      }

      return data;
    } catch (error) {
      console.error('Error updating pin:', error);
      throw error;
    }
  }

  /**
   * Delete a pin
   */
  static async deletePin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete pin: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      throw error;
    }
  }

  /**
   * Search pins by name or address
   */
  static async searchPins(query: string): Promise<Pin[]> {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .or(`name.ilike.%${query}%,full_address.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search pins: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching pins:', error);
      throw error;
    }
  }

  /**
   * Get pins within a radius of a location
   */
  static async getPinsNearLocation(
    lat: number, 
    lng: number, 
    radiusKm: number = 10
  ): Promise<Pin[]> {
    try {
      // TODO: Implement radius-based filtering
      // For now, return all pins (this is a placeholder implementation)
      console.log(`Getting pins near ${lat}, ${lng} within ${radiusKm}km radius`);
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch nearby pins: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching nearby pins:', error);
      throw error;
    }
  }
}
