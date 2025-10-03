'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity, AddressEntity } from '@/features/api/services/personDetailParse';
import { useToast } from '@/features/ui/hooks/useToast';
import { apiService } from '@/features/api/services/apiService';
import { useApiUsageContext } from '@/features/session/contexts/ApiUsageContext';
import { apiUsageService } from '@/features/session/services/apiUsageService';

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
  const { apiUsage, showCreditsModal } = useApiUsageContext();
  const { withApiToast } = useToast();
  const isPersonRecord = !('type' in entity);
  
  // Check if credits are exhausted
  const isCreditsExhausted = apiUsage?.isLimitReached || false;

  if (!isOpen) return null;

  // Get type label color
  const getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-gray-100 text-gray-700';
      case 'address': return 'bg-gray-100 text-gray-700';
      case 'phone': return 'bg-gray-100 text-gray-700';
      case 'email': return 'bg-gray-100 text-gray-700';
      case 'person': return 'bg-gray-100 text-gray-700';
      case 'image': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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

    // Check credits before making any API calls
    if (isCreditsExhausted || !apiUsageService.canMakeRequest()) {
      showCreditsModal();
      return;
    }

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
    
    // Check credits before making any API calls
    if (isCreditsExhausted || !apiUsageService.canMakeRequest()) {
      showCreditsModal();
      return;
    }
    
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 text-xs font-medium uppercase tracking-wider ${getTypeLabelColor(entityType)}`}>
              {entityType}
              {!isPersonRecord && (entity as PersonDetailEntity).category && ` (${(entity as PersonDetailEntity).category})`}
            </div>
            <div className="text-xs text-gray-500 font-mono">{getSource()}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Primary Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {getPrimaryValue(entity)}
            </h1>
          </div>

          {/* Entity ID */}
          {getEntityId() && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Entity ID</div>
              <div className="text-sm font-mono text-gray-900">{getEntityId()}</div>
            </div>
          )}

          {/* Details Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatEntityData(entity).map(({ key, value }) => (
                <div key={key} className="py-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className="text-sm text-gray-900 break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinates for addresses */}
          {entityType === 'address' && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Coordinates</div>
              {isGeocoding ? (
                <div className="text-sm text-gray-600">Loading coordinates...</div>
              ) : coordinates ? (
                <div className="text-sm font-mono text-gray-900">
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Not available</div>
              )}
            </div>
          )}

          {/* Entity Context */}
          {getEntityId() && (
            <div className="p-4 bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Entity Context
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider w-20">Parent:</span>
                  <span className="text-sm font-mono text-gray-900">{getParentNodeId()}</span>
                </div>
                {entityType === 'person' && getApiPersonId() && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider w-20">API ID:</span>
                    <span className="text-sm font-mono text-gray-900">{getApiPersonId()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {/* External link for person records */}
          {isPersonRecord && (entity as PersonRecord).person_link && (
            <a
              href={(entity as PersonRecord).person_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              View External
            </a>
          )}
          
          {/* Address Intel button */}
          {entityType === 'address' && onAddressIntel && (
            <button
              onClick={handleAddressIntel}
              className={`px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                isCreditsExhausted
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 ring-2 ring-red-300 credit-shake'
                  : 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-500'
              }`}
              title={isCreditsExhausted ? "Credits exhausted - click to view options" : "Get address intelligence"}
            >
              Address Intel
            </button>
          )}
          
          {/* Trace Person button */}
          {entityType === 'person' && getApiPersonId() && onPersonTrace && (
            <button
              onClick={handlePersonTrace}
              className={`px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                isCreditsExhausted
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 ring-2 ring-red-300 credit-shake'
                  : 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-500'
              }`}
              title={isCreditsExhausted ? "Credits exhausted - click to view options" : "Trace person details"}
            >
              Trace Person
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
