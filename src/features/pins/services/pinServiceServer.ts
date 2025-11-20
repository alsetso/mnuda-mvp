import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import type { Pin, PinCategory } from './pinService';

/**
 * Server-side pin service
 * Uses React cache() to deduplicate requests within the same render
 */
export class PinServiceServer {
  /**
   * Get all public pins and user's own pins (if authenticated)
   * For anonymous users, returns only public pins
   * Optionally filter by category IDs (server-side filtering)
   */
  static getAllPins = cache(async (categoryIds?: string[]): Promise<Pin[]> => {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          set() {
            // Server components can't set cookies
          },
          remove() {
            // Server components can't remove cookies
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let query = supabase
      .from('pins')
      .select('*');

    if (user && !authError) {
      // Get user's profile IDs through accounts
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', account.id);

        const profileIds = profiles?.map(p => p.id) || [];
        
        if (profileIds.length > 0) {
          const profileIdFilters = profileIds.map(id => `profile_id.eq.${id}`).join(',');
          query = query.or(`visibility.eq.public,${profileIdFilters}`);
        } else {
          query = query.eq('visibility', 'public');
        }
      } else {
        query = query.eq('visibility', 'public');
      }
    } else {
      // Anonymous users can only see public pins
      query = query.eq('visibility', 'public');
    }

    // Filter by category IDs if provided (server-side filtering)
    // If empty array is passed, return empty result (no categories selected)
    // If undefined, return all pins (no filtering)
    if (categoryIds !== undefined) {
      if (categoryIds.length === 0) {
        // No categories selected, return empty array
        return [];
      }
      query = query.in('category_id', categoryIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pins:', error);
      throw new Error(`Failed to fetch pins: ${error.message}`);
    }

    return data || [];
  });

  /**
   * Get all public pin categories (for map filters)
   */
  static getPublicCategories = cache(async (): Promise<PinCategory[]> => {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          set() {
            // Server components can't set cookies
          },
          remove() {
            // Server components can't remove cookies
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('pins_categories')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching public pin categories:', error);
      throw new Error(`Failed to fetch public categories: ${error.message}`);
    }

    return data || [];
  });
}

