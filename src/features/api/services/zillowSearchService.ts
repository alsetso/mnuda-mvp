'use client';

import { apiService } from './apiService';
import { GeocodingService } from '@/features/map/services/geocodingService';
import { NodeData } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';

export interface ZillowSearchResult {
  success: boolean;
  node?: Partial<NodeData>;
  error?: string;
}

export class ZillowSearchService {
  /**
   * Centralized Zillow search that creates a result node
   */
  static async searchZillow(
    address: { street: string; city: string; state: string; zip: string }
  ): Promise<ZillowSearchResult> {
    try {
      // Geocode the address first to get coordinates
      const geocodingResult = await GeocodingService.geocodeAddress(address);
      const addressWithCoordinates = {
        ...address,
        coordinates: geocodingResult.success ? geocodingResult.coordinates : undefined,
      };

      // Call the Zillow API
      const response = await apiService.callZillowAPI(address);

      // Create the result node
      const node: Partial<NodeData> = {
        id: `zillow-${Date.now()}`,
        type: 'api-result',
        apiName: 'Zillow Search',
        address: addressWithCoordinates,
        response,
        timestamp: new Date().toISOString(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };

      return {
        success: true,
        node
      };
    } catch (error) {
      console.error('Zillow search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zillow search failed'
      };
    }
  }

  /**
   * Search Zillow with toast notifications
   */
  static async searchZillowWithToast(
    address: { street: string; city: string; state: string; zip: string },
    _sessionId: string,
    withApiToast: (title: string, fn: () => Promise<unknown>, options?: Record<string, unknown>) => Promise<unknown>
  ): Promise<ZillowSearchResult> {
    try {
      const result = await withApiToast(
        'Zillow Search',
        () => this.searchZillow(address),
        {
          loadingMessage: `Searching property: ${address.street}, ${address.city}, ${address.state} ${address.zip}`,
          successMessage: 'Property search completed successfully',
          errorMessage: 'Failed to search property'
        }
      );

      return result as ZillowSearchResult;
    } catch (error) {
      console.error('Zillow search with toast error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zillow search failed'
      };
    }
  }
}
