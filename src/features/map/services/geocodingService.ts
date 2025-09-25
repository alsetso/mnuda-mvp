// Enhanced geocoding service for automatic coordinate lookup
// This service provides simple, strategic geocoding for all addresses in the application

export interface AddressWithCoordinates {
  street: string;
  city: string;
  state: string;
  zip: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  fullAddress: string;
}

export interface GeocodingResult {
  success: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  error?: string;
  fullAddress: string;
  cachedAt?: number;
}

export class GeocodingService {
  private static cache = new Map<string, GeocodingResult>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Main method to geocode any address
  static async geocodeAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<GeocodingResult> {
    const fullAddress = this.formatAddress(address);
    const cacheKey = this.getCacheKey(address);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      const coordinates = await this.fetchCoordinates(address);
      
      const result: GeocodingResult = {
        success: true,
        coordinates,
        fullAddress,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        ...result,
        cachedAt: Date.now(),
      });

      return result;
    } catch (error) {
      const result: GeocodingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed',
        fullAddress,
      };

      // Cache the error for a shorter time
      this.cache.set(cacheKey, {
        ...result,
        cachedAt: Date.now(),
      });

      return result;
    }
  }

  // Batch geocode multiple addresses
  static async geocodeAddresses(addresses: Array<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>): Promise<GeocodingResult[]> {
    const promises = addresses.map(address => this.geocodeAddress(address));
    return Promise.all(promises);
  }

  // Add coordinates to an address object
  static async addCoordinatesToAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<AddressWithCoordinates> {
    const result = await this.geocodeAddress(address);
    
    return {
      ...address,
      coordinates: result.coordinates,
      fullAddress: result.fullAddress,
    };
  }

  // Private method to fetch coordinates from Mapbox API
  private static async fetchCoordinates(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<{ latitude: number; longitude: number }> {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!token || token === 'your_mapbox_token_here') {
      // Return mock coordinates for testing
      return this.getMockCoordinates(address);
    }

    const query = this.formatAddress(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=US`
    );

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return { latitude, longitude };
    }

    throw new Error('No coordinates found for address');
  }

  // Format address for geocoding
  private static formatAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  }

  // Generate cache key
  private static getCacheKey(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): string {
    return `${address.street.toLowerCase()}|${address.city.toLowerCase()}|${address.state.toLowerCase()}|${address.zip}`;
  }

  // Check if cache entry is still valid
  private static isCacheValid(cached: GeocodingResult): boolean {
    if (!cached.cachedAt) return false;
    return Date.now() - cached.cachedAt < this.CACHE_DURATION;
  }

  // Mock coordinates for testing (when no API key is available)
  private static getMockCoordinates(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): { latitude: number; longitude: number } {
    // Generate consistent mock coordinates based on address
    const hash = this.simpleHash(address.street + address.city + address.state);
    const lat = 30.6279 + (hash % 1000) / 10000; // Texas area
    const lng = -96.3344 + (hash % 1000) / 10000;
    
    return { latitude: lat, longitude: lng };
  }

  // Simple hash function for consistent mock data
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Clear cache (useful for testing or when you want fresh data)
  static clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
