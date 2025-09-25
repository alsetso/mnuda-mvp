// Utility functions for adding geocoding to address entities
import { GeocodingService } from './geocodingService';
import { AddressEntity } from '@/features/api/services/personDetailParse';

// Add coordinates to address entities
export async function addCoordinatesToAddressEntities(entities: AddressEntity[]): Promise<AddressEntity[]> {
  const addressEntities = entities.filter(entity => entity.type === 'address');
  
  if (addressEntities.length === 0) {
    return entities;
  }

  // Prepare addresses for batch geocoding
  const addresses = addressEntities.map(entity => ({
    street: entity.street || '',
    city: entity.city || '',
    state: entity.state || '',
    zip: entity.postal || '',
  }));

  // Batch geocode all addresses
  const geocodingResults = await GeocodingService.geocodeAddresses(addresses);

  // Update entities with coordinates
  const updatedEntities = entities.map(entity => {
    if (entity.type === 'address') {
      const addressIndex = addressEntities.indexOf(entity);
      const geocodingResult = geocodingResults[addressIndex];
      
      if (geocodingResult && geocodingResult.success && geocodingResult.coordinates) {
        return {
          ...entity,
          coordinates: geocodingResult.coordinates,
        };
      }
    }
    return entity;
  });

  return updatedEntities;
}

// Add coordinates to a single address entity
export async function addCoordinatesToAddressEntity(entity: AddressEntity): Promise<AddressEntity> {
  if (entity.type !== 'address' || !entity.street || !entity.city || !entity.state) {
    return entity;
  }

  const result = await GeocodingService.geocodeAddress({
    street: entity.street,
    city: entity.city,
    state: entity.state,
    zip: entity.postal || '',
  });

  if (result.success && result.coordinates) {
    return {
      ...entity,
      coordinates: result.coordinates,
    };
  }

  return entity;
}

// Check if an address entity has coordinates
export function hasCoordinates(entity: AddressEntity): boolean {
  return !!(entity.coordinates?.latitude && entity.coordinates?.longitude);
}

// Format coordinates for display
export function formatCoordinates(entity: AddressEntity): string {
  if (!hasCoordinates(entity)) {
    return 'Not available';
  }
  
  const { latitude, longitude } = entity.coordinates!;
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
