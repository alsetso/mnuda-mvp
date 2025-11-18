import { createServerClient } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface AdminArticle {
  id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  author_name: string;
  published_at: string | null;
  status: ArticleStatus;
  view_count: number;
  unique_view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleData {
  title: string;
  slug: string;
  description?: string | null;
  content: string;
  author_name?: string;
  status?: ArticleStatus;
  published_at?: string | null;
}

export interface UpdateArticleData {
  title?: string;
  slug?: string;
  description?: string | null;
  content?: string;
  author_name?: string;
  status?: ArticleStatus;
  published_at?: string | null;
}

export class AdminArticleService {
  /**
   * Get all published articles (public)
   */
  static async getPublishedArticles(): Promise<AdminArticle[]> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('admin_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching published articles:', error);
        throw new Error(`Failed to fetch articles: ${error.message}`);
      }

      return data || [];
    }, 'Get published articles');
  }

  /**
   * Get all articles (admin only)
   */
  static async getAllArticles(): Promise<AdminArticle[]> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('admin_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        throw new Error(`Failed to fetch articles: ${error.message}`);
      }

      return data || [];
    }, 'Get all articles');
  }

  /**
   * Get article by ID
   */
  static async getArticleById(id: string): Promise<AdminArticle | null> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('admin_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching article:', error);
        throw new Error(`Failed to fetch article: ${error.message}`);
      }

      return data;
    }, 'Get article by ID');
  }

  /**
   * Get article by slug (public - no auth required)
   */
  static async getArticleBySlug(slug: string): Promise<AdminArticle | null> {
    try {
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('admin_articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching article:', error);
        throw new Error(`Failed to fetch article: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getArticleBySlug:', error);
      throw error;
    }
  }

  /**
   * Create a new article (admin only)
   */
  static async createArticle(data: CreateArticleData): Promise<AdminArticle> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const articleData = {
        ...data,
        created_by: user.id,
        author_name: data.author_name || 'MNUDA Editorial',
        status: data.status || 'draft',
        published_at: data.status === 'published' && !data.published_at 
          ? new Date().toISOString() 
          : data.published_at,
      };

      const { data: article, error } = await supabase
        .from('admin_articles')
        .insert(articleData)
        .select()
        .single();

      if (error) {
        console.error('Error creating article:', error);
        throw new Error(`Failed to create article: ${error.message}`);
      }

      if (!article) {
        throw new Error('Failed to create article: no data returned');
      }

      return article;
    }, 'Create article');
  }

  /**
   * Update an article (admin only)
   */
  static async updateArticle(id: string, data: UpdateArticleData): Promise<AdminArticle> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      // If status is being changed to published and published_at is not set, set it
      const updateData: UpdateArticleData = { ...data };
      if (data.status === 'published' && !data.published_at) {
        const existing = await this.getArticleById(id);
        if (existing && !existing.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data: article, error } = await supabase
        .from('admin_articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating article:', error);
        throw new Error(`Failed to update article: ${error.message}`);
      }

      if (!article) {
        throw new Error('Failed to update article: no data returned');
      }

      return article;
    }, 'Update article');
  }

  /**
   * Delete an article (admin only)
   */
  static async deleteArticle(id: string): Promise<void> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      const { error } = await supabase
        .from('admin_articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        throw new Error(`Failed to delete article: ${error.message}`);
      }
    }, 'Delete article');
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    return withAuthRetry(async () => {
      const supabase = createServerClient();
      
      const { error } = await supabase.rpc('increment_article_view', {
        article_id: id,
      });

      if (error) {
        console.error('Error incrementing view count:', error);
        // Don't throw - this is a non-critical operation
      }
    }, 'Increment view count');
  }
}

