import { supabase } from '@/lib/supabase';

export interface MyHome {
  id: string;
  profile_id: string;
  address: string;
  lat: number;
  lng: number;
  nickname: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMyHomeData {
  address: string;
  lat: number;
  lng: number;
  nickname?: string | null;
  notes?: string | null;
}

export interface UpdateMyHomeData {
  address?: string;
  lat?: number;
  lng?: number;
  nickname?: string | null;
  notes?: string | null;
}

export class MyHomesService {
  /**
   * Get all homes for a profile
   */
  static async getHomesByProfile(profileId: string): Promise<MyHome[]> {
    const { data, error } = await supabase
      .from('my_homes')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching homes:', error);
      throw new Error(`Failed to fetch homes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a home by ID
   */
  static async getHomeById(homeId: string): Promise<MyHome | null> {
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
      return null;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', account.id);

    const profileIds = profiles?.map(p => p.id) || [];

    if (profileIds.length === 0) {
      return null;
    }

    const { data, error } = await supabase
      .from('my_homes')
      .select('*')
      .eq('id', homeId)
      .in('profile_id', profileIds)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching home:', error);
      throw new Error(`Failed to fetch home: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new home
   */
  static async createHome(data: CreateMyHomeData, profileId: string): Promise<MyHome> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify the profile belongs to the user before inserting
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .eq('account_id', account.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found or access denied');
    }

    const { data: home, error } = await supabase
      .from('my_homes')
      .insert({
        profile_id: profileId,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        nickname: data.nickname || null,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating home:', error);
      throw new Error(`Failed to create home: ${error.message}`);
    }

    return home;
  }

  /**
   * Create multiple homes (for onboarding)
   */
  static async createHomes(homes: CreateMyHomeData[], profileId: string): Promise<MyHome[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const homesToInsert = homes.map(home => ({
      profile_id: profileId,
      address: home.address,
      lat: home.lat,
      lng: home.lng,
      nickname: home.nickname || null,
      notes: home.notes || null,
    }));

    const { data, error } = await supabase
      .from('my_homes')
      .insert(homesToInsert)
      .select();

    if (error) {
      console.error('Error creating homes:', error);
      throw new Error(`Failed to create homes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a home
   */
  static async updateHome(homeId: string, data: UpdateMyHomeData): Promise<MyHome> {
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

    const { data: home, error } = await supabase
      .from('my_homes')
      .update(data)
      .eq('id', homeId)
      .in('profile_id', profileIds)
      .select()
      .single();

    if (error) {
      console.error('Error updating home:', error);
      throw new Error(`Failed to update home: ${error.message}`);
    }

    if (!home) {
      throw new Error('Home not found or access denied');
    }

    return home;
  }

  /**
   * Delete a home
   */
  static async deleteHome(homeId: string): Promise<void> {
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
      .from('my_homes')
      .delete()
      .eq('id', homeId)
      .in('profile_id', profileIds);

    if (error) {
      console.error('Error deleting home:', error);
      throw new Error(`Failed to delete home: ${error.message}`);
    }
  }
}

