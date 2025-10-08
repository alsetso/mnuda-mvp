import { supabase } from '@/lib/supabase';

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
  featured_image_url?: string;
  author_id?: string;
  reading_time_minutes: number;
  sort_order: number;
}

export interface CreateResourceData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  is_published?: boolean;
  meta_title?: string;
  meta_description?: string;
  featured_image_url?: string;
  reading_time_minutes?: number;
  sort_order?: number;
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  id: string;
}

export interface ResourceFilters {
  category?: string;
  tags?: string[];
  is_published?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ResourcesService {
  private static readonly TABLE_NAME = 'resources';

  /**
   * Get all published resources with optional filtering
   */
  static async getPublishedResources(filters?: ResourceFilters): Promise<HelpArticle[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching published resources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching published resources:', error);
      return [];
    }
  }

  /**
   * Get a single resource by slug
   */
  static async getResourceBySlug(slug: string): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching resource by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching resource by slug:', error);
      return null;
    }
  }

  /**
   * Get a single resource by slug (admin version - includes unpublished)
   */
  static async getResourceBySlugAdmin(slug: string): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching resource by slug (admin):', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching resource by slug (admin):', error);
      return null;
    }
  }

  /**
   * Get all resources (for admin use)
   */
  static async getAllResources(filters?: ResourceFilters): Promise<HelpArticle[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.is_published !== undefined) {
        query = query.eq('is_published', filters.is_published);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all resources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching all resources:', error);
      return [];
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('category')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      const categories = [...new Set((data as Array<{ category: string }>)?.map(item => item.category) || [])];
      return categories.sort();
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get all unique tags
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('tags')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      const allTags = (data as Array<{ tags: string[] }>)?.flatMap(item => item.tags || []) || [];
      const uniqueTags = [...new Set(allTags)];
      return uniqueTags.sort();
    } catch (error) {
      console.error('Unexpected error fetching tags:', error);
      return [];
    }
  }

  /**
   * Increment view count for a resource
   */
  static async incrementViewCount(slug: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('increment_resource_view_count', { resource_slug: slug } as any);

      if (error) {
        console.error('Error incrementing view count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Unexpected error incrementing view count:', error);
      return 0;
    }
  }

  /**
   * Create a new resource
   */
  static async createResource(resourceData: CreateResourceData): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert([resourceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating resource:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating resource:', error);
      return null;
    }
  }

  /**
   * Update an existing resource
   */
  static async updateResource(resourceData: UpdateResourceData): Promise<HelpArticle | null> {
    try {
      const { id, ...updateData } = resourceData;
      
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating resource:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating resource:', error);
      return null;
    }
  }

  /**
   * Delete a resource
   */
  static async deleteResource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting resource:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting resource:', error);
      return false;
    }
  }

  /**
   * Search resources with fuzzy matching
   */
  static async searchResources(query: string, filters?: Omit<ResourceFilters, 'search'>): Promise<HelpArticle[]> {
    try {
      const searchFilters: ResourceFilters = {
        ...filters,
        search: query
      };

      return await this.getPublishedResources(searchFilters);
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  }

  /**
   * Get related resources (simplified - just returns 3 random published articles)
   */
  static async getRelatedResources(slug: string, limit: number = 3): Promise<HelpArticle[]> {
    try {
      // Get random published resources excluding the current one
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('is_published', true)
        .neq('slug', slug)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching related resources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching related resources:', error);
      return [];
    }
  }
}
