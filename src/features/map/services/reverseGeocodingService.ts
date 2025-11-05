import { MAP_CONFIG } from '../config';

export interface ReverseGeocodeResult {
  address: string;
  success: boolean;
  error?: string;
}

export class ReverseGeocodingService {
  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || MAP_CONFIG.MAPBOX_TOKEN;
    
    if (!token || token === 'your_mapbox_token_here') {
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        success: false,
        error: 'Mapbox token not configured',
      };
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
      const params = new URLSearchParams({
        access_token: token,
        types: 'address',
        limit: '1',
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        // Fallback to coordinates if no address found
        return {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          success: false,
          error: 'No address found',
        };
      }

      const feature = data.features[0];
      const address = feature.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      return {
        address,
        success: true,
      };
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

