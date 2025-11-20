import { BaseAdminService } from './baseAdminService';
import { Business, UpdateBusinessData } from '@/features/business/services/businessService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface AdminBusiness extends Business {
  member?: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export class AdminBusinessService extends BaseAdminService<AdminBusiness, never, UpdateBusinessData> {
  protected tableName = 'businesses';

  /**
   * Get all businesses with member information
   */
  async getAllWithDetails(): Promise<AdminBusiness[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get all businesses
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching businesses with details:', error);
        throw new Error(`Failed to fetch businesses: ${error.message}`);
      }

      if (!businesses || businesses.length === 0) {
        return [];
      }

      // Get unique member IDs
      const memberIds = [...new Set(businesses.map((b: any) => b.member_id).filter(Boolean))];

      // Fetch accounts
      const accountsMap = new Map();
      if (memberIds.length > 0) {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, name, email, avatar_url')
          .in('id', memberIds);
        
        accounts?.forEach((account) => {
          accountsMap.set(account.id, account);
        });
      }

      // Combine data
      return businesses.map((business: any) => ({
        ...business,
        member: accountsMap.get(business.member_id),
      }));
    }, 'Get all businesses with details');
  }

  /**
   * Get business by ID with member information
   */
  async getByIdWithDetails(id: string): Promise<AdminBusiness | null> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error?.code === 'PGRST116') {
        return null;
      }

      if (error) {
        console.error('Error fetching business by ID:', error);
        throw new Error(`Failed to fetch business: ${error.message}`);
      }

      if (!business) {
        return null;
      }

      // Fetch account
      const { data: account } = await supabase
        .from('accounts')
        .select('id, name, email, avatar_url')
        .eq('id', business.member_id)
        .single();

      return {
        ...business,
        member: account || undefined,
      };
    }, 'Get business by ID with details');
  }

  /**
   * Get enhanced statistics
   */
  async getStats(): Promise<{
    total: number;
    withWebsite: number;
    withAddress: number;
    byCity: Record<string, number>;
    recent: number; // New businesses in last 7 days
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get total count first
      const { count: total, error: countError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting total businesses count:', countError);
        console.error('User ID:', user.id);
        const errorMsg = countError.message || countError.code || JSON.stringify(countError);
        throw new Error(`Failed to get stats (count): ${errorMsg}`);
      }

      // Get all businesses for detailed stats
      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('website, address_line1, city, created_at');

      if (businessesError) {
        console.error('Error getting businesses for stats:', businessesError);
        console.error('Error code:', businessesError.code);
        console.error('Error message:', businessesError.message);
        console.error('Error details:', businessesError);
        const errorMsg = businessesError.message || businessesError.code || JSON.stringify(businessesError);
        throw new Error(`Failed to get stats: ${errorMsg}`);
      }

      const withWebsite = businesses?.filter(b => b.website).length || 0;
      const withAddress = businesses?.filter(b => b.address_line1).length || 0;

      // Count by city
      const byCity: Record<string, number> = {};
      businesses?.forEach((business) => {
        if (business.city) {
          byCity[business.city] = (byCity[business.city] || 0) + 1;
        }
      });

      // Count recent (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recent = businesses?.filter(b => 
        new Date(b.created_at) >= weekAgo
      ).length || 0;

      return {
        total: total || 0,
        withWebsite,
        withAddress,
        byCity,
        recent,
      };
    }, 'Get business statistics');
  }
}

