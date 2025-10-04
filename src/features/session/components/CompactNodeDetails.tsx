'use client';

import { NodeData } from '../services/sessionStorage';
import { DataField } from './StructuredDataSection';
import { useState } from 'react';

interface CompactNodeDetailsProps {
  node: NodeData;
}

export default function CompactNodeDetails({ node }: CompactNodeDetailsProps) {
  const hasResponseData = !!(node?.response || node?.personData || node?.payload);
  const isPersonResultNode = node.type === 'people-result' && !!node.personData;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['person-summary']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Helper function to extract entities by type
  const getEntitiesByType = (type: string) => {
    if (!isPersonResultNode) return [];
    try {
      const personData = node.personData as Record<string, unknown>;
      if (personData?.entities && Array.isArray(personData.entities)) {
        return personData.entities.filter((entity: { type: string }) => entity.type === type);
      }
    } catch (error) {
      console.warn('Error filtering entities by type:', error);
    }
    return [];
  };

  // Get all entity types
  const phones = getEntitiesByType('phone');
  const emails = getEntitiesByType('email');
  const persons = getEntitiesByType('person');
  const addresses = getEntitiesByType('address');
  const properties = getEntitiesByType('property');

  // Helper component for rendering entity lists
  const EntityList = ({ entities, type }: { entities: Record<string, unknown>[], type: string }) => {
    if (entities.length === 0) return null;
    
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {entities.map((entity: Record<string, unknown>, index: number) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-md">
                {type}
              </span>
              <span className="text-sm text-gray-800">
                {(entity.name as string) || (entity.address as string) || (entity.number as string) || (entity.email as string) || (entity.mnEntityId as string) || `${type} ${index + 1}`}
              </span>
            </div>
            {(entity.mnEntityId as string) && (
              <span className="text-xs text-gray-500 font-mono">
                {entity.mnEntityId as string}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const AccordionSection = ({ 
    id, 
    title, 
    children, 
    defaultExpanded = false 
  }: { 
    id: string; 
    title: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#014463]/20 focus:ring-inset"
          aria-expanded={isExpanded}
        >
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/30">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isPersonResultNode && (
        <AccordionSection id="person-summary" title="Person Summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(() => {
              try {
                const personData = node.personData as Record<string, unknown>;
                if (personData && typeof personData === 'object') {
                  return (
                    <>
                      {personData.totalEntities && (
                        <DataField label="Total Entities" value={personData.totalEntities as number} type="number" />
                      )}
                      {personData.entityCounts && (
                        <>
                          {((personData.entityCounts as Record<string, unknown>).properties as number) > 0 && (
                            <DataField label="Properties" value={(personData.entityCounts as Record<string, unknown>).properties as number} type="number" />
                          )}
                          {((personData.entityCounts as Record<string, unknown>).addresses as number) > 0 && (
                            <DataField label="Addresses" value={(personData.entityCounts as Record<string, unknown>).addresses as number} type="number" />
                          )}
                          {((personData.entityCounts as Record<string, unknown>).phones as number) > 0 && (
                            <DataField label="Phones" value={(personData.entityCounts as Record<string, unknown>).phones as number} type="number" />
                          )}
                          {((personData.entityCounts as Record<string, unknown>).emails as number) > 0 && (
                            <DataField label="Emails" value={(personData.entityCounts as Record<string, unknown>).emails as number} type="number" />
                          )}
                          {((personData.entityCounts as Record<string, unknown>).persons as number) > 0 && (
                            <DataField label="Persons" value={(personData.entityCounts as Record<string, unknown>).persons as number} type="number" />
                          )}
                          {((personData.entityCounts as Record<string, unknown>).images as number) > 0 && (
                            <DataField label="Images" value={(personData.entityCounts as Record<string, unknown>).images as number} type="number" />
                          )}
                        </>
                      )}
                      {personData.source && (
                        <DataField label="Source" value={personData.source as string} />
                      )}
                    </>
                  );
                }
                return <div className="text-sm text-gray-500">No structured person data available</div>;
              } catch (error) {
                return <div className="text-sm text-red-500">Error parsing person data</div>;
              }
            })()}
          </div>
        </AccordionSection>
      )}

      {/* Phone Numbers */}
      {phones.length > 0 && (
        <AccordionSection id="phones" title={`Phone Numbers (${phones.length})`}>
          <EntityList entities={phones} type="phone" />
        </AccordionSection>
      )}

      {/* Email Addresses */}
      {emails.length > 0 && (
        <AccordionSection id="emails" title={`Email Addresses (${emails.length})`}>
          <EntityList entities={emails} type="email" />
        </AccordionSection>
      )}

      {/* Names & Associates */}
      {persons.length > 0 && (
        <AccordionSection id="persons" title={`Names & Associates (${persons.length})`}>
          <EntityList entities={persons} type="person" />
        </AccordionSection>
      )}

      {/* Addresses */}
      {addresses.length > 0 && (
        <AccordionSection id="addresses" title={`Addresses (${addresses.length})`}>
          <EntityList entities={addresses} type="address" />
        </AccordionSection>
      )}

      {/* Properties */}
      {properties.length > 0 && (
        <AccordionSection id="properties" title={`Properties (${properties.length})`}>
          <EntityList entities={properties} type="property" />
        </AccordionSection>
      )}

      {/* Node Identification - Moved after person entities */}
      <AccordionSection id="node-details" title="Node Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataField label="ID" value={node.id} copyable />
          <DataField label="MN ID" value={node.mnNodeId} copyable />
          <DataField label="Type" value={node.type} />
          <DataField label="API" value={node.apiName} />
          {!!node.parentNodeId && (
            <DataField label="Parent" value={node.parentNodeId} copyable />
          )}
          {!!node.clickedEntityId && (
            <DataField label="Entity" value={node.clickedEntityId} copyable />
          )}
          <DataField label="Status" value={node.status || 'Completed'} />
          <DataField label="Created" value={node.timestamp} type="date" />
        </div>
      </AccordionSection>

      {/* Triggered Entity Information */}
      {!!node.clickedEntityId && (
        <AccordionSection id="triggered-entity" title="Triggered Entity Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataField label="Entity ID" value={node.clickedEntityId} copyable />
            {!!node.clickedEntityData && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Entity Data
                </label>
                <div className="bg-gray-50 rounded-md border border-gray-200 p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(node.clickedEntityData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* Address Information */}
      {!!node.address && (
        <AccordionSection id="address" title="Address Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataField label="Street" value={node.address.street} />
            <DataField label="City" value={node.address.city} />
            <DataField label="State" value={node.address.state} />
            <DataField label="ZIP" value={node.address.zip} />
            {node.address.coordinates && (
              <>
                <DataField label="Lat" value={node.address.coordinates.latitude.toFixed(6)} />
                <DataField label="Lng" value={node.address.coordinates.longitude.toFixed(6)} />
              </>
            )}
          </div>
        </AccordionSection>
      )}

      {/* User Location Data */}
      {!!node.payload && (
        <AccordionSection id="location-data" title="Location Data">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataField label="Lat" value={node.payload.coords?.lat?.toFixed(6)} />
            <DataField label="Lng" value={node.payload.coords?.lng?.toFixed(6)} />
            {node.payload.address && (
              <>
                <DataField label="Street" value={node.payload.address.street} />
                <DataField label="City" value={node.payload.address.city} />
                <DataField label="State" value={node.payload.address.state} />
                <DataField label="ZIP" value={node.payload.address.zip} />
              </>
            )}
            {node.payload.locationHistory && (
              <DataField label="History" value={`${node.payload.locationHistory.length} entries`} />
            )}
          </div>
        </AccordionSection>
      )}


      {/* API Response Data */}
      {hasResponseData && (
        <AccordionSection id="api-response" title="API Response Data">
          <div className="space-y-3">
            {!!node.response && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Response Data</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.response, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-900 rounded-md p-3 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(node.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {!!node.personData && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Person Data (Raw)</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.personData, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-900 rounded-md p-3 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(node.personData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {!!node.payload && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Payload Data</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.payload, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-900 rounded-md p-3 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(node.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Show clickedEntityData if it exists and is different from personData */}
            {!!node.clickedEntityData && node.clickedEntityData !== node.personData && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Triggered Entity Data (Raw)</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.clickedEntityData, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-900 rounded-md p-3 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(node.clickedEntityData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* No Data State */}
      {!hasResponseData && !node.address && !node.payload && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No additional data available for this node.</p>
        </div>
      )}
    </div>
  );
}
