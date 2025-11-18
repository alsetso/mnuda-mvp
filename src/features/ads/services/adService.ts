import { supabase } from '@/lib/supabase';
import type { Ad, CreateAdData, UpdateAdData } from '../types';

export class AdService {
  /**
   * Get all active ads for a specific placement and article
   */
  static async getActiveAds(
    placement: 'article_left' | 'article_right',
    articleSlug?: string | null,
    limit: number = 5
  ): Promise<Ad[]> {
    const now = new Date().toISOString();
    
    // Build query with limit applied in database for performance
    // Note: We fetch slightly more than limit to account for date filtering
    const fetchLimit = limit * 2; // Fetch 2x to account for date filtering
    
    let query = supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .or(`placement.eq.${placement},placement.eq.article_both`)
      .order('created_at', { ascending: false })
      .limit(fetchLimit); // Apply limit in database for performance

    // Filter by article slug if provided, or get ads that target all articles
    if (articleSlug) {
      query = query.or(`target_article_slug.is.null,target_article_slug.eq.${articleSlug}`);
    } else {
      query = query.is('target_article_slug', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active ads:', error);
      throw new Error(`Failed to fetch ads: ${error.message}`);
    }

    // Filter by date range in JavaScript (since Supabase OR with date conditions is complex)
    let filtered = (data || []).filter(ad => {
      const startValid = !ad.start_date || new Date(ad.start_date) <= new Date(now);
      const endValid = !ad.end_date || new Date(ad.end_date) >= new Date(now);
      return startValid && endValid;
    });

    // Apply final limit after date filtering
    return filtered.slice(0, limit);
  }

  /**
   * Get user's ads (both direct ads and ads via their businesses)
   */
  static async getUserAds(): Promise<Ad[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's businesses first
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('member_id', user.id);

    const businessIds = businesses?.map(b => b.id) || [];

    // Build OR condition: created_by = user.id OR business_id IN (user's business ids)
    let orCondition = `created_by.eq.${user.id}`;
    if (businessIds.length > 0) {
      orCondition += `,business_id.in.(${businessIds.join(',')})`;
    }

    // Get ads: either created directly by user OR via their businesses
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .or(orCondition)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ads:', error);
      throw new Error(`Failed to fetch user ads: ${error.message}`);
    }

    return (data || []).map(ad => ({
      ...ad,
      current_user_is_owner: true,
    }));
  }

  /**
   * Get ads for a specific business
   */
  static async getBusinessAds(businessId: string): Promise<Ad[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, member_id')
      .eq('id', businessId)
      .eq('member_id', user.id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found or access denied');
    }

    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching business ads:', error);
      throw new Error(`Failed to fetch business ads: ${error.message}`);
    }

    return (data || []).map(ad => ({
      ...ad,
      current_user_is_owner: true,
    }));
  }

  /**
   * Get ad by ID
   */
  static async getAdById(adId: string): Promise<Ad | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching ad:', error);
      throw new Error(`Failed to fetch ad: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      current_user_is_owner: user?.id === data.created_by,
    };
  }

  /**
   * Create a new ad
   */
  static async createAd(data: CreateAdData): Promise<Ad> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!data.image_url.trim()) {
      throw new Error('Image URL is required');
    }

    if (!data.link_url.trim() || !data.link_url.match(/^https?:\/\//)) {
      throw new Error('Valid link URL is required');
    }

    if (!data.headline.trim()) {
      throw new Error('Headline is required');
    }

    if (data.headline.length < 3 || data.headline.length > 100) {
      throw new Error('Headline must be between 3 and 100 characters');
    }

    if (data.description && data.description.length > 300) {
      throw new Error('Description cannot exceed 300 characters');
    }

    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        created_by: user.id,
        business_id: data.business_id || null,
        image_url: data.image_url.trim(),
        link_url: data.link_url.trim(),
        headline: data.headline.trim(),
        description: data.description?.trim() || null,
        placement: data.placement,
        target_article_slug: data.target_article_slug?.trim() || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        status: data.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad:', error);
      throw new Error(`Failed to create ad: ${error.message}`);
    }

    return {
      ...ad,
      current_user_is_owner: true,
    };
  }

  /**
   * Update an ad (owners only)
   */
  static async updateAd(adId: string, data: UpdateAdData): Promise<Ad> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: Record<string, unknown> = {};

    if (data.image_url !== undefined) {
      if (!data.image_url.trim()) {
        throw new Error('Image URL cannot be empty');
      }
      updateData.image_url = data.image_url.trim();
    }

    if (data.link_url !== undefined) {
      if (!data.link_url.trim() || !data.link_url.match(/^https?:\/\//)) {
        throw new Error('Valid link URL is required');
      }
      updateData.link_url = data.link_url.trim();
    }

    if (data.headline !== undefined) {
      if (!data.headline.trim()) {
        throw new Error('Headline cannot be empty');
      }
      if (data.headline.length < 3 || data.headline.length > 100) {
        throw new Error('Headline must be between 3 and 100 characters');
      }
      updateData.headline = data.headline.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
      if (data.description && data.description.length > 300) {
        throw new Error('Description cannot exceed 300 characters');
      }
    }

    if (data.placement !== undefined) updateData.placement = data.placement;
    if (data.target_article_slug !== undefined) {
      updateData.target_article_slug = data.target_article_slug?.trim() || null;
    }
    if (data.start_date !== undefined) updateData.start_date = data.start_date || null;
    if (data.end_date !== undefined) updateData.end_date = data.end_date || null;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: ad, error } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', adId)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad:', error);
      throw new Error(`Failed to update ad: ${error.message}`);
    }

    if (!ad) {
      throw new Error('Ad not found or access denied');
    }

    return {
      ...ad,
      current_user_is_owner: true,
    };
  }

  /**
   * Delete an ad (owners only)
   */
  static async deleteAd(adId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting ad:', error);
      throw new Error(`Failed to delete ad: ${error.message}`);
    }
  }

  /**
   * Track ad event (impression or click) with member tracking
   */
  static async trackEvent(
    adId: string,
    eventType: 'impression' | 'click',
    placement: 'article_left' | 'article_right' | 'article_both',
    articleSlug: string | null,
    memberId: string | null
  ): Promise<void> {
    const { error } = await supabase.rpc('track_ad_event', {
      p_ad_id: adId,
      p_event_type: eventType,
      p_placement: placement,
      p_article_slug: articleSlug,
      p_member_id: memberId,
    });

    if (error) {
      console.error('Error tracking ad event:', error);
      // Don't throw - tracking is non-critical
    }
  }

  /**
   * Track ad impression (legacy method for backwards compatibility)
   */
  static async trackImpression(adId: string): Promise<void> {
    // This method is deprecated, use trackEvent instead
    // Keeping for backwards compatibility
    const { data: { user } } = await supabase.auth.getUser();
    await AdService.trackEvent(
      adId,
      'impression',
      'article_right', // Default placement
      null,
      user?.id || null
    );
  }

  /**
   * Track ad click (legacy method for backwards compatibility)
   */
  static async trackClick(adId: string): Promise<void> {
    // This method is deprecated, use trackEvent instead
    // Keeping for backwards compatibility
    const { data: { user } } = await supabase.auth.getUser();
    await AdService.trackEvent(
      adId,
      'click',
      'article_right', // Default placement
      null,
      user?.id || null
    );
  }
}
