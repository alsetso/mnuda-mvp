'use client';

import { useState } from 'react';
import { personDetailParseService, ParsedPersonDetailData } from '@/features/api/services/personDetailParse';
import EntityCard from './EntityCard';
import PersonModal from './PersonModal';
import { NodeData } from '@/features/session/services/sessionStorage';

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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  
  // Parse the person detail data if it's not already parsed
  let parsedData: ParsedPersonDetailData;
  try {
    // Check if personData is already parsed (has entities array)
    if (personData && typeof personData === 'object' && 'entities' in personData) {
      parsedData = personData as ParsedPersonDetailData;
      
      // Check if any entities are missing mnEntityId and regenerate them
      const needsRegeneration = parsedData.entities.some(entity => !entity.mnEntityId);
      if (needsRegeneration) {
        console.log('Regenerating mnEntityId for existing entities');
        // Re-parse the raw data to get updated entities with mnEntityId
        parsedData = personDetailParseService.parsePersonDetailResponse(parsedData.rawResponse, mnudaId || 'unknown');
      }
    } else {
      // Parse the raw person data
      parsedData = personDetailParseService.parsePersonDetailResponse(personData as Record<string, unknown>, mnudaId || 'unknown');
    }
  } catch (error) {
    console.error('Error parsing person detail data:', error);
    // Fallback to empty structure
    parsedData = {
      entities: [],
      totalEntities: 0,
      entityCounts: {
        properties: 0,
        addresses: 0,
        phones: 0,
        emails: 0,
        persons: 0,
        images: 0
      },
      rawResponse: personData as Record<string, unknown>,
      source: 'Unknown'
    };
  }
  
  // Find the person entity that has the API person ID to get its entity ID
  const personEntity = parsedData.entities?.find(entity => 
    entity.type === 'person' && entity.apiPersonId === personId
  );
  
  // Debug: Log the entity search results
  console.log('PersonDetailNode entity search:', {
    personId,
    clickedEntityId,
    clickedEntityData,
    personEntity,
    allPersonEntities: parsedData.entities?.filter(e => e.type === 'person') || [],
    parsedDataStructure: {
      hasEntities: !!parsedData.entities,
      entitiesLength: parsedData.entities?.length || 0
    }
  });
  
  // Extract person info from clickedEntityData for inline display
  const personInfo = clickedEntityData as Record<string, unknown>;
  const personName = String(personInfo?.name || 'Unknown Person');
  const personAge = personInfo?.age ? Number(personInfo.age) : undefined;
  const livesIn = personInfo?.lives_in ? String(personInfo.lives_in) : undefined;
  const usedToLiveIn = personInfo?.used_to_live_in ? String(personInfo.used_to_live_in) : undefined;
  const born = personInfo?.born ? String(personInfo.born) : undefined;
  const telephone = personInfo?.telephone ? String(personInfo.telephone) : undefined;
  

  // Group entities by type
  const groupedEntities = {
    properties: parsedData.entities?.filter(e => e.type === 'property') || [],
    addresses: parsedData.entities?.filter(e => e.type === 'address') || [],
    phones: parsedData.entities?.filter(e => e.type === 'phone') || [],
    emails: parsedData.entities?.filter(e => e.type === 'email') || [],
    persons: parsedData.entities?.filter(e => e.type === 'person') || [],
    images: parsedData.entities?.filter(e => e.type === 'image') || [],
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
            <button
              onClick={() => setIsPersonModalOpen(true)}
              className="px-3 py-1 text-xs font-medium text-white bg-[#1dd1f5] hover:bg-[#014463] rounded transition-colors"
            >
              View Details
            </button>
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
          
          {born && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">🎂</span>
              <span className="text-gray-700">Born {born}</span>
            </div>
          )}
          
          {telephone && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">📞</span>
              <span className="text-gray-700">{telephone}</span>
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
              className="text-xs text-[#1dd1f5] hover:text-[#014463] font-medium px-2 py-1 rounded hover:bg-[#1dd1f5]/10 transition-colors"
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
                <EntityCard key={`property-${index}`} entity={entity} showTechnicalDetails={showTechnicalDetails} />
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
                <EntityCard key={`address-${index}`} entity={entity} onAddressIntel={onAddressIntel} showTechnicalDetails={showTechnicalDetails} />
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
                <EntityCard key={`phone-${index}`} entity={entity} showTechnicalDetails={showTechnicalDetails} />
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
                <EntityCard key={`email-${index}`} entity={entity} showTechnicalDetails={showTechnicalDetails} />
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
                <EntityCard key={`person-${index}`} entity={entity} onPersonTrace={onPersonTrace} showTechnicalDetails={showTechnicalDetails} />
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
                <EntityCard key={`image-${index}`} entity={entity} showTechnicalDetails={showTechnicalDetails} />
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
            className="text-xs text-[#1dd1f5] hover:text-[#014463] font-medium px-2 py-1 rounded hover:bg-[#1dd1f5]/10 transition-colors"
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

       {/* Technical Details Section - Hidden by default */}
       {showTechnicalDetails && (
         <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100">
           <div className="flex items-center justify-between mb-3">
             <h4 className="text-sm font-medium text-gray-900">🔗 Technical Details</h4>
             <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Debug Info</span>
           </div>
        <div className="bg-[#1dd1f5]/10 border border-[#1dd1f5]/20 rounded p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-semibold text-[#014463]">Node ID:</span>
              <div className="mt-1 font-mono text-[#1dd1f5] bg-[#1dd1f5]/20 px-2 py-1 rounded">
                {mnudaId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#014463]">Person ID:</span>
              <div className="mt-1 font-mono text-[#1dd1f5] bg-[#1dd1f5]/20 px-2 py-1 rounded">
                {personId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#014463]">Entity ID:</span>
              <div className="mt-1 font-mono text-[#1dd1f5] bg-[#1dd1f5]/20 px-2 py-1 rounded">
                {clickedEntityId || personEntity?.mnEntityId || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#014463]">API Source:</span>
              <div className="mt-1 text-[#1dd1f5] bg-[#1dd1f5]/20 px-2 py-1 rounded">
                {apiName || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#014463]">Entity Count:</span>
              <div className="mt-1 text-[#1dd1f5] bg-[#1dd1f5]/20 px-2 py-1 rounded">
                {parsedData.entities.length} entities
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1dd1f5]/20">
            <p className="text-xs text-[#1dd1f5]">
              <strong>Note:</strong> Use these IDs to track the relationship chain and make subsequent API calls. 
              The Node ID identifies this node, and the Person ID is used for API calls. Entity IDs are only assigned to traceable entities.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Toggle button for technical details */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-t border-gray-100">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <span>{showTechnicalDetails ? 'Hide' : 'Show'} Technical Details</span>
          <svg className={`w-3 h-3 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Person Modal */}
      {isPersonModalOpen && (
        <PersonModal
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          personNode={{
            id: `person-${personId}`,
            type: 'people-result',
            personId: personId,
            personData: parsedData,
            apiName: apiName,
            timestamp: Date.now(),
            mnNodeId: mnudaId || `person-${personId}`,
            parentNodeId: undefined,
            clickedEntityId: clickedEntityId,
            clickedEntityData: clickedEntityData,
          } as NodeData}
        />
      )}
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