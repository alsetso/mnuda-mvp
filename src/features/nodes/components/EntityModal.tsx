'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity, AddressEntity } from '@/features/api/services/personDetailParse';
import { useToast } from '@/features/ui/hooks/useToast';
import { apiService } from '@/features/api/services/apiService';

// Union type for all possible entity types
type EntityData = PersonRecord | PersonDetailEntity;

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: EntityData;
  entityType: string;
  coordinates?: { latitude: number; longitude: number } | null;
  isGeocoding?: boolean;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
}

export default function EntityModal({
  isOpen,
  onClose,
  entity,
  entityType,
  coordinates,
  isGeocoding = false,
  onPersonTrace,
  onAddressIntel
}: EntityModalProps) {
  const { withApiToast } = useToast();
  const isPersonRecord = !('type' in entity);

  if (!isOpen) return null;

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

  // Get source for display
  const getSource = (): string => {
    if (isPersonRecord) {
      return (entity as PersonRecord).source;
    }
    return (entity as PersonDetailEntity).source;
  };

  // Get API person ID for person entities
  const getApiPersonId = (): string | undefined => {
    if (isPersonRecord) {
      return (entity as PersonRecord).apiPersonId;
    }
    const detailEntity = entity as PersonDetailEntity;
    return detailEntity.type === 'person' ? (typeof detailEntity.apiPersonId === 'string' ? detailEntity.apiPersonId : undefined) : undefined;
  };

  // Get parent node ID
  const getParentNodeId = (): string => {
    if (isPersonRecord) {
      return (entity as PersonRecord).parentNodeId;
    }
    return (entity as PersonDetailEntity).parentNodeId;
  };

  // Format entity data for display
  const formatEntityData = (entity: EntityData) => {
    if (isPersonRecord) {
      const person = entity as PersonRecord;
      const data: Array<{ key: string; value: unknown }> = [];
      
      if (person.age) data.push({ key: 'age', value: person.age });
      if (person.lives_in) data.push({ key: 'lives_in', value: person.lives_in });
      if (person.used_to_live_in) data.push({ key: 'used_to_live_in', value: person.used_to_live_in });
      if (person.related_to) data.push({ key: 'related_to', value: person.related_to });
      if (person.apiPersonId) data.push({ key: 'apiPersonId', value: person.apiPersonId });
      
      return data;
    }

    const detailEntity = entity as PersonDetailEntity;
    const data: Array<{ key: string; value: unknown }> = [];
    
    // Add all non-standard properties
    Object.entries(detailEntity).forEach(([key, value]) => {
      if (!['type', 'category', 'source', 'mnEntityId', 'parentNodeId', 'isTraceable'].includes(key) && value !== undefined) {
        data.push({ key, value });
      }
    });
    
    return data;
  };

  // Handle person trace action
  const handlePersonTrace = async () => {
    const apiPersonId = getApiPersonId();
    if (!apiPersonId || !onPersonTrace) return;

    try {
      const personData = await withApiToast(
        'Person Details Lookup',
        () => apiService.callPersonAPI(apiPersonId),
        {
          loadingMessage: `Tracing person: ${getPrimaryValue(entity)}`,
          successMessage: 'Person details retrieved successfully',
          errorMessage: 'Failed to retrieve person details'
        }
      );
      
      onPersonTrace(apiPersonId, personData, 'Person Details', getParentNodeId(), getEntityId(), entity);
    } catch (error) {
      console.error('Person API call failed:', error);
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        // Don't create a node for rate limit errors - just show the error
        console.error('Rate limit exceeded, not creating person detail node');
        return;
      }
      
      // Fallback to mock data for other API failures
      const mockPersonData = {
        apiPersonId: apiPersonId,
        name: getPrimaryValue(entity),
      };
      onPersonTrace(apiPersonId, mockPersonData, 'Person Details', getParentNodeId(), getEntityId(), entity);
    }
  };

  // Handle address intel action
  const handleAddressIntel = () => {
    if (entityType !== 'address' || !onAddressIntel) return;
    
    const addressEntity = entity as AddressEntity;
    if (addressEntity.street && addressEntity.city && addressEntity.state) {
      onAddressIntel({
        street: addressEntity.street,
        city: addressEntity.city,
        state: addressEntity.state,
        zip: addressEntity.postal || ''
      }, getEntityId());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <span className={`text-sm px-3 py-1 rounded font-medium ${getTypeLabelColor(entityType)}`}>
                {entityType}
                {!isPersonRecord && (entity as PersonDetailEntity).category && ` (${(entity as PersonDetailEntity).category})`}
              </span>
              <span className="text-sm text-gray-500">{getSource()}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Primary value */}
          <div className="text-lg font-semibold text-gray-800 mb-4">
            {getPrimaryValue(entity)}
          </div>

          {/* Entity ID */}
          {getEntityId() && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm font-medium text-purple-800 mb-1">Entity ID</div>
              <div className="text-sm font-mono text-purple-700">{getEntityId()}</div>
            </div>
          )}

          {/* All entity data */}
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-gray-800">Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {formatEntityData(entity).map(({ key, value }) => (
                <div key={key} className="flex flex-col">
                  <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className="text-gray-800 mt-1 break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinates for addresses */}
          {entityType === 'address' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Coordinates</div>
              {isGeocoding ? (
                <span className="text-sm text-blue-600">Loading...</span>
              ) : coordinates ? (
                <span className="text-sm text-blue-700">
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </span>
              ) : (
                <span className="text-sm text-blue-600">Not available</span>
              )}
            </div>
          )}

          {/* Entity context for traceable entities */}
          {getEntityId() && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-800 mb-2">🔗 Entity Context</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Parent Node:</span>
                  <span className="ml-2 font-mono text-gray-800">{getParentNodeId()}</span>
                </div>
                {entityType === 'person' && getApiPersonId() && (
                  <div>
                    <span className="text-gray-600">API Person ID:</span>
                    <span className="ml-2 font-mono text-gray-800">{getApiPersonId()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            {/* External link for person records */}
            {isPersonRecord && (entity as PersonRecord).person_link && (
              <a
                href={(entity as PersonRecord).person_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors"
              >
                View External
              </a>
            )}
            
            {/* Address Intel button */}
            {entityType === 'address' && onAddressIntel && (
              <button
                onClick={handleAddressIntel}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors"
              >
                Address Intel
              </button>
            )}
            
            {/* Trace Person button */}
            {entityType === 'person' && getApiPersonId() && onPersonTrace && (
              <button
                onClick={handlePersonTrace}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-300 transition-colors"
              >
                Trace Person
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
