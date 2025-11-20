import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

/**
 * Base admin service with common CRUD operations
 * All admin services should extend this class
 * Uses authenticated client to ensure RLS policies can verify admin status
 */
export abstract class BaseAdminService<T, CreateT, UpdateT> {
  protected abstract tableName: string;
  
  /**
   * Get all records (admin only)
   */
  async getAll(): Promise<T[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching all ${this.tableName}:`, error);
        throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
      }
      
      return data || [];
    }, `Get all ${this.tableName}`);
  }
  
  /**
   * Get by ID
   */
  async getById(id: string): Promise<T | null> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error?.code === 'PGRST116') {
        return null;
      }
      
      if (error) {
        console.error(`Error fetching ${this.tableName} by ID:`, error);
        throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
      }
      
      return data;
    }, `Get ${this.tableName} by ID`);
  }
  
  /**
   * Create record
   */
  async create(data: CreateT): Promise<T> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: record, error } = await supabase
        .from(this.tableName)
        .insert({ ...data, created_by: user.id } as any)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating ${this.tableName}:`, error);
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
      }
      
      if (!record) {
        throw new Error(`Failed to create ${this.tableName}: no data returned`);
      }
      
      return record;
    }, `Create ${this.tableName}`);
  }
  
  /**
   * Update record
   */
  async update(id: string, data: UpdateT): Promise<T> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { data: record, error } = await supabase
        .from(this.tableName)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating ${this.tableName}:`, error);
        throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
      }
      
      if (!record) {
        throw new Error(`Failed to update ${this.tableName}: no data returned`);
      }
      
      return record;
    }, `Update ${this.tableName}`);
  }
  
  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting ${this.tableName}:`, error);
        throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
      }
    }, `Delete ${this.tableName}`);
  }
  
  /**
   * Get basic statistics
   */
  async getStats(): Promise<Record<string, number>> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error getting ${this.tableName} stats:`, error);
        throw new Error(`Failed to get ${this.tableName} stats: ${error.message}`);
      }
      
      return { total: count || 0 };
    }, `Get ${this.tableName} stats`);
  }
}

