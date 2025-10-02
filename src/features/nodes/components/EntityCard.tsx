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
  showTechnicalDetails?: boolean;
}

export default function EntityCard({ 
  entity, 
  onPersonTrace, 
  onAddressIntel,
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
  const getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-slate-100 text-slate-600';
      case 'address': return 'bg-slate-100 text-slate-600';
      case 'phone': return 'bg-slate-100 text-slate-600';
      case 'email': return 'bg-slate-100 text-slate-600';
      case 'person': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
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
  const getEntityId = (): string | undefined => {
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

  return (
    <>
      <div 
        className="group relative px-2 sm:px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Horizontal single-row layout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {/* Type badge */}
            <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium flex-shrink-0 ${getTypeLabelColor(entityType)}`}>
              <span className="hidden sm:inline">{entityType}</span>
              <span className="sm:hidden">{entityType.charAt(0).toUpperCase()}</span>
              {!isPersonRecord && (entity as PersonDetailEntity).category && (
                <span className="hidden sm:inline"> ({(entity as PersonDetailEntity).category})</span>
              )}
            </span>
            
            {/* Primary value */}
            <div className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1">
              {getPrimaryValue(entity)}
            </div>
            
            {/* Entity ID for all entities */}
            {getEntityId() && (
              <div className="text-xs text-purple-600 font-mono flex-shrink-0">
                {getEntityId()}
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
                className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
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

      {/* Modal */}
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
    </>
  );
}
