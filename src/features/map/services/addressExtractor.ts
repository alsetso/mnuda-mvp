// Address extraction service to parse all addresses from session data
import { NodeData } from '@/features/session/services/sessionStorage';
import { GeocodingService } from './geocodingService';

export interface ExtractedAddress {
  id: string;
  type: 'search' | 'current' | 'previous';
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  source: string;
  nodeId: string;
  personId?: string;
  dateRange?: string;
  timespan?: string;
  county?: string;
}

export interface AddressSummary {
  total: number;
  search: number;
  current: number;
  previous: number;
  withCoordinates: number;
  addresses: ExtractedAddress[];
}

export class AddressExtractor {
  // Extract all addresses from session nodes
  static extractAllAddresses(nodes: NodeData[]): ExtractedAddress[] {
    const addresses: ExtractedAddress[] = [];

    nodes.forEach(node => {
      // 1. Extract search addresses (from node.address)
      if (node.address) {
        addresses.push({
          id: `search-${node.id}`,
          type: 'search',
          street: node.address.street,
          city: node.address.city,
          state: node.address.state,
          zip: node.address.zip,
          fullAddress: `${node.address.street}, ${node.address.city}, ${node.address.state} ${node.address.zip}`,
          coordinates: node.address.coordinates,
          source: node.apiName,
          nodeId: node.id,
        });
      }

      // 2. Extract addresses from people results - DIRECT APPROACH
      if (node.type === 'people-result' && node.personData) {
        const personData = node.personData as Record<string, unknown>;
        
        // Extract current addresses directly
        if (personData["Current Address Details List"]) {
          (personData["Current Address Details List"] as Record<string, unknown>[]).forEach((addr: Record<string, unknown>, index: number) => {
            if (addr.street_address && addr.address_locality && addr.address_region) {
              const fullAddress = `${addr.street_address}, ${addr.address_locality}, ${addr.address_region} ${addr.postal_code || ''}`.trim();
              addresses.push({
                id: `current-${node.id}-${index}`,
                type: 'current',
                street: String(addr.street_address || ''),
                city: String(addr.address_locality || ''),
                state: String(addr.address_region || ''),
                zip: String(addr.postal_code || ''),
                fullAddress,
                coordinates: undefined,
                source: String(personData.Source || 'Unknown'),
                nodeId: node.id,
                personId: node.personId,
                dateRange: String(addr.date_range || ''),
                county: String(addr.county || ''),
              });
            }
          });
        }
        
        // Extract previous addresses directly
        if (personData["Previous Address Details"]) {
          (personData["Previous Address Details"] as Record<string, unknown>[]).forEach((addr: Record<string, unknown>, index: number) => {
            if (addr.streetAddress && addr.addressLocality && addr.addressRegion) {
              const fullAddress = `${addr.streetAddress}, ${addr.addressLocality}, ${addr.addressRegion} ${addr.postalCode || ''}`.trim();
              addresses.push({
                id: `previous-${node.id}-${index}`,
                type: 'previous',
                street: String(addr.streetAddress || ''),
                city: String(addr.addressLocality || ''),
                state: String(addr.addressRegion || ''),
                zip: String(addr.postalCode || ''),
                fullAddress,
                coordinates: undefined,
                source: String(personData.Source || 'Unknown'),
                nodeId: node.id,
                personId: node.personId,
                timespan: String(addr.timespan || ''),
                county: String(addr.county || ''),
              });
            }
          });
        }
      }
    });

    return addresses;
  }

  // Get address summary with counts
  static getAddressSummary(nodes: NodeData[]): AddressSummary {
    const addresses = this.extractAllAddresses(nodes);
    
    return {
      total: addresses.length,
      search: addresses.filter(addr => addr.type === 'search').length,
      current: addresses.filter(addr => addr.type === 'current').length,
      previous: addresses.filter(addr => addr.type === 'previous').length,
      withCoordinates: addresses.filter(addr => addr.coordinates).length,
      addresses,
    };
  }

  // Geocode addresses that don't have coordinates
  static async geocodeMissingAddresses(addresses: ExtractedAddress[]): Promise<ExtractedAddress[]> {
    const addressesToGeocode = addresses.filter(addr => !addr.coordinates);
    
    if (addressesToGeocode.length === 0) {
      return addresses;
    }

    // Batch geocode missing addresses
    const geocodingResults = await GeocodingService.geocodeAddresses(
      addressesToGeocode.map(addr => ({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
      }))
    );

    // Update addresses with coordinates
    return addresses.map(addr => {
      if (!addr.coordinates) {
        const index = addressesToGeocode.findIndex(a => a.id === addr.id);
        const geocodingResult = geocodingResults[index];
        
        if (geocodingResult && geocodingResult.success && geocodingResult.coordinates) {
          return {
            ...addr,
            coordinates: geocodingResult.coordinates,
          };
        }
      }
      return addr;
    });
  }

  // Get unique addresses (remove duplicates)
  static getUniqueAddresses(addresses: ExtractedAddress[]): ExtractedAddress[] {
    const uniqueMap = new Map<string, ExtractedAddress>();
    
    addresses.forEach(addr => {
      const key = `${addr.street.toLowerCase()}|${addr.city.toLowerCase()}|${addr.state.toLowerCase()}|${addr.zip}`;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, addr);
      } else {
        // If we have a duplicate, prefer the one with coordinates
        const existing = uniqueMap.get(key)!;
        if (!existing.coordinates && addr.coordinates) {
          uniqueMap.set(key, addr);
        }
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  // Filter addresses by type
  static filterAddressesByType(addresses: ExtractedAddress[], types: ('search' | 'current' | 'previous')[]): ExtractedAddress[] {
    return addresses.filter(addr => types.includes(addr.type));
  }

  // Get addresses with coordinates only
  static getAddressesWithCoordinates(addresses: ExtractedAddress[]): ExtractedAddress[] {
    return addresses.filter(addr => addr.coordinates);
  }

  // Get address statistics
  static getAddressStats(addresses: ExtractedAddress[]) {
    const stats = {
      total: addresses.length,
      byType: {
        search: addresses.filter(addr => addr.type === 'search').length,
        current: addresses.filter(addr => addr.type === 'current').length,
        previous: addresses.filter(addr => addr.type === 'previous').length,
      },
      withCoordinates: addresses.filter(addr => addr.coordinates).length,
      byState: {} as Record<string, number>,
      byCity: {} as Record<string, number>,
    };

    // Count by state and city
    addresses.forEach(addr => {
      stats.byState[addr.state] = (stats.byState[addr.state] || 0) + 1;
      stats.byCity[addr.city] = (stats.byCity[addr.city] || 0) + 1;
    });

    return stats;
  }
}
