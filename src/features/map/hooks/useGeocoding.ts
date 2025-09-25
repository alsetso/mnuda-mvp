// React hook for geocoding addresses
import { useState, useCallback } from 'react';
import { GeocodingService, AddressWithCoordinates, GeocodingResult } from '../services/geocodingService';

export interface UseGeocodingReturn {
  geocodeAddress: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => Promise<GeocodingResult>;
  
  geocodeAddresses: (addresses: Array<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>) => Promise<GeocodingResult[]>;
  
  addCoordinatesToAddress: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => Promise<AddressWithCoordinates>;
  
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGeocoding(): UseGeocodingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const geocodeAddress = useCallback(async (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<GeocodingResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await GeocodingService.geocodeAddress(address);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Geocoding failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        fullAddress: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const geocodeAddresses = useCallback(async (addresses: Array<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>): Promise<GeocodingResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await GeocodingService.geocodeAddresses(addresses);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch geocoding failed';
      setError(errorMessage);
      return addresses.map(address => ({
        success: false,
        error: errorMessage,
        fullAddress: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCoordinatesToAddress = useCallback(async (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<AddressWithCoordinates> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await GeocodingService.addCoordinatesToAddress(address);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add coordinates';
      setError(errorMessage);
      return {
        ...address,
        fullAddress: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    geocodeAddress,
    geocodeAddresses,
    addCoordinatesToAddress,
    isLoading,
    error,
    clearError,
  };
}
