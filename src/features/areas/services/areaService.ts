import { supabase } from '@/lib/supabase';

export type AreaCategory = 'custom' | 'county' | 'city' | 'state' | 'region' | 'zipcode';

export interface Area {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  category: AreaCategory;
  geometry: GeoJSON.Geometry; // GeoJSON Polygon or MultiPolygon
  created_at: string;
  updated_at: string;
}

export interface CreateAreaData {
  name: string;
  description?: string | null;
  visibility?: 'public' | 'private';
  category?: AreaCategory;
  geometry: GeoJSON.Geometry; // GeoJSON Polygon or MultiPolygon
}

export interface UpdateAreaData {
  name?: string;
  description?: string | null;
  visibility?: 'public' | 'private';
  category?: AreaCategory;
  geometry?: GeoJSON.Geometry;
}

export class AreaService {
  /**
   * Get all public areas and user's own areas (if authenticated)
   * For anonymous users, returns only public areas
   */
  static async getAllAreas(): Promise<Area[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('areas')
      .select('*');

    if (user) {
      // Authenticated users can see public areas OR their own areas
      query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
    } else {
      // Anonymous users can only see public areas
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching areas:', error);
      throw new Error(`Failed to fetch areas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's own areas
   */
  static async getUserAreas(): Promise<Area[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user areas:', error);
      throw new Error(`Failed to fetch user areas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new area
   */
  static async createArea(data: CreateAreaData): Promise<Area> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate geometry
    if (!data.geometry || (data.geometry.type !== 'Polygon' && data.geometry.type !== 'MultiPolygon')) {
      throw new Error('Geometry must be a Polygon or MultiPolygon');
    }

    const { data: area, error } = await supabase
      .from('areas')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        visibility: data.visibility || 'public',
        category: data.category || 'custom',
        geometry: data.geometry as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating area:', error);
      throw new Error(`Failed to create area: ${error.message}`);
    }

    return area;
  }

  /**
   * Update an area
   */
  static async updateArea(areaId: string, data: UpdateAreaData): Promise<Area> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.geometry !== undefined) {
      if (data.geometry.type !== 'Polygon' && data.geometry.type !== 'MultiPolygon') {
        throw new Error('Geometry must be a Polygon or MultiPolygon');
      }
      updateData.geometry = data.geometry as unknown as Record<string, unknown>;
    }

    const { data: area, error } = await supabase
      .from('areas')
      .update(updateData)
      .eq('id', areaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating area:', error);
      throw new Error(`Failed to update area: ${error.message}`);
    }

    if (!area) {
      throw new Error('Area not found or access denied');
    }

    return area;
  }

  /**
   * Delete an area
   */
  static async deleteArea(areaId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', areaId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting area:', error);
      throw new Error(`Failed to delete area: ${error.message}`);
    }
  }

  /**
   * Get an area by ID
   * For anonymous users, returns area only if it's public
   */
  static async getAreaById(areaId: string): Promise<Area | null> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('areas')
      .select('*')
      .eq('id', areaId);

    if (user) {
      // Authenticated users can see public areas OR their own areas
      query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
    } else {
      // Anonymous users can only see public areas
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching area:', error);
      throw new Error(`Failed to fetch area: ${error.message}`);
    }

    return data;
  }
}

