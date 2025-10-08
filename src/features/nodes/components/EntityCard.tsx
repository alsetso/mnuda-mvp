'use client';

import { useState, useEffect } from 'react';
import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity, AddressEntity } from '@/features/api/services/personDetailParse';
import { useGeocoding } from '@/features/map/hooks/useGeocoding';
import EntityModal from './EntityModal';

// Union type for all possible entity types
type EntityData = PersonRecord | PersonDetailEntity;

interface EntityCardProps {
  entity: EntityData;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onEntityClick?: (entity: EntityData) => void;
  showTechnicalDetails?: boolean;
}

export default function EntityCard({ 
  entity, 
  onPersonTrace, 
  onAddressIntel,
  onEntityClick,
  // showTechnicalDetails: _showTechnicalDetails = false 
}: EntityCardProps) {
  const { geocodeAddress, isLoading: isGeocoding } = useGeocoding();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine entity type
  const entityType = 'type' in entity ? entity.type : 'person';
  const isPersonRecord = !('type' in entity);

  // Auto-geocode address entities
  useEffect(() => {
    if (entityType === 'address' && !(entity as AddressEntity).coordinates) {
      const addressEntity = entity as AddressEntity;
      if (addressEntity.street && addressEntity.city && addressEntity.state) {
        geocodeAddress({
          street: addressEntity.street,
          city: addressEntity.city,
          state: addressEntity.state,
          zip: addressEntity.postal || '',
        }).then(result => {
          if (result.success && result.coordinates) {
            setCoordinates(result.coordinates);
          }
        });
      }
    } else if (entityType === 'address' && (entity as AddressEntity).coordinates) {
      setCoordinates((entity as AddressEntity).coordinates as { latitude: number; longitude: number });
    }
  }, [entity, geocodeAddress, entityType]);

  // Get type label color
  const _getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-gray-50 text-gray-700';
      case 'address': return 'bg-gray-50 text-gray-700';
      case 'phone': return 'bg-gray-50 text-gray-700';
      case 'email': return 'bg-gray-50 text-gray-700';
      case 'person': return 'bg-[#014463] text-white';
      case 'image': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  // Get primary value for display
  const getPrimaryValue = (entity: EntityData): string => {
    if (isPersonRecord) {
      return (entity as PersonRecord).name;
    }
    
    const detailEntity = entity as PersonDetailEntity;
    switch (detailEntity.type) {
      case 'address':
        const addr = detailEntity as AddressEntity;
        return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postal || ''}`.replace(/^,\s*|,\s*$/g, '');
      case 'property':
        return typeof detailEntity.address === 'string' ? detailEntity.address : 'Property';
      case 'phone':
        return typeof detailEntity.number === 'string' ? detailEntity.number : 'Phone';
      case 'email':
        return typeof detailEntity.email === 'string' ? detailEntity.email : 'Email';
      case 'person':
        return typeof detailEntity.name === 'string' ? detailEntity.name : 'Person';
      case 'image':
        return 'Image';
      default:
        return 'Unknown';
    }
  };

  // Get entity ID for display
  const _getEntityId = (): string | undefined => {
    if (isPersonRecord) {
      return (entity as PersonRecord).mnEntityId;
    }
    return (entity as PersonDetailEntity).mnEntityId;
  };

  // // Get source for display
  // const _getSource = (): string => {
  //   if (isPersonRecord) {
  //     return (entity as PersonRecord).source;
  //   }
  //   return (entity as PersonDetailEntity).source;
  // };

  // // Check if entity is traceable
  // const _isTraceable = (): boolean => {
  //   if (isPersonRecord) {
  //     return (entity as PersonRecord).isTraceable;
  //   }
  //   return (entity as PersonDetailEntity).isTraceable;
  // };

  // // Get API person ID for person entities
  // const _getApiPersonId = (): string | undefined => {
  //   if (isPersonRecord) {
  //     return (entity as PersonRecord).apiPersonId;
  //   }
  //   const detailEntity = entity as PersonDetailEntity;
  //   return detailEntity.type === 'person' ? (typeof detailEntity.apiPersonId === 'string' ? detailEntity.apiPersonId : undefined) : undefined;
  // };

  // Get additional context information for inline display
  const getAdditionalInfo = (entity: EntityData): string[] => {
    const info: string[] = [];
    
    if (isPersonRecord) {
      const person = entity as PersonRecord;
      if (person.age) info.push(`Age: ${person.age}`);
      if (person.lives_in) info.push(`📍 ${person.lives_in}`);
      // Note: PersonRecord doesn't have phone/email properties directly
    } else {
      const detailEntity = entity as PersonDetailEntity;
      switch (detailEntity.type) {
        case 'address':
          const addr = detailEntity as AddressEntity;
          if (addr.coordinates) info.push('📍 Geocoded');
          if (addr.postal) info.push(`ZIP: ${addr.postal}`);
          break;
        case 'property':
          if (detailEntity.value) info.push(`Value: $${detailEntity.value.toLocaleString()}`);
          if (detailEntity.bedrooms) info.push(`${detailEntity.bedrooms} bed`);
          if (detailEntity.bathrooms) info.push(`${detailEntity.bathrooms} bath`);
          break;
        case 'phone':
          if (detailEntity.type === 'phone' && 'carrier' in detailEntity) {
            info.push(`Carrier: ${(detailEntity as unknown as { carrier: string }).carrier}`);
          }
          break;
        case 'email':
          if (detailEntity.type === 'email' && 'domain' in detailEntity) {
            info.push(`Domain: ${(detailEntity as unknown as { domain: string }).domain}`);
          }
          break;
      }
    }
    
    return info;
  };

  const additionalInfo = getAdditionalInfo(entity);

  return (
    <>
      <div 
         className="group relative px-2 sm:px-3 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => {
          if (onEntityClick) {
            onEntityClick(entity);
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        {/* Single horizontal row layout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {/* Primary value */}
            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate flex-1">
              {getPrimaryValue(entity)}
            </div>
            
            {/* Additional info inline */}
            {additionalInfo.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                {additionalInfo.slice(0, 2).map((info, index) => (
                  <span key={index} className="bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {info}
                  </span>
                ))}
                {additionalInfo.length > 2 && (
                  <span className="text-gray-500">+{additionalInfo.length - 2}</span>
                )}
              </div>
            )}
          </div>
          
          {/* External Link Button for person records */}
          {isPersonRecord && (entity as PersonRecord).person_link && (
            <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3 flex-shrink-0">
              <a
                href={(entity as PersonRecord).person_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-white bg-[#014463] transition-colors"
                title="View person details"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modal - only show if onEntityClick is not provided */}
      {!onEntityClick && (
        <EntityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          entity={entity}
          entityType={entityType}
          coordinates={coordinates}
          isGeocoding={isGeocoding}
          onPersonTrace={onPersonTrace}
          onAddressIntel={onAddressIntel}
        />
      )}
    </>
  );
}
