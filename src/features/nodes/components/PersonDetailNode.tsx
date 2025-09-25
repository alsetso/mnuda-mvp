'use client';

import { useState, useEffect } from 'react';
import { personDetailParseService, ParsedPersonDetailData, PersonDetailEntity, AddressEntity } from '@/features/api/services/personDetailParse';
import { useToast } from '@/features/ui/hooks/useToast';
import { useGeocoding } from '@/features/map/hooks/useGeocoding';

interface PersonDetailNodeProps {
  personId: string;
  personData: unknown;
  apiName: string;
  mnudaId?: string; // Add MNuda ID for parent-child relationships
  clickedEntityId?: string; // Entity ID that triggered this node
  clickedEntityData?: unknown; // The actual entity data that triggered this node
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
}

export default function PersonDetailNode({ personId, personData, apiName, mnudaId, clickedEntityId, clickedEntityData, onAddressIntel, onPersonTrace }: PersonDetailNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Debug logging
  console.log('PersonDetailNode received clickedEntityId:', clickedEntityId);
  console.log('PersonDetailNode received clickedEntityData:', clickedEntityData);
  console.log('PersonDetailNode props:', { personId, apiName, mnudaId, clickedEntityId, clickedEntityData });
  
  // Parse the person detail data
  const parsedData: ParsedPersonDetailData = personDetailParseService.parsePersonDetailResponse(personData as import('@/features/api/services/personDetailParse').SkipTracePersonDetailResponse, mnudaId || 'person-detail-node');
  
  // Find the person entity that has the API person ID to get its entity ID
  const personEntity = parsedData.entities.find(entity => 
    entity.type === 'person' && entity.apiPersonId === personId
  );
  
  // Debug: Log the entity search results
  console.log('PersonDetailNode entity search:', {
    personId,
    clickedEntityId,
    clickedEntityData,
    personEntity,
    allPersonEntities: parsedData.entities.filter(e => e.type === 'person')
  });
  
  // Extract person info from clickedEntityData for inline display
  const personInfo = clickedEntityData as Record<string, unknown>;
  const personName = String(personInfo?.name || 'Unknown Person');
  const personAge = personInfo?.age ? Number(personInfo.age) : undefined;
  const livesIn = personInfo?.lives_in ? String(personInfo.lives_in) : undefined;
  const usedToLiveIn = personInfo?.used_to_live_in ? String(personInfo.used_to_live_in) : undefined;
  

  // Group entities by type
  const groupedEntities = {
    properties: parsedData.entities.filter(e => e.type === 'property'),
    addresses: parsedData.entities.filter(e => e.type === 'address'),
    phones: parsedData.entities.filter(e => e.type === 'phone'),
    emails: parsedData.entities.filter(e => e.type === 'email'),
    persons: parsedData.entities.filter(e => e.type === 'person'),
    images: parsedData.entities.filter(e => e.type === 'image'),
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{personName}</h3>
            <p className="text-xs text-gray-400">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-gray-400">Success</span>
          </div>
        </div>
      </div>

      {/* Person Info Display */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">👤</span>
            <span className="font-semibold text-gray-800">{personName}</span>
          </div>
          
          {personAge && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">🎂</span>
              <span className="text-gray-700">{personAge} years old</span>
            </div>
          )}
          
          {livesIn && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">🏠</span>
              <span className="text-gray-700">Lives in {livesIn}</span>
            </div>
          )}
          
          {usedToLiveIn && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">📍</span>
              <span className="text-gray-700">Used to live in {usedToLiveIn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Person ID Info */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="text-sm">
          <span className="text-gray-400 font-medium">Person ID:</span>
          <span className="ml-2 font-mono text-gray-700 break-all">{personId}</span>
        </div>
        <div className="text-sm mt-0.5">
          <span className="text-gray-400 font-medium">Total Entities:</span>
          <span className="ml-2 text-gray-700">{parsedData.totalEntities}</span>
        </div>
      </div>

      {/* Triggered Entity Data */}
      {clickedEntityId && (
        <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">🎯 Triggered Entity Data</h4>
            <button
              onClick={() => setExpandedGroups(prev => {
                const newSet = new Set(prev);
                if (newSet.has('triggered-entity')) {
                  newSet.delete('triggered-entity');
                } else {
                  newSet.add('triggered-entity');
                }
                return newSet;
              })}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              {expandedGroups.has('triggered-entity') ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {expandedGroups.has('triggered-entity') && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3 sm:p-4">
              <div className="text-xs text-gray-600 mb-2">
                Entity ID: <span className="font-mono text-purple-600">{clickedEntityId}</span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                This is the entity data from the address result node that triggered this PersonDetailNode:
              </div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto bg-white border border-gray-200 rounded p-2 max-h-96 overflow-y-auto">
                {JSON.stringify(
                  clickedEntityData || {
                    entityId: clickedEntityId,
                    note: "Entity data not available",
                    explanation: "The entity data from the address result node was not passed to this PersonDetailNode",
                    suggestion: "Check if the entity data is being passed through the component chain"
                  }, 
                  null, 
                  2
                )}
              </pre>
              {!clickedEntityData && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <strong>Note:</strong> The entity data is not available. This means the entity data from the address result node was not passed to this PersonDetailNode.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Entity Summary */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">Entity Summary</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-1.5">
          {parsedData.entityCounts.properties > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.properties}</div>
              <div className="text-xs text-slate-500">Properties</div>
            </div>
          )}
          {parsedData.entityCounts.addresses > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.addresses}</div>
              <div className="text-xs text-slate-500">Addresses</div>
            </div>
          )}
          {parsedData.entityCounts.phones > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.phones}</div>
              <div className="text-xs text-slate-500">Phones</div>
            </div>
          )}
          {parsedData.entityCounts.emails > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.emails}</div>
              <div className="text-xs text-slate-500">Emails</div>
            </div>
          )}
          {parsedData.entityCounts.persons > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.persons}</div>
              <div className="text-xs text-slate-500">Persons</div>
            </div>
          )}
          {parsedData.entityCounts.images > 0 && (
            <div className="text-center p-1 sm:p-1.5 bg-slate-50 rounded">
              <div className="text-sm font-semibold text-slate-700">{parsedData.entityCounts.images}</div>
              <div className="text-xs text-slate-500">Images</div>
            </div>
          )}
        </div>
      </div>

      {/* Triggered Entity ID */}
      {clickedEntityId && (
        <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-800">🎯 Triggered by Entity:</span>
              <span className="text-sm font-mono text-green-700 bg-green-100 px-2 py-1 rounded">
                {clickedEntityId}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              This node was created by clicking on the entity with the ID above.
            </p>
          </div>
        </div>
      )}

      {/* Structured Entities - Collapsible Groups */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Structured Entities</h4>
        <div className="space-y-3">
          {/* Properties Group */}
          {groupedEntities.properties.length > 0 && (
            <EntityGroup
              title="Properties"
              count={groupedEntities.properties.length}
              color="blue"
              isExpanded={expandedGroups.has('properties')}
              onToggle={() => toggleGroup('properties')}
            >
              {groupedEntities.properties.map((entity, index) => (
                <FlatEntityCard key={`property-${index}`} entity={entity} />
              ))}
            </EntityGroup>
          )}

          {/* Addresses Group */}
          {groupedEntities.addresses.length > 0 && (
            <EntityGroup
              title="Addresses"
              count={groupedEntities.addresses.length}
              color="green"
              isExpanded={expandedGroups.has('addresses')}
              onToggle={() => toggleGroup('addresses')}
            >
              {groupedEntities.addresses.map((entity, index) => (
                <FlatEntityCard key={`address-${index}`} entity={entity} onAddressIntel={onAddressIntel} />
              ))}
            </EntityGroup>
          )}

          {/* Phones Group */}
          {groupedEntities.phones.length > 0 && (
            <EntityGroup
              title="Phone Numbers"
              count={groupedEntities.phones.length}
              color="purple"
              isExpanded={expandedGroups.has('phones')}
              onToggle={() => toggleGroup('phones')}
            >
              {groupedEntities.phones.map((entity, index) => (
                <FlatEntityCard key={`phone-${index}`} entity={entity} />
              ))}
            </EntityGroup>
          )}

          {/* Emails Group */}
          {groupedEntities.emails.length > 0 && (
            <EntityGroup
              title="Email Addresses"
              count={groupedEntities.emails.length}
              color="yellow"
              isExpanded={expandedGroups.has('emails')}
              onToggle={() => toggleGroup('emails')}
            >
              {groupedEntities.emails.map((entity, index) => (
                <FlatEntityCard key={`email-${index}`} entity={entity} />
              ))}
            </EntityGroup>
          )}

          {/* Persons Group */}
          {groupedEntities.persons.length > 0 && (
            <EntityGroup
              title="People & Associates"
              count={groupedEntities.persons.length}
              color="red"
              isExpanded={expandedGroups.has('persons')}
              onToggle={() => toggleGroup('persons')}
            >
              {groupedEntities.persons.map((entity, index) => (
                <FlatEntityCard key={`person-${index}`} entity={entity} onPersonTrace={onPersonTrace} />
              ))}
            </EntityGroup>
          )}

          {/* Images Group */}
          {groupedEntities.images.length > 0 && (
            <EntityGroup
              title="Images"
              count={groupedEntities.images.length}
              color="indigo"
              isExpanded={expandedGroups.has('images')}
              onToggle={() => toggleGroup('images')}
            >
              {groupedEntities.images.map((entity, index) => (
                <FlatEntityCard key={`image-${index}`} entity={entity} />
              ))}
            </EntityGroup>
          )}
        </div>
      </div>

      {/* Raw Response Data */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Raw Response</h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3 sm:p-4">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
              {JSON.stringify(personData, null, 2)}
            </pre>
          </div>
        )}
      </div>

       {/* Relationship Section */}
       <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100">
         <div className="flex items-center justify-between mb-3">
           <h4 className="text-sm font-medium text-gray-900">🔗 Relationship Context</h4>
           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">MNuda ID System</span>
         </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-semibold text-blue-800">Node ID:</span>
              <div className="mt-1 font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {mnudaId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Person ID:</span>
              <div className="mt-1 font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {personId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Entity ID:</span>
              <div className="mt-1 font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {clickedEntityId || personEntity?.mnEntityId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-800">API Source:</span>
              <div className="mt-1 text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {apiName || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Entity Count:</span>
              <div className="mt-1 text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {parsedData.entities.length} entities
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Note:</strong> Use these IDs to track the relationship chain and make subsequent API calls. 
              The Node ID identifies this node, and the Person ID is used for API calls. Entity IDs are only assigned to traceable entities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Entity Group component for collapsible sections
function EntityGroup({ 
  title, 
  count, 
  color, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  count: number; 
  color: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode; 
}) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'green': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'purple': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'yellow': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'red': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'indigo': return 'text-slate-700 bg-slate-50 border-slate-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="border border-gray-100 rounded overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-2.5 flex items-center justify-between ${getColorClasses(color)} hover:bg-slate-100 transition-colors`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs px-2 py-0.5 bg-white bg-opacity-60 rounded">
            {count}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// Flat Entity Card component for clean list display
function FlatEntityCard({ 
  entity, 
  onAddressIntel, 
  onPersonTrace
}: { 
  entity: PersonDetailEntity;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }, entityId?: string) => void;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
}) {
  const { withApiToast } = useToast();
  const { geocodeAddress, isLoading: isGeocoding } = useGeocoding();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-geocode address entities
  useEffect(() => {
    if (entity.type === 'address' && !entity.coordinates) {
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
    } else if (entity.type === 'address' && entity.coordinates) {
      setCoordinates(entity.coordinates as { latitude: number; longitude: number });
    }
  }, [entity, geocodeAddress]);
  const getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-slate-100 text-slate-600';
      case 'address': return 'bg-slate-100 text-slate-600';
      case 'phone': return 'bg-slate-100 text-slate-600';
      case 'email': return 'bg-slate-100 text-slate-600';
      case 'person': return 'bg-slate-100 text-slate-600';
      case 'image': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatEntityData = (entity: PersonDetailEntity) => {
    const { ...data } = entity;
    return Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({ key, value }));
  };

  const getPrimaryValue = (entity: PersonDetailEntity): string => {
    switch (entity.type) {
      case 'property': return String(entity.address || 'Property');
      case 'address': return `${entity.street || ''} ${entity.city || ''} ${entity.state || ''}`.trim() || 'Address';
      case 'phone': return String(entity.number || 'Phone');
      case 'email': return String(entity.email || 'Email');
      case 'person': return String(entity.name || 'Person');
      case 'image': return String(entity.caption || 'Image');
      default: return 'Entity';
    }
  };

  const handleAddressIntel = () => {
    if (entity.type === 'address' && onAddressIntel) {
      const address = {
        street: String(entity.street || ''),
        city: String(entity.city || ''),
        state: String(entity.state || ''),
        zip: String(entity.postal || '')
      };
      onAddressIntel(address, entity.mnEntityId);
    }
  };

  const handlePersonTrace = async () => {
    if (entity.type === 'person' && entity.apiPersonId && onPersonTrace) {
      console.log('FlatEntityCard handlePersonTrace called with:', {
        entityId: entity.mnEntityId,
        parentNodeId: entity.parentNodeId,
        apiPersonId: entity.apiPersonId,
        entityName: entity.name,
        entity: entity
      });
      
      try {
        // Import apiService dynamically to avoid circular imports
        const { apiService } = await import('@/features/api/services/apiService');
        const personData = await withApiToast(
          'Person Details Lookup',
          () => apiService.callPersonAPI(String(entity.apiPersonId!)),
          {
            loadingMessage: `Tracing person: ${String(entity.name)}`,
            successMessage: 'Person details retrieved successfully',
            errorMessage: 'Failed to retrieve person details'
          }
        );
        console.log('FlatEntityCard calling onPersonTrace with:', {
          personId: String(entity.apiPersonId),
          personData,
          apiName: 'Person Details',
          parentNodeId: entity.parentNodeId,
          entityId: entity.mnEntityId,
          entityData: entity,
          source: 'FlatEntityCard'
        });
        onPersonTrace(String(entity.apiPersonId), personData, 'Person Details', entity.parentNodeId, entity.mnEntityId, entity);
      } catch (error) {
        console.error('Person API call failed:', error);
        // Fallback to mock data if API fails
        const mockPersonData = {
          apiPersonId: String(entity.apiPersonId),
          name: String(entity.name),
        };
        console.log('FlatEntityCard calling onPersonTrace with mock data:', {
          personId: String(entity.apiPersonId),
          personData: mockPersonData,
          apiName: 'Person Details',
          parentNodeId: entity.parentNodeId,
          entityId: entity.mnEntityId,
          entityData: entity,
          source: 'FlatEntityCard'
        });
        onPersonTrace(String(entity.apiPersonId), mockPersonData, 'Person Details', entity.parentNodeId, entity.mnEntityId, entity);
      }
    }
  };

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
          <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium flex-shrink-0 ${getTypeLabelColor(entity.type)}`}>
            <span className="hidden sm:inline">{entity.type}</span>
            <span className="sm:hidden">{entity.type.charAt(0).toUpperCase()}</span>
            {entity.category && <span className="hidden sm:inline"> ({entity.category})</span>}
          </span>
          
          {/* Primary value */}
          <div className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1">
            {getPrimaryValue(entity)}
          </div>
          
          {/* Entity ID for traceable entities - hidden on mobile */}
          {entity.mnEntityId && (
            <div className="text-xs text-purple-600 font-mono flex-shrink-0 hidden sm:block">
              {entity.mnEntityId}
            </div>
          )}
        </div>
        
        {/* No action buttons in horizontal row - moved to modal */}
      </div>

      </div>

      {/* Modal with all details */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm px-3 py-1 rounded font-medium ${getTypeLabelColor(entity.type)}`}>
                    {entity.type}
                    {entity.category && ` (${entity.category})`}
                  </span>
                  <span className="text-sm text-gray-500">{entity.source}</span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
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
              {entity.mnEntityId && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-1">Entity ID</div>
                  <div className="text-sm font-mono text-purple-700">{entity.mnEntityId}</div>
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
              {entity.type === 'address' && (
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
              {entity.isTraceable && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 mb-2">🔗 Entity Context</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Parent Node:</span>
                      <span className="ml-2 font-mono text-gray-800">{entity.parentNodeId}</span>
                    </div>
                    {entity.type === 'person' && entity.apiPersonId ? (
                      <div>
                        <span className="text-gray-600">API Person ID:</span>
                        <span className="ml-2 font-mono text-gray-800">{String(entity.apiPersonId)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                {entity.type === 'address' && onAddressIntel && (
                  <button
                    onClick={handleAddressIntel}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors"
                  >
                    Address Intel
                  </button>
                )}
                {entity.type === 'person' && entity.apiPersonId && onPersonTrace ? (
                  <button
                    onClick={handlePersonTrace}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-300 transition-colors"
                  >
                    Trace Person
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
