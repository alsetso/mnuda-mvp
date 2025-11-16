import { supabase } from '@/lib/supabase';
import type { MarketplaceListing, CreateListingData, UpdateListingData } from '../types';

export class ListingService {
  /**
   * Get all active listings
   */
  static async getAllListings(): Promise<MarketplaceListing[]> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        pin:pins(id, name, address, lat, long),
        user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return (data || []).map(listing => ({
      ...listing,
      current_user_is_owner: user?.id === listing.created_by,
      price: parseFloat(listing.price.toString()),
    }));
  }

  /**
   * Get listing by ID
   */
  static async getListingById(listingId: string, trackVisit: boolean = false): Promise<MarketplaceListing | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        pin:pins(id, name, address, lat, long),
        user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
      `)
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching listing:', error);
      throw new Error(`Failed to fetch listing: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Track visit asynchronously (non-blocking)
    if (trackVisit) {
      ListingService.incrementVisitCount(listingId).catch(err => {
        console.error('Failed to track visit:', err);
      });
    }

    return {
      ...data,
      current_user_is_owner: user?.id === data.created_by,
      price: parseFloat(data.price.toString()),
    };
  }

  /**
   * Get user's listings
   */
  static async getUserListings(): Promise<MarketplaceListing[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        pin:pins(id, name, address, lat, long),
        user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
      throw new Error(`Failed to fetch user listings: ${error.message}`);
    }

    return (data || []).map(listing => ({
      ...listing,
      current_user_is_owner: true,
      price: parseFloat(listing.price.toString()),
    }));
  }

  /**
   * Create a new listing
   */
  static async createListing(data: CreateListingData): Promise<MarketplaceListing> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!data.title.trim()) {
      throw new Error('Listing title is required');
    }

    if (data.title.length < 3 || data.title.length > 200) {
      throw new Error('Listing title must be between 3 and 200 characters');
    }

    if (data.description && data.description.length > 2000) {
      throw new Error('Description cannot exceed 2000 characters');
    }

    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .insert({
        created_by: user.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        listing_type: data.listing_type,
        price: data.is_free ? 0 : data.price,
        is_free: data.is_free,
        image_urls: data.image_urls || [],
        pin_id: data.pin_id || null,
        status: data.status || 'active',
      })
      .select(`
        *,
        pin:pins(id, name, address, lat, long),
        user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    return {
      ...listing,
      current_user_is_owner: true,
      price: parseFloat(listing.price.toString()),
    };
  }

  /**
   * Update a listing (owners only)
   */
  static async updateListing(listingId: string, data: UpdateListingData): Promise<MarketplaceListing> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw new Error('Listing title cannot be empty');
      }
      if (data.title.length < 3 || data.title.length > 200) {
        throw new Error('Listing title must be between 3 and 200 characters');
      }
      updateData.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
      if (data.description && data.description.length > 2000) {
        throw new Error('Description cannot exceed 2000 characters');
      }
    }
    if (data.listing_type !== undefined) updateData.listing_type = data.listing_type;
    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new Error('Price cannot be negative');
      }
      updateData.price = data.is_free ? 0 : data.price;
    }
    if (data.is_free !== undefined) {
      updateData.is_free = data.is_free;
      if (data.is_free && data.price !== undefined) {
        updateData.price = 0;
      }
    }
    if (data.image_urls !== undefined) updateData.image_urls = data.image_urls;
    if (data.pin_id !== undefined) updateData.pin_id = data.pin_id || null;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .update(updateData)
      .eq('id', listingId)
      .eq('created_by', user.id)
      .select(`
        *,
        pin:pins(id, name, address, lat, long),
        user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      throw new Error(`Failed to update listing: ${error.message}`);
    }

    if (!listing) {
      throw new Error('Listing not found or access denied');
    }

    return {
      ...listing,
      current_user_is_owner: true,
      price: parseFloat(listing.price.toString()),
    };
  }

  /**
   * Delete a listing (owners only)
   */
  static async deleteListing(listingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', listingId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting listing:', error);
      throw new Error(`Failed to delete listing: ${error.message}`);
    }
  }

  /**
   * Increment visit count for a listing
   */
  static async incrementVisitCount(listingId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_listing_visit_count', {
      listing_id: listingId,
    });

    if (error) {
      console.error('Error incrementing visit count:', error);
      // Don't throw - visit tracking is non-critical
    }
  }
}

