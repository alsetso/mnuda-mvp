import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';

export type AssetType = 'business' | 'property';

export interface Asset {
  id: string;
  user_id: string;
  type: AssetType;
  name: string;
  description: string | null;
  owned_since: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  type: AssetType;
  name: string;
  description?: string | null;
  owned_since?: string | null;
  value?: number | null;
}

export interface UpdateAssetData {
  type?: AssetType;
  name?: string;
  description?: string | null;
  owned_since?: string | null;
  value?: number | null;
}

export class AssetService {
  /**
   * Get all assets for the current user
   */
  static async getUserAssets(): Promise<Asset[]> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        throw new Error(`Failed to fetch assets: ${error.message}`);
      }

      return data || [];
    }, 'Get user assets');
  }

  /**
   * Get a single asset by ID
   */
  static async getAssetById(assetId: string): Promise<Asset | null> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching asset:', error);
        throw new Error(`Failed to fetch asset: ${error.message}`);
      }

      return data;
    }, 'Get asset by ID');
  }

  /**
   * Create a new asset
   */
  static async createAsset(data: CreateAssetData): Promise<Asset> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          type: data.type,
          name: data.name,
          description: data.description ?? null,
          owned_since: data.owned_since || null,
          value: data.value ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        throw new Error(`Failed to create asset: ${error.message}`);
      }

      return asset;
    }, 'Create asset');
  }

  /**
   * Update an existing asset
   */
  static async updateAsset(assetId: string, data: UpdateAssetData): Promise<Asset> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const cleanedData: UpdateAssetData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key as keyof UpdateAssetData] = value;
        }
      });

      const { data: asset, error } = await supabase
        .from('assets')
        .update(cleanedData)
        .eq('id', assetId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating asset:', error);
        throw new Error(`Failed to update asset: ${error.message}`);
      }

      return asset;
    }, 'Update asset');
  }

  /**
   * Delete an asset
   */
  static async deleteAsset(assetId: string): Promise<void> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting asset:', error);
        throw new Error(`Failed to delete asset: ${error.message}`);
      }
    }, 'Delete asset');
  }
}

