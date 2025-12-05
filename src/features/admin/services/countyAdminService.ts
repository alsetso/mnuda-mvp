import { BaseAdminService } from './baseAdminService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface County {
  id: string;
  name: string;
  population: number;
  area_sq_mi: number;
  polygon: Record<string, any> | null;
  meta_title: string | null;
  meta_description: string | null;
  website_url: string | null;
  other_urls: string[] | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCountyData {
  name: string;
  population: number;
  area_sq_mi: number;
  polygon?: Record<string, any> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  website_url?: string | null;
  other_urls?: string[] | null;
  favorite?: boolean;
}

export interface UpdateCountyData {
  name?: string;
  population?: number;
  area_sq_mi?: number;
  polygon?: Record<string, any> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  website_url?: string | null;
  other_urls?: string[] | null;
  favorite?: boolean;
}

export class CountyAdminService extends BaseAdminService<County, CreateCountyData, UpdateCountyData> {
  protected tableName = 'counties';

  /**
   * Get all counties with optional ordering
   */
  async getAllCounties(orderBy: 'name' | 'population' = 'name'): Promise<County[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order(orderBy === 'name' ? 'name' : 'population', { ascending: orderBy === 'name' });

      if (error) {
        console.error('Error fetching counties:', error);
        throw new Error(`Failed to fetch counties: ${error.message}`);
      }

      return data || [];
    }, 'Get all counties');
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    withPolygon: number;
    withoutPolygon: number;
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { count: total, error: totalError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      const { count: withPolygon, error: polygonError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .not('polygon', 'is', null);

      if (polygonError) {
        throw new Error(`Failed to get polygon count: ${polygonError.message}`);
      }

      return {
        total: total || 0,
        withPolygon: withPolygon || 0,
        withoutPolygon: (total || 0) - (withPolygon || 0),
      };
    }, 'Get county statistics');
  }
}



