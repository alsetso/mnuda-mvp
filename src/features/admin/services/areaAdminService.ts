import { BaseAdminService } from './baseAdminService';
import { Area, CreateAreaData, UpdateAreaData } from '@/features/areas/services/areaService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface AdminArea extends Area {
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export class AdminAreaService extends BaseAdminService<AdminArea, CreateAreaData, UpdateAreaData> {
  protected tableName = 'areas';

  /**
   * Get all areas with user information
   */
  async getAllWithDetails(): Promise<AdminArea[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get all areas
      const { data: areas, error } = await supabase
        .from('areas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching areas with details:', error);
        throw new Error(`Failed to fetch areas: ${error.message}`);
      }

      if (!areas || areas.length === 0) {
        return [];
      }

      // Get unique profile IDs
      const profileIds = [...new Set(areas.map((a: any) => a.profile_id).filter(Boolean))];

      // Fetch profiles and accounts
      const accountsMap = new Map();
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, account_id, accounts!inner(id, first_name, last_name, email)')
          .in('id', profileIds);
        
        profiles?.forEach((profile: any) => {
          const account = profile.accounts;
          if (account) {
            accountsMap.set(profile.id, {
              id: account.id,
              name: account.first_name && account.last_name 
                ? `${account.first_name} ${account.last_name}`.trim()
                : account.first_name || account.last_name || account.email || profile.username || 'Unknown',
              email: account.email,
            });
          }
        });
      }

      // Combine data
      return areas.map((area: any) => ({
        ...area,
        user: accountsMap.get(area.profile_id),
      }));
    }, 'Get all areas with details');
  }

  /**
   * Get area by ID with user information
   */
  async getByIdWithDetails(id: string): Promise<AdminArea | null> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data: area, error } = await supabase
        .from('areas')
        .select('*')
        .eq('id', id)
        .single();

      if (error?.code === 'PGRST116') {
        return null;
      }

      if (error) {
        console.error('Error fetching area with details:', error);
        throw new Error(`Failed to fetch area: ${error.message}`);
      }

      if (!area) return null;

      // Fetch account via profile_id
      let user = undefined;
      if (area.profile_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, account_id, accounts!inner(id, first_name, last_name, email)')
          .eq('id', area.profile_id)
          .single();
        
        if (profile && profile.accounts) {
          const account = profile.accounts;
          user = {
            id: account.id,
            name: account.first_name && account.last_name 
              ? `${account.first_name} ${account.last_name}`.trim()
              : account.first_name || account.last_name || account.email || profile.username || 'Unknown',
            email: account.email,
          };
        }
      }

      return {
        ...area,
        user,
      };
    }, 'Get area by ID with details');
  }

  /**
   * Get areas by account
   */
  async getByAccount(accountId: string): Promise<AdminArea[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get profile IDs from account first, then query areas
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('account_id', accountId);

      if (!profiles || profiles.length === 0) {
        return [];
      }

      const profileIds = profiles.map(p => p.id);

      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .in('profile_id', profileIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching areas by user:', error);
        throw new Error(`Failed to fetch areas: ${error.message}`);
      }

      return data || [];
    }, 'Get areas by user');
  }

  /**
   * Get enhanced statistics
   */
  async getStats(): Promise<{
    total: number;
    public: number;
    private: number;
    recent: number; // Areas created in last 7 days
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      // Get public count
      const { count: publicCount, error: publicError } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public');

      if (publicError) {
        throw new Error(`Failed to get public count: ${publicError.message}`);
      }

      // Get private count
      const { count: privateCount, error: privateError } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'private');

      if (privateError) {
        throw new Error(`Failed to get private count: ${privateError.message}`);
      }

      // Get recent count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recent, error: recentError } = await supabase
        .from('areas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) {
        throw new Error(`Failed to get recent count: ${recentError.message}`);
      }

      return {
        total: total || 0,
        public: publicCount || 0,
        private: privateCount || 0,
        recent: recent || 0,
      };
    }, 'Get area statistics');
  }
}

