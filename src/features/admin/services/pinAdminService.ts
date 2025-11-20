import { BaseAdminService } from './baseAdminService';
import { Pin, CreatePinData, UpdatePinData } from '@/features/pins/services/pinService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface AdminPin extends Pin {
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  category?: {
    id: string;
    slug: string;
    label: string;
    emoji: string;
  } | null;
}

export class AdminPinService extends BaseAdminService<AdminPin, CreatePinData, UpdatePinData> {
  protected tableName = 'pins';

  /**
   * Get all pins with user and category information
   */
  async getAllWithDetails(): Promise<AdminPin[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get all pins
      const { data: pins, error } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pins with details:', error);
        throw new Error(`Failed to fetch pins: ${error.message}`);
      }

      if (!pins || pins.length === 0) {
        return [];
      }

      // Get unique member IDs and category IDs
      const memberIds = [...new Set(pins.map((p: any) => p.member_id).filter(Boolean))];
      const categoryIds = [...new Set(pins.map((p: any) => p.category_id).filter(Boolean))];

      // Fetch accounts
      const accountsMap = new Map();
      if (memberIds.length > 0) {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, name, email')
          .in('id', memberIds);
        
        accounts?.forEach((account) => {
          accountsMap.set(account.id, {
            id: account.id,
            name: account.name,
            email: account.email,
          });
        });
      }

      // Fetch categories
      const categoriesMap = new Map();
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('pins_categories')
          .select('id, slug, label, emoji')
          .in('id', categoryIds);
        
        categories?.forEach((cat) => {
          categoriesMap.set(cat.id, cat);
        });
      }

      // Combine data
      return pins.map((pin: any) => ({
        ...pin,
        user: accountsMap.get(pin.member_id),
        category: pin.category_id ? categoriesMap.get(pin.category_id) || null : null,
      }));
    }, 'Get all pins with details');
  }

  /**
   * Get pin by ID with user and category information
   */
  async getByIdWithDetails(id: string): Promise<AdminPin | null> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data: pin, error } = await supabase
        .from('pins')
        .select('*')
        .eq('id', id)
        .single();

      if (error?.code === 'PGRST116') {
        return null;
      }

      if (error) {
        console.error('Error fetching pin with details:', error);
        throw new Error(`Failed to fetch pin: ${error.message}`);
      }

      if (!pin) return null;

      // Fetch account
      let user = undefined;
      if (pin.member_id) {
        const { data: account } = await supabase
          .from('accounts')
          .select('id, name, email')
          .eq('id', pin.member_id)
          .single();
        
        if (account) {
          user = {
            id: account.id,
            name: account.name,
            email: account.email,
          };
        }
      }

      // Get category if exists
      let category = null;
      if (pin.category_id) {
        const { data: cat } = await supabase
          .from('pins_categories')
          .select('id, slug, label, emoji')
          .eq('id', pin.category_id)
          .single();
        category = cat || null;
      }

      return {
        ...pin,
        user,
        category,
      };
    }, 'Get pin by ID with details');
  }

  /**
   * Get pins by category
   */
  async getByCategory(categoryId: string): Promise<AdminPin[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pins by category:', error);
        throw new Error(`Failed to fetch pins: ${error.message}`);
      }

      return data || [];
    }, 'Get pins by category');
  }

  /**
   * Get pins by account
   */
  async getByAccount(accountId: string): Promise<AdminPin[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('member_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pins by user:', error);
        throw new Error(`Failed to fetch pins: ${error.message}`);
      }

      return data || [];
    }, 'Get pins by user');
  }

  /**
   * Get enhanced statistics
   */
  async getStats(): Promise<{
    total: number;
    public: number;
    private: number;
    byCategory: Record<string, number>;
    recent: number; // Pins created in last 7 days
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('pins')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      // Get public count
      const { count: publicCount, error: publicError } = await supabase
        .from('pins')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public');

      if (publicError) {
        throw new Error(`Failed to get public count: ${publicError.message}`);
      }

      // Get private count
      const { count: privateCount, error: privateError } = await supabase
        .from('pins')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'private');

      if (privateError) {
        throw new Error(`Failed to get private count: ${privateError.message}`);
      }

      // Get recent count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recent, error: recentError } = await supabase
        .from('pins')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) {
        throw new Error(`Failed to get recent count: ${recentError.message}`);
      }

      // Get counts by category
      const { data: categoryData, error: categoryError } = await supabase
        .from('pins')
        .select('category_id');

      if (categoryError) {
        throw new Error(`Failed to get category data: ${categoryError.message}`);
      }

      const byCategory: Record<string, number> = {};
      categoryData?.forEach((pin) => {
        const catId = pin.category_id || 'uncategorized';
        byCategory[catId] = (byCategory[catId] || 0) + 1;
      });

      return {
        total: total || 0,
        public: publicCount || 0,
        private: privateCount || 0,
        byCategory,
        recent: recent || 0,
      };
    }, 'Get pin statistics');
  }
}

