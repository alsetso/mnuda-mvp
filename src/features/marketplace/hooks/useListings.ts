import { useState, useEffect, useCallback } from 'react';
import { ListingService } from '../services/listingService';
import type { MarketplaceListing } from '../types';

export function useListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ListingService.getAllListings();
      setListings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load listings');
      setError(error);
      console.error('Error loading listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const refreshListings = useCallback(() => {
    return loadListings();
  }, [loadListings]);

  return {
    listings,
    isLoading,
    error,
    refreshListings,
  };
}

