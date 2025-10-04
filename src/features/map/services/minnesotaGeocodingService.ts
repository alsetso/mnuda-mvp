/**
 * Minnesota Geocoding Service
 * Provides Minnesota-specific geocoding with autocomplete suggestions
 */

import { Address, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';
import { minnesotaBoundsService } from './minnesotaBoundsService';

export interface GeocodingSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
  place_type?: string[];
  relevance?: number;
}

export interface GeocodingSearchResult {
  success: boolean;
  suggestions: GeocodingSuggestion[];
  error?: string;
  query: string;
  cachedAt?: number;
}

export interface GeocodingResult {
  success: boolean;
  coordinates?: Coordinates;
  address?: Address;
  error?: string;
  fullAddress: string;
  cachedAt?: number;
}

interface CachedSearchResult extends GeocodingSearchResult {
  expiresAt: number;
}

interface CachedGeocodingResult extends GeocodingResult {
  expiresAt: number;
}

export class MinnesotaGeocodingService {
  private static searchCache = new Map<string, CachedSearchResult>();
  private static geocodingCache = new Map<string, CachedGeocodingResult>();
  private static readonly CACHE_DURATION = 300000; // 5 minutes for search suggestions
  private static readonly GEOCODING_CACHE_DURATION = 86400000; // 24 hours for geocoding
  private static readonly MAX_CACHE_SIZE = 500;
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  
  // Request deduplication
  private static pendingSearches = new Map<string, Promise<GeocodingSearchResult>>();
  private static pendingGeocoding = new Map<string, Promise<GeocodingResult>>();

  /**
   * Search for Minnesota addresses with autocomplete suggestions
   */
  static async searchMinnesotaAddresses(query: string): Promise<GeocodingSearchResult> {
    if (!query.trim() || query.length < 2) {
      return {
        success: true,
        suggestions: [],
        query: query.trim()
      };
    }

    const cacheKey = this.getSearchCacheKey(query);
    
    // Check cache first
    const cached = this.getCachedSearchResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pendingRequest = this.pendingSearches.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request with deduplication
    const requestPromise = this.performSearchRequest(query, cacheKey);
    this.pendingSearches.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingSearches.delete(cacheKey);
    }
  }

  /**
   * Geocode a specific address to coordinates
   */
  static async geocodeMinnesotaAddress(address: Address): Promise<GeocodingResult> {
    const cacheKey = this.getGeocodingCacheKey(address);
    
    // Check cache first
    const cached = this.getCachedGeocodingResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pendingRequest = this.pendingGeocoding.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request with deduplication
    const requestPromise = this.performGeocodingRequest(address, cacheKey);
    this.pendingGeocoding.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingGeocoding.delete(cacheKey);
    }
  }

  /**
   * Perform the actual search request
   */
  private static async performSearchRequest(
    query: string, 
    cacheKey: string
  ): Promise<GeocodingSearchResult> {
    const token = MAP_CONFIG.MAPBOX_TOKEN;
    
    if (!token || token === 'your_mapbox_token_here') {
      return this.getMockSearchResult(query);
    }

    try {
      const url = `${MAP_CONFIG.GEOCODING_BASE_URL}/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        country: 'US',
        types: 'address,place,locality,neighborhood,postcode',
        limit: '10',
        bbox: '-97.5,43.5,-89.5,49.5', // Minnesota bounds
        proximity: '-94.6859,46.7296' // Center of Minnesota for better relevance
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

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
        throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        const result: GeocodingSearchResult = {
          success: true,
          suggestions: [],
          query
        };
        this.setCachedSearchResult(cacheKey, result);
        return result;
      }

      // Filter and validate Minnesota results
      const minnesotaSuggestions = data.features
        .map((feature: Record<string, unknown>) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center as [number, number],
          context: feature.context,
          place_type: feature.place_type,
          relevance: feature.relevance
        }))
        .filter((suggestion: GeocodingSuggestion) => {
          const coordinates = { lat: suggestion.center[1], lng: suggestion.center[0] };
          return minnesotaBoundsService.isWithinMinnesota(coordinates);
        })
        .sort((a: GeocodingSuggestion, b: GeocodingSuggestion) => 
          (b.relevance || 0) - (a.relevance || 0)
        );

      const result: GeocodingSearchResult = {
        success: true,
        suggestions: minnesotaSuggestions,
        query
      };

      this.setCachedSearchResult(cacheKey, result);
      return result;

    } catch (error) {
      const result: GeocodingSearchResult = {
        success: false,
        suggestions: [],
        error: error instanceof Error ? error.message : 'Search failed',
        query
      };

      // Cache error for shorter duration
      this.setCachedSearchResult(cacheKey, result, true);
      return result;
    }
  }

  /**
   * Perform the actual geocoding request
   */
  private static async performGeocodingRequest(
    address: Address, 
    cacheKey: string
  ): Promise<GeocodingResult> {
    const token = MAP_CONFIG.MAPBOX_TOKEN;
    const fullAddress = this.formatAddress(address);
    
    if (!token || token === 'your_mapbox_token_here') {
      return this.getMockGeocodingResult(address);
    }

    try {
      const query = this.formatAddress(address);
      const url = `${MAP_CONFIG.GEOCODING_BASE_URL}/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        country: 'US',
        types: 'address',
        limit: '1',
        bbox: '-97.5,43.5,-89.5,49.5' // Minnesota bounds
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

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

      const feature = data.features[0];
      const [longitude, latitude] = feature.center;
      
      // Validate coordinates are in Minnesota
      const coordinates = { lat: latitude, lng: longitude };
      if (!minnesotaBoundsService.isWithinMinnesota(coordinates)) {
        throw new Error('Address is not in Minnesota');
      }

      // Parse address from feature
      const parsedAddress = this.parseAddressFromFeature(feature);

      const result: GeocodingResult = {
        success: true,
        coordinates: { latitude, longitude },
        address: parsedAddress,
        fullAddress
      };

      this.setCachedGeocodingResult(cacheKey, result);
      return result;

    } catch (error) {
      const result: GeocodingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed',
        fullAddress
      };

      // Cache error for shorter duration
      this.setCachedGeocodingResult(cacheKey, result, true);
      return result;
    }
  }

  /**
   * Parse address from Mapbox feature
   */
  private static parseAddressFromFeature(feature: Record<string, unknown>): Address {
    const context = (feature.context as Array<Record<string, unknown>>) || [];
    
    // Extract components from context
    const street = (feature.place_name as string)?.split(',')[0] || '';
    const city = context.find((ctx: Record<string, unknown>) => (ctx.id as string)?.startsWith('place'))?.text as string || '';
    const state = context.find((ctx: Record<string, unknown>) => (ctx.id as string)?.startsWith('region'))?.text as string || 'MN';
    const zip = context.find((ctx: Record<string, unknown>) => (ctx.id as string)?.startsWith('postcode'))?.text as string || '';

    return {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
    };
  }

  /**
   * Format address for geocoding
   */
  private static formatAddress(address: Address): string {
    const parts = [
      address.street?.trim(),
      address.city?.trim(),
      `${address.state?.trim()} ${address.zip?.trim()}`.trim()
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Generate cache keys
   */
  private static getSearchCacheKey(query: string): string {
    return `search:${query.toLowerCase().trim()}`;
  }

  private static getGeocodingCacheKey(address: Address): string {
    const normalize = (str: string) => str?.toLowerCase().trim() || '';
    return `geocode:${[
      normalize(address.street),
      normalize(address.city),
      normalize(address.state),
      normalize(address.zip)
    ].join('|')}`;
  }

  /**
   * Cache management for search results
   */
  private static getCachedSearchResult(cacheKey: string): GeocodingSearchResult | null {
    const cached = this.searchCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.searchCache.delete(cacheKey);
      return null;
    }

    const { expiresAt, ...result } = cached;
    void expiresAt; // Suppress unused variable warning
    return result;
  }

  private static setCachedSearchResult(
    cacheKey: string, 
    result: GeocodingSearchResult, 
    isError: boolean = false
  ): void {
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) this.searchCache.delete(firstKey);
    }

    const now = Date.now();
    const ttl = isError ? this.CACHE_DURATION / 4 : this.CACHE_DURATION;
    
    const cachedResult: CachedSearchResult = {
      ...result,
      expiresAt: now + ttl
    };

    this.searchCache.set(cacheKey, cachedResult);
  }

  /**
   * Cache management for geocoding results
   */
  private static getCachedGeocodingResult(cacheKey: string): GeocodingResult | null {
    const cached = this.geocodingCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.geocodingCache.delete(cacheKey);
      return null;
    }

    const { expiresAt, ...result } = cached;
    void expiresAt; // Suppress unused variable warning
    return result;
  }

  private static setCachedGeocodingResult(
    cacheKey: string, 
    result: GeocodingResult, 
    isError: boolean = false
  ): void {
    if (this.geocodingCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.geocodingCache.keys().next().value;
      if (firstKey) this.geocodingCache.delete(firstKey);
    }

    const now = Date.now();
    const ttl = isError ? this.GEOCODING_CACHE_DURATION / 4 : this.GEOCODING_CACHE_DURATION;
    
    const cachedResult: CachedGeocodingResult = {
      ...result,
      expiresAt: now + ttl
    };

    this.geocodingCache.set(cacheKey, cachedResult);
  }

  /**
   * Mock data for development/testing
   */
  private static getMockSearchResult(query: string): GeocodingSearchResult {
    const mockSuggestions: GeocodingSuggestion[] = [
      {
        id: 'mock-1',
        place_name: `123 Main St, Minneapolis, MN 55401`,
        center: [-93.2650, 44.9778] as [number, number],
        context: [
          { id: 'place.123', text: 'Minneapolis' },
          { id: 'region.456', text: 'Minnesota' },
          { id: 'postcode.789', text: '55401' }
        ],
        place_type: ['address'],
        relevance: 0.9
      },
      {
        id: 'mock-2',
        place_name: `456 Oak Ave, Saint Paul, MN 55102`,
        center: [-93.0931, 44.9537] as [number, number],
        context: [
          { id: 'place.234', text: 'Saint Paul' },
          { id: 'region.456', text: 'Minnesota' },
          { id: 'postcode.890', text: '55102' }
        ],
        place_type: ['address'],
        relevance: 0.8
      }
    ].filter(suggestion => 
      suggestion.place_name.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      suggestions: mockSuggestions,
      query
    };
  }

  private static getMockGeocodingResult(address: Address): GeocodingResult {
    const hash = this.simpleHash(address.street + address.city + address.state);
    
    // Generate coordinates within Minnesota bounds
    const latRange = { min: 43.5, max: 49.5 };
    const lngRange = { min: -97.5, max: -89.5 };
    
    const latOffset = (hash % 10000) / 10000;
    const lngOffset = ((hash * 7) % 10000) / 10000;
    
    const latitude = latRange.min + (latRange.max - latRange.min) * latOffset;
    const longitude = lngRange.min + (lngRange.max - lngRange.min) * lngOffset;
    
    return {
      success: true,
      coordinates: { 
        latitude: Math.round(latitude * 10000) / 10000,
        longitude: Math.round(longitude * 10000) / 10000 
      },
      address,
      fullAddress: this.formatAddress(address)
    };
  }

  private static simpleHash(str: string): number {
    if (!str) return 0;
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Cache management methods
   */
  static clearCache(): void {
    this.searchCache.clear();
    this.geocodingCache.clear();
    this.pendingSearches.clear();
    this.pendingGeocoding.clear();
  }

  static clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.searchCache.entries()) {
      if (now > cached.expiresAt) {
        this.searchCache.delete(key);
      }
    }
    
    for (const [key, cached] of this.geocodingCache.entries()) {
      if (now > cached.expiresAt) {
        this.geocodingCache.delete(key);
      }
    }
  }

  static getCacheStats(): {
    searchCacheSize: number;
    geocodingCacheSize: number;
    pendingSearches: number;
    pendingGeocoding: number;
  } {
    return {
      searchCacheSize: this.searchCache.size,
      geocodingCacheSize: this.geocodingCache.size,
      pendingSearches: this.pendingSearches.size,
      pendingGeocoding: this.pendingGeocoding.size
    };
  }
}

export const minnesotaGeocodingService = MinnesotaGeocodingService;
