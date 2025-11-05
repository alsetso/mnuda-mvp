import { supabase } from '@/lib/supabase';

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
}

export interface UpdatePinData {
  emoji?: string;
  name?: string;
  visibility?: 'public' | 'private';
  description?: string | null;
  address?: string;
  lat?: number;
  long?: number;
}

export class PinService {
  /**
   * Get all public pins and user's own pins
   */
  static async getAllPins(): Promise<Pin[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

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
   */
  static async getPinById(pinId: string): Promise<Pin | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .eq('id', pinId)
      .or(`visibility.eq.public,user_id.eq.${user.id}`)
      .single();

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

