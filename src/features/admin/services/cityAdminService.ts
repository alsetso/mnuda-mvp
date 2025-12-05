import { BaseAdminService } from './baseAdminService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface City {
  id: string;
  name: string;
  population: number;
  county: string;
  lat: number | null;
  lng: number | null;
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  website_url: string | null;
  favorite: boolean;
  view_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCityData {
  name: string;
  population: number;
  county: string;
  lat?: number | null;
  lng?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  website_url?: string | null;
  favorite?: boolean;
}

export interface UpdateCityData {
  name?: string;
  population?: number;
  county?: string;
  lat?: number | null;
  lng?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  website_url?: string | null;
  favorite?: boolean;
}

export class CityAdminService extends BaseAdminService<City, CreateCityData, UpdateCityData> {
  protected tableName = 'cities';

  /**
   * Get all cities with optional ordering
   */
  async getAllCities(orderBy: 'name' | 'population' = 'name'): Promise<City[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order(orderBy === 'name' ? 'name' : 'population', { ascending: orderBy === 'name' });

      if (error) {
        console.error('Error fetching cities:', error);
        throw new Error(`Failed to fetch cities: ${error.message}`);
      }

      return data || [];
    }, 'Get all cities');
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    withCoordinates: number;
    withoutCoordinates: number;
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { count: total, error: totalError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      const { count: withCoordinates, error: coordsError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (coordsError) {
        throw new Error(`Failed to get coordinates count: ${coordsError.message}`);
      }

      return {
        total: total || 0,
        withCoordinates: withCoordinates || 0,
        withoutCoordinates: (total || 0) - (withCoordinates || 0),
      };
    }, 'Get city statistics');
  }
}



