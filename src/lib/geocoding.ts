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

export const geocodingService = {
  async getStreetSuggestions(query: string): Promise<AddressSuggestion[]> {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token || token === 'your_mapbox_token_here') {
        // Return mock data if no token
        return this.getMockSuggestions(query);
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=address&limit=5&country=US`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features.map((feature: any, index: number) => {
          const [lng, lat] = feature.center;
          const context = feature.context || [];
          
          // Extract address components from Mapbox response
          const streetNumber = context.find((c: any) => c.id.startsWith('address'))?.text || '';
          const streetName = context.find((c: any) => c.id.startsWith('street'))?.text || '';
          const city = context.find((c: any) => c.id.startsWith('place'))?.text || '';
          const state = context.find((c: any) => c.id.startsWith('region'))?.text || '';
          const zip = context.find((c: any) => c.id.startsWith('postcode'))?.text || '';

          // Build street address with proper house number
          let street = '';
          
          // Try to extract from context first
          if (streetNumber && streetName) {
            street = `${streetNumber} ${streetName}`.trim();
          } else if (streetName) {
            street = streetName;
          } else {
            // Fallback: extract street from the main text or place_name
            const mainText = feature.text || '';
            const placeName = feature.place_name || '';
            
            // Try to extract the first part (street address) from place_name
            if (placeName) {
              const parts = placeName.split(',');
              street = parts[0] || mainText || '';
            } else {
              street = mainText || '';
            }
          }

          // Debug logging to see what we're extracting
          console.log('Mapbox feature:', {
            text: feature.text,
            place_name: feature.place_name,
            context: context.map((c: any) => ({ id: c.id, text: c.text })),
            extracted: { streetNumber, streetName, street, city, state, zip }
          });

          return {
            id: feature.id || `suggestion-${index}`,
            street: street,
            city,
            state,
            zip,
            fullAddress: feature.place_name || feature.text,
            coordinates: [lng, lat]
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Geocoding failed:', error);
      return this.getMockSuggestions(query);
    }
  },

  getMockSuggestions(query: string): AddressSuggestion[] {
    // Mock data for testing without API key
    const mockAddresses = [
      {
        id: 'mock-1',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        fullAddress: '123 Main St, New York, NY 10001',
        coordinates: [-74.006, 40.7128] as [number, number]
      },
      {
        id: 'mock-2',
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        fullAddress: '456 Oak Ave, Los Angeles, CA 90210',
        coordinates: [-118.2437, 34.0522] as [number, number]
      },
      {
        id: 'mock-3',
        street: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        fullAddress: '789 Pine Rd, Chicago, IL 60601',
        coordinates: [-87.6298, 41.8781] as [number, number]
      },
      {
        id: 'mock-4',
        street: '1161 Natchez Dr',
        city: 'College Station',
        state: 'TX',
        zip: '77845',
        fullAddress: '1161 Natchez Dr, College Station, TX 77845',
        coordinates: [-96.3344, 30.6279] as [number, number]
      },
      {
        id: 'mock-5',
        street: '3828 Double Oak Ln',
        city: 'Irving',
        state: 'TX',
        zip: '75061',
        fullAddress: '3828 Double Oak Ln, Irving, TX 75061',
        coordinates: [-96.9489, 32.8140] as [number, number]
      }
    ];

    const filtered = mockAddresses.filter(addr => 
      addr.street.toLowerCase().includes(query.toLowerCase()) ||
      addr.city.toLowerCase().includes(query.toLowerCase())
    );

    console.log('Mock suggestions for query "' + query + '":', filtered);
    console.log('Mock street fields:', filtered.map(f => ({ id: f.id, street: f.street, fullAddress: f.fullAddress })));
    return filtered;
  }
};
