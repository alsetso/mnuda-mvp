'use client';

import { useState } from 'react';
import { personDetailParseService, ParsedPersonDetailData, PersonDetailEntity } from '@/lib/personDetailParse';
import { useToast } from '@/hooks/useToast';

interface PersonDetailNodeProps {
  personId: string;
  personData: unknown;
  apiName: string;
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }) => void;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string) => void;
}

export default function PersonDetailNode({ personId, personData, apiName, onAddressIntel, onPersonTrace }: PersonDetailNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['addresses', 'phones', 'emails', 'persons']));
  
  // Parse the person detail data
  const parsedData: ParsedPersonDetailData = personDetailParseService.parsePersonDetailResponse(personData as import('@/lib/personDetailParse').SkipTracePersonDetailResponse);

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
      <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">PersonDetailNode</h3>
            <p className="text-xs text-gray-400 mt-0.5">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-gray-400">Success</span>
          </div>
        </div>
      </div>

      {/* Person ID Info */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-100">
        <div className="text-sm">
          <span className="text-gray-400 font-medium">Person ID:</span>
          <span className="ml-2 font-mono text-gray-700 break-all">{personId}</span>
        </div>
        <div className="text-sm mt-1">
          <span className="text-gray-400 font-medium">Total Entities:</span>
          <span className="ml-2 text-gray-700">{parsedData.totalEntities}</span>
        </div>
      </div>

      {/* Entity Summary */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-2 sm:mb-3">Entity Summary</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {parsedData.entityCounts.properties > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.properties}</div>
              <div className="text-xs text-slate-500">Properties</div>
            </div>
          )}
          {parsedData.entityCounts.addresses > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.addresses}</div>
              <div className="text-xs text-slate-500">Addresses</div>
            </div>
          )}
          {parsedData.entityCounts.phones > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.phones}</div>
              <div className="text-xs text-slate-500">Phones</div>
            </div>
          )}
          {parsedData.entityCounts.emails > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.emails}</div>
              <div className="text-xs text-slate-500">Emails</div>
            </div>
          )}
          {parsedData.entityCounts.persons > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.persons}</div>
              <div className="text-xs text-slate-500">Persons</div>
            </div>
          )}
          {parsedData.entityCounts.images > 0 && (
            <div className="text-center p-1.5 sm:p-2 bg-slate-50 rounded">
              <div className="text-sm sm:text-base font-semibold text-slate-700">{parsedData.entityCounts.images}</div>
              <div className="text-xs text-slate-500">Images</div>
            </div>
          )}
        </div>
      </div>

      {/* Structured Entities - Collapsible Groups */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">Structured Entities</h4>
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
  onAddressIntel?: (address: { street: string; city: string; state: string; zip: string }) => void;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string) => void;
}) {
  const { withApiToast } = useToast();
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

  const getPrimaryValue = (entity: PersonDetailEntity) => {
    switch (entity.type) {
      case 'property': return entity.address || 'Property';
      case 'address': return `${entity.street || ''} ${entity.city || ''} ${entity.state || ''}`.trim() || 'Address';
      case 'phone': return entity.number || 'Phone';
      case 'email': return entity.email || 'Email';
      case 'person': return entity.name || 'Person';
      case 'image': return entity.caption || 'Image';
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
      onAddressIntel(address);
    }
  };

  const handlePersonTrace = async () => {
    if (entity.type === 'person' && entity.person_id && onPersonTrace) {
      try {
        // Import apiService dynamically to avoid circular imports
        const { apiService } = await import('@/lib/apiService');
        const personData = await withApiToast(
          'Person Details Lookup',
          () => apiService.callPersonAPI(String(entity.person_id!)),
          {
            loadingMessage: `Tracing person: ${String(entity.name)}`,
            successMessage: 'Person details retrieved successfully',
            errorMessage: 'Failed to retrieve person details'
          }
        );
        onPersonTrace(String(entity.person_id), personData, 'Person Details');
      } catch (error) {
        console.error('Person API call failed:', error);
        // Fallback to mock data if API fails
        const mockPersonData = {
          person_id: String(entity.person_id),
          name: String(entity.name),
        };
        onPersonTrace(String(entity.person_id), mockPersonData, 'Person Details');
      }
    }
  };

  return (
    <div className="px-4 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-25 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getTypeLabelColor(entity.type)}`}>
              {entity.type}
              {entity.category && ` (${entity.category})`}
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">{entity.source}</span>
          </div>
          <div className="text-sm font-semibold text-gray-800 mb-1">
            {getPrimaryValue(entity)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 text-xs text-gray-500">
            {formatEntityData(entity).slice(0, 6).map(({ key, value }) => (
              <div key={key} className="truncate">
                <span className="font-medium text-gray-400">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="ml-1 text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
            {formatEntityData(entity).length > 6 && (
              <div className="text-xs text-gray-300">
                +{formatEntityData(entity).length - 6} more fields
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {entity.type === 'address' && onAddressIntel && (
            <button
              onClick={handleAddressIntel}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
            >
              Intel
            </button>
          )}
                  {entity.type === 'person' && entity.person_id && onPersonTrace && (
                    <button
                      onClick={handlePersonTrace}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
                    >
                      Trace
                    </button>
                  )}
        </div>
      </div>
    </div>
  );
}
