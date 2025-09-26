// Geocoding service for address suggestions
export interface AddressSuggestion {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
  coordinates: [number, number];
}

interface MapboxFeature {
  id?: string;
  text?: string;
  place_name?: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

interface GeocodingConfig {
  baseUrl: string;
  limit: number;
  country: string;
  types: string;
}

class GeocodingService {
  private readonly config: GeocodingConfig = {
    baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    limit: 5,
    country: 'US',
    types: 'address'
  };

  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  async getStreetSuggestions(query: string): Promise<AddressSuggestion[]> {
    if (!query?.trim()) {
      return [];
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    // Use mock data if no valid token
    if (!token || token === 'your_mapbox_token_here') {
      if (this.isDevelopment) {
        console.warn('Using mock geocoding data - no valid Mapbox token found');
      }
      return this.getMockSuggestions(query);
    }

    try {
      const suggestions = await this.fetchMapboxSuggestions(query.trim(), token);
      return suggestions.length > 0 ? suggestions : this.getMockSuggestions(query);
    } catch (error) {
      console.error('Geocoding API failed:', error);
      return this.getMockSuggestions(query);
    }
  }

  private async fetchMapboxSuggestions(query: string, token: string): Promise<AddressSuggestion[]> {
    const url = this.buildMapboxUrl(query, token);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data: MapboxResponse = await response.json();
    return this.transformMapboxFeatures(data.features || []);
  }

  private buildMapboxUrl(query: string, token: string): string {
    const params = new URLSearchParams({
      access_token: token,
      types: this.config.types,
      limit: this.config.limit.toString(),
      country: this.config.country
    });

    return `${this.config.baseUrl}/${encodeURIComponent(query)}.json?${params}`;
  }

  private transformMapboxFeatures(features: MapboxFeature[]): AddressSuggestion[] {
    return features.map((feature, index) => {
      const [lng, lat] = feature.center;
      const addressComponents = this.parseAddressComponents(feature);
      
      if (this.isDevelopment) {
        console.log('Mapbox feature parsed:', {
          original: {
            text: feature.text,
            place_name: feature.place_name,
            context: feature.context?.map(c => ({ id: c.id, text: c.text }))
          },
          parsed: addressComponents
        });
      }

      return {
        id: feature.id || `mapbox-${index}`,
        ...addressComponents,
        fullAddress: feature.place_name || feature.text || 'Unknown Address',
        coordinates: [lng, lat]
      };
    });
  }

  private parseAddressComponents(feature: MapboxFeature): Pick<AddressSuggestion, 'street' | 'city' | 'state' | 'zip'> {
    const context = feature.context || [];
    const contextMap = this.createContextMap(context);
    
    // Extract components with fallbacks
    const streetNumber = contextMap.address || '';
    const streetName = contextMap.street || '';
    const city = contextMap.place || '';
    const state = contextMap.region || '';
    const zip = contextMap.postcode || '';

    // Build street address
    const street = this.buildStreetAddress(streetNumber, streetName, feature);

    return { street, city, state, zip };
  }

  private createContextMap(context: Array<{ id: string; text: string }>): Record<string, string> {
    return context.reduce((map, item) => {
      const type = item.id.split('.')[0]; // Get the type prefix (e.g., 'address', 'street', etc.)
      map[type] = item.text;
      return map;
    }, {} as Record<string, string>);
  }

  private buildStreetAddress(streetNumber: string, streetName: string, feature: MapboxFeature): string {
    // Try to build from components first
    if (streetNumber && streetName) {
      return `${streetNumber} ${streetName}`.trim();
    }
    
    if (streetName) {
      return streetName;
    }

    // Fallback to extracting from place_name or text
    const placeName = feature.place_name || '';
    const mainText = feature.text || '';
    
    if (placeName) {
      // Extract the first part before the first comma (usually the street address)
      return placeName.split(',')[0]?.trim() || mainText || '';
    }
    
    return mainText || '';
  }

  private getMockSuggestions(query: string): AddressSuggestion[] {
    const mockAddresses: AddressSuggestion[] = [
      {
        id: 'mock-1',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        fullAddress: '123 Main St, New York, NY 10001',
        coordinates: [-74.006, 40.7128]
      },
      {
        id: 'mock-2',
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        fullAddress: '456 Oak Ave, Los Angeles, CA 90210',
        coordinates: [-118.2437, 34.0522]
      },
      {
        id: 'mock-3',
        street: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        fullAddress: '789 Pine Rd, Chicago, IL 60601',
        coordinates: [-87.6298, 41.8781]
      },
      {
        id: 'mock-4',
        street: '1161 Natchez Dr',
        city: 'College Station',
        state: 'TX',
        zip: '77845',
        fullAddress: '1161 Natchez Dr, College Station, TX 77845',
        coordinates: [-96.3344, 30.6279]
      },
      {
        id: 'mock-5',
        street: '3828 Double Oak Ln',
        city: 'Irving',
        state: 'TX',
        zip: '75061',
        fullAddress: '3828 Double Oak Ln, Irving, TX 75061',
        coordinates: [-96.9489, 32.8140]
      }
    ];

    const normalizedQuery = query.toLowerCase().trim();
    const filtered = mockAddresses.filter(addr =>
      addr.street.toLowerCase().includes(normalizedQuery) ||
      addr.city.toLowerCase().includes(normalizedQuery) ||
      addr.fullAddress.toLowerCase().includes(normalizedQuery)
    );

    if (this.isDevelopment) {
      console.log(`Mock suggestions for query "${query}":`, filtered.length);
    }

    return filtered;
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();