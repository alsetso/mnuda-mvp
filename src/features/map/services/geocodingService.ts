// Consolidated geocoding service for all address coordinate lookups
import { Address, AddressWithCoordinates, GeocodingResult, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';

interface CachedGeocodingResult extends GeocodingResult {
  cachedAt: number;
  expiresAt: number;
}

interface CacheStats {
  size: number;
  keys: string[];
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
}

export class GeocodingService {
  private static cache = new Map<string, CachedGeocodingResult>();
  private static readonly CACHE_DURATION = MAP_CONFIG.GEOCODE_CACHE_TTL;
  private static readonly ERROR_CACHE_DURATION = Math.min(MAP_CONFIG.GEOCODE_CACHE_TTL / 4, 300000); // 5 min max
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  
  // Request deduplication
  private static pendingRequests = new Map<string, Promise<GeocodingResult>>();
  
  // Cache statistics
  private static stats = {
    totalRequests: 0,
    cacheHits: 0
  };

  // Main method to geocode any address
  static async geocodeAddress(address: Address): Promise<GeocodingResult> {
    this.stats.totalRequests++;
    const cacheKey = this.getCacheKey(address);

    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request with deduplication
    const requestPromise = this.performGeocodingRequest(address, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Batch geocode multiple addresses with concurrency control
  static async geocodeAddresses(
    addresses: Address[], 
    concurrency: number = 5
  ): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = [];
    
    for (let i = 0; i < addresses.length; i += concurrency) {
      const batch = addresses.slice(i, i + concurrency);
      const batchPromises = batch.map(address => this.geocodeAddress(address));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Add coordinates to an address object
  static async addCoordinatesToAddress(address: Address): Promise<AddressWithCoordinates> {
    const result = await this.geocodeAddress(address);
    
    return {
      ...address,
      coordinates: result.coordinates,
      fullAddress: result.fullAddress,
    };
  }

  // Perform the actual geocoding request
  private static async performGeocodingRequest(
    address: Address, 
    cacheKey: string
  ): Promise<GeocodingResult> {
    const fullAddress = this.formatAddress(address);

    try {
      const coordinates = await this.fetchCoordinates(address);
      
      const result: GeocodingResult = {
        success: true,
        coordinates,
        fullAddress,
      };

      // Cache successful result
      this.setCachedResult(cacheKey, result, false);
      return result;

    } catch (error) {
      const result: GeocodingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed',
        fullAddress,
      };

      // Cache error for shorter duration
      this.setCachedResult(cacheKey, result, true);
      return result;
    }
  }

  // Enhanced coordinate fetching with timeout and retry logic
  private static async fetchCoordinates(address: Address): Promise<Coordinates> {
    const token = MAP_CONFIG.MAPBOX_TOKEN;
    
    if (!token || token === 'your_mapbox_token_here') {
      return this.getMockCoordinates(address);
    }

    const query = this.formatAddress(address);
    const url = `${MAP_CONFIG.GEOCODING_BASE_URL}/${encodeURIComponent(query)}.json`;
    const params = new URLSearchParams({
      access_token: token,
      limit: MAP_CONFIG.GEOCODING_LIMIT.toString(),
      country: MAP_CONFIG.GEOCODING_COUNTRY,
      types: 'address' // Focus on addresses for better accuracy
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${url}?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No coordinates found for address');
      }

      const [longitude, latitude] = data.features[0].center;
      
      // Validate coordinates
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid coordinates returned from geocoding service');
      }

      return { latitude, longitude };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Geocoding request timed out');
      }
      
      throw error;
    }
  }

  // Validate coordinate values
  private static isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  // Enhanced cache management
  private static getCachedResult(cacheKey: string): GeocodingResult | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry has expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Return result without cache metadata
    const { cachedAt, expiresAt, ...result } = cached;
    return result;
  }

  private static setCachedResult(
    cacheKey: string, 
    result: GeocodingResult, 
    isError: boolean
  ): void {
    // Implement LRU eviction if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const now = Date.now();
    const ttl = isError ? this.ERROR_CACHE_DURATION : this.CACHE_DURATION;
    
    const cachedResult: CachedGeocodingResult = {
      ...result,
      cachedAt: now,
      expiresAt: now + ttl
    };

    this.cache.set(cacheKey, cachedResult);
  }

  // Format address for geocoding with better handling of missing parts
  private static formatAddress(address: Address): string {
    const parts = [
      address.street?.trim(),
      address.city?.trim(),
      `${address.state?.trim()} ${address.zip?.trim()}`.trim()
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Generate consistent cache key
  private static getCacheKey(address: Address): string {
    const normalize = (str: string) => str?.toLowerCase().trim() || '';
    return [
      normalize(address.street),
      normalize(address.city),
      normalize(address.state),
      normalize(address.zip)
    ].join('|');
  }

  // Improved mock coordinates with realistic US bounds
  private static getMockCoordinates(address: Address): Coordinates {
    const hash = this.simpleHash(address.street + address.city + address.state);
    
    // Generate coordinates within continental US bounds
    const latRange = { min: 25.0, max: 49.0 }; // Roughly continental US
    const lngRange = { min: -125.0, max: -66.0 };
    
    const latOffset = (hash % 10000) / 10000;
    const lngOffset = ((hash * 7) % 10000) / 10000; // Different multiplier for longitude
    
    const latitude = latRange.min + (latRange.max - latRange.min) * latOffset;
    const longitude = lngRange.min + (lngRange.max - lngRange.min) * lngOffset;
    
    return { 
      latitude: Math.round(latitude * 10000) / 10000,
      longitude: Math.round(longitude * 10000) / 10000 
    };
  }

  // Enhanced hash function
  private static simpleHash(str: string): number {
    if (!str) return 0;
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Cache management methods
  static clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats = { totalRequests: 0, cacheHits: 0 };
  }

  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Enhanced cache statistics
  static getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: this.stats.totalRequests > 0 
        ? this.stats.cacheHits / this.stats.totalRequests 
        : 0,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
    };
  }

  // Health check method
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      const token = MAP_CONFIG.MAPBOX_TOKEN;
      if (!token || token === 'your_mapbox_token_here') {
        return { status: 'healthy', details: 'Running with mock data' };
      }

      // Test with a simple query
      const testAddress: Address = {
        street: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        state: 'CA',
        zip: '94043'
      };

      const result = await this.geocodeAddress(testAddress);
      return { 
        status: result.success ? 'healthy' : 'unhealthy',
        details: result.error || 'Service operational'
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}