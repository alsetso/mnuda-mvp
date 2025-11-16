import { useState, useEffect, useCallback } from 'react';
import { ListingService } from '../services/listingService';
import type { MarketplaceListing, UpdateListingData } from '../types';

export function useListing(listingId: string) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadListing = useCallback(async () => {
    if (!listingId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await ListingService.getListingById(listingId, true);
      setListing(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load listing');
      setError(error);
      console.error('Error loading listing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const updateListing = useCallback(async (data: UpdateListingData) => {
    if (!listing?.id) return;
    try {
      const updated = await ListingService.updateListing(listing.id, data);
      setListing(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  }, [listing?.id]);

  const deleteListing = useCallback(async () => {
    if (!listing?.id) return;
    try {
      await ListingService.deleteListing(listing.id);
    } catch (err) {
      throw err;
    }
  }, [listing?.id]);

  return {
    listing,
    isLoading,
    error,
    updateListing,
    deleteListing,
    refreshListing: loadListing,
  };
}

