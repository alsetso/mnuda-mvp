'use client';

import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';

export interface DetailSection {
  id: string;
  title: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  collapsible: boolean;
  data: SectionData;
}

export interface SectionData {
  summary: string;
  render: () => React.ReactNode;
}

interface StructuredDataSectionProps {
  section: DetailSection;
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
}

export default function StructuredDataSection({ 
  section, 
  isExpanded, 
  onToggle 
}: StructuredDataSectionProps) {
  const handleToggle = () => {
    if (section.collapsible) {
      onToggle(section.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (section.collapsible && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <div 
        className={`flex items-start justify-between p-4 sm:p-6 ${section.collapsible ? 'cursor-pointer hover:bg-gray-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#014463]/20 focus:ring-inset' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={section.collapsible ? 0 : -1}
        role={section.collapsible ? 'button' : undefined}
        aria-expanded={section.collapsible ? isExpanded : undefined}
        aria-label={section.collapsible ? `Toggle ${section.title} section` : undefined}
      >
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                 {section.icon && (
                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-gradient-to-br from-[#014463]/10 to-[#1dd1f5]/10 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-sm sm:text-base">{section.icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">{section.title}</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{section.data.summary}</p>
          </div>
        </div>
        
        {section.collapsible && (
          <div className="flex-shrink-0 ml-3">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      
      {(!section.collapsible || isExpanded) && (
        <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50/30">
          {section.data.render()}
        </div>
      )}
    </div>
  );
}

// Data field component for consistent formatting
export function DataField({ 
  label, 
  value, 
  type = 'text',
  copyable = false 
}: { 
  label: string; 
  value: unknown; 
  type?: 'text' | 'number' | 'date' | 'url' | 'email' | 'phone';
  copyable?: boolean;
}) {
  const formatValue = (val: unknown, fieldType: string): string => {
    if (val === null || val === undefined) return 'N/A';
    
    switch (fieldType) {
      case 'date':
        return new Date(val as string).toLocaleDateString();
      case 'number':
        return typeof val === 'number' ? val.toLocaleString() : String(val);
      case 'url':
        return String(val);
      case 'email':
        return String(val);
      case 'phone':
        return String(val);
      default:
        return String(val);
    }
  };

  const handleCopy = () => {
    if (copyable && value) {
      navigator.clipboard.writeText(String(value));
    }
  };

  const getValueColor = (valType: string): string => {
    switch (valType) {
      case 'url': return 'text-[#1dd1f5] hover:text-[#014463]';
      case 'email': return 'text-green-600';
      case 'phone': return 'text-purple-600';
      case 'number': return 'text-orange-600';
      default: return 'text-gray-900';
    }
  };

  const getValueStyle = (valType: string): string => {
    switch (valType) {
      case 'url': return 'font-medium hover:underline cursor-pointer';
      case 'email': return 'font-medium';
      case 'phone': return 'font-mono tracking-wide';
      case 'number': return 'font-mono';
      default: return 'font-medium';
    }
  };

  return (
         <div className="group space-y-2 p-3 sm:p-4 bg-white rounded-md border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-2 min-w-0">
        <p className={`text-sm sm:text-base flex-1 min-w-0 break-words ${getValueColor(type)} ${getValueStyle(type)}`}>
          {formatValue(value, type)}
        </p>
        {copyable && !!value && (
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-[#014463] hover:bg-[#014463]/5 rounded-md transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#014463]/20"
            title={`Copy ${label} to clipboard`}
            aria-label={`Copy ${label} to clipboard`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Entity-specific data formatters
export class EntityDataFormatter {
  static formatPersonIdentity(entity: PersonRecord): SectionData {
    return {
      summary: `${entity.name}${entity.age ? `, ${entity.age} years old` : ''}`,
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DataField label="Name" value={entity.name} copyable />
          <DataField label="Age" value={entity.age} type="number" />
          <DataField label="Current Location" value={entity.lives_in} copyable />
          <DataField label="Previous Location" value={entity.used_to_live_in} copyable />
          <DataField label="Related To" value={entity.related_to} copyable />
          <DataField label="Source" value={entity.source} />
        </div>
      )
    };
  }

  static formatPersonLocation(entity: PersonRecord): SectionData {
    return {
      summary: `Location history and addresses`,
      render: () => (
        <div className="space-y-3">
          {entity.lives_in && (
            <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-lg border border-green-200/50">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-green-900">Current Location</p>
                <p className="text-sm text-green-700 mt-1 break-words">{entity.lives_in}</p>
              </div>
            </div>
          )}
          {entity.used_to_live_in && (
            <div className="flex items-start gap-3 p-4 bg-[#1dd1f5]/10 rounded-lg border border-[#1dd1f5]/20">
              <div className="w-8 h-8 rounded-lg bg-[#1dd1f5]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#014463]">Previous Location</p>
                <p className="text-sm text-[#014463] mt-1 break-words">{entity.used_to_live_in}</p>
              </div>
            </div>
          )}
        </div>
      )
    };
  }

  static formatPropertyDetails(entity: PersonDetailEntity): SectionData {
    const property = entity as PersonDetailEntity & { beds?: number; baths?: number; sqft?: number; year_built?: number; value?: number };
    return {
      summary: `${property.beds || 'N/A'} bed, ${property.baths || 'N/A'} bath, ${property.sqft ? `${property.sqft.toLocaleString()} sqft` : 'N/A'}`,
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DataField label="Bedrooms" value={property.beds} type="number" />
          <DataField label="Bathrooms" value={property.baths} type="number" />
          <DataField label="Square Feet" value={property.sqft} type="number" />
          <DataField label="Year Built" value={property.year_built} type="number" />
          <DataField label="Property Type" value={property.property_type} copyable />
          <DataField label="Lot Size" value={property.lot_size} />
          <DataField label="Address" value={property.address} copyable />
          <DataField label="City" value={property.city} copyable />
        </div>
      )
    };
  }

  static formatAddressDetails(entity: PersonDetailEntity): SectionData {
    const address = entity as PersonDetailEntity & { street?: string; city?: string; state?: string; postal?: string; category?: string };
    return {
      summary: `${address.street || 'N/A'}, ${address.city || 'N/A'}, ${address.state || 'N/A'}`,
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DataField label="Street" value={address.street} copyable />
          <DataField label="City" value={address.city} copyable />
          <DataField label="State" value={address.state} copyable />
          <DataField label="ZIP Code" value={address.postal} copyable />
          <DataField label="Category" value={address.category} />
          <DataField label="Source" value={address.source} />
        </div>
      )
    };
  }

  static formatContactInfo(entity: PersonDetailEntity): SectionData {
    const contact = entity as PersonDetailEntity & { number?: string; email?: string; carrier?: string; domain?: string };
    const isPhone = entity.type === 'phone';
    
    return {
      summary: isPhone ? `Phone: ${contact.number || 'N/A'}` : `Email: ${contact.email || 'N/A'}`,
      render: () => (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-[#1dd1f5]/10 rounded-lg border border-[#1dd1f5]/20">
            <div className="w-8 h-8 rounded-lg bg-[#1dd1f5]/20 flex items-center justify-center flex-shrink-0">
              {isPhone ? (
                <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#014463]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#014463]">
                {isPhone ? 'Phone Number' : 'Email Address'}
              </p>
              <p className={`text-sm mt-1 break-words ${isPhone ? 'font-mono tracking-wide text-[#014463]' : 'font-medium text-[#014463]'}`}>
                {isPhone ? contact.number : contact.email}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(isPhone ? (contact.number as string) : (contact.email as string))}
              className="p-1.5 text-[#1dd1f5] hover:text-[#014463] hover:bg-[#014463]/5 rounded-md transition-all duration-200 flex-shrink-0"
              title={`Copy ${isPhone ? 'phone number' : 'email address'} to clipboard`}
              aria-label={`Copy ${isPhone ? 'phone number' : 'email address'} to clipboard`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <DataField label="Category" value={contact.category} />
            <DataField label="Source" value={contact.source} />
          </div>
        </div>
      )
    };
  }

  static formatNodeInformation(node: Record<string, unknown>): SectionData {
    return {
      summary: `${node.type || 'Unknown'} node created ${node.timestamp ? new Date(node.timestamp as string | number).toLocaleDateString() : 'recently'}`,
      render: () => (
        <div className="space-y-6">
          {/* Complete Node ID Section */}
          <div className="bg-white rounded-md p-4 border border-gray-200">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">Complete Node Identification</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DataField label="Internal Node ID" value={node.id} copyable />
              <DataField label="MN Node ID" value={node.mnNodeId} copyable />
              {!!node.parentNodeId && (
                <DataField label="Parent Node ID" value={node.parentNodeId} copyable />
              )}
              {!!node.clickedEntityId && (
                <DataField label="Triggered Entity ID" value={node.clickedEntityId} copyable />
              )}
            </div>
          </div>
          
          {/* Node Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <DataField label="Node Type" value={node.type} />
            <DataField label="API Name" value={node.apiName} />
            <DataField label="Status" value={node.status || 'Completed'} />
            <DataField label="Created" value={node.timestamp} type="date" />
            {node.hasCompleted !== undefined && (
              <DataField label="Completion Status" value={node.hasCompleted ? 'Completed' : 'In Progress'} />
            )}
            {!!node.personId && (
              <DataField label="Person ID" value={node.personId} copyable />
            )}
          </div>
        </div>
      )
    };
  }

  static formatResponseData(node: Record<string, unknown>): SectionData {
    const hasResponseData = node?.response || node?.personData || node?.payload;
    
    return {
      summary: hasResponseData ? 'Raw API response data available' : 'No response data',
      render: () => {
        if (!hasResponseData) {
          return (
            <div className="text-center py-8 text-gray-500">
              <p>No response data available for this node.</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-gray-800 mb-3">Response Summary</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <DataField label="API Name" value={node.apiName || 'Unknown'} />
                <DataField label="Response Size" value={JSON.stringify(hasResponseData as unknown).length + ' characters'} />
                <DataField label="Status" value={node.status || 'Completed'} />
              </div>
            </div>
            
            {!!node.response && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-800">API Response</h5>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.response, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
                    {JSON.stringify(node.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {!!node.personData && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-800">Person Data</h5>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.personData, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
                    {JSON.stringify(node.personData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {!!node.payload && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-800">Payload Data</h5>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(node.payload, null, 2))}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
                    {JSON.stringify(node.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      }
    };
  }

  // New method for enhanced node metadata
  static formatNodeMetadata(node: Record<string, unknown>): SectionData {
    return {
      summary: 'Additional node metadata and relationships',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DataField label="Parent Node" value={node.parentNodeId || 'None'} copyable />
          <DataField label="Triggered Entity" value={node.clickedEntityId || 'None'} copyable />
          <DataField label="API Version" value={node.apiVersion || 'Unknown'} />
          <DataField label="Processing Time" value={node.processingTime ? `${node.processingTime}ms` : 'Unknown'} />
          <DataField label="Data Quality Score" value={node.dataQualityScore || 'Not calculated'} />
          <DataField label="Last Updated" value={node.lastUpdated || node.timestamp} type="date" />
        </div>
      )
    };
  }

  // New method for entity relationships
  static formatEntityRelationships(entity: PersonRecord | PersonDetailEntity): SectionData {
    const relationships: string[] = [];
    
    if (!('type' in entity)) {
      // PersonRecord relationships
      const person = entity as PersonRecord & { associated_addresses?: unknown[]; associated_phones?: unknown[]; associated_emails?: unknown[] };
      if (person.associated_addresses) relationships.push(`${person.associated_addresses.length} addresses`);
      if (person.associated_phones) relationships.push(`${person.associated_phones.length} phones`);
      if (person.associated_emails) relationships.push(`${person.associated_emails.length} emails`);
    } else {
      // PersonDetailEntity relationships
      const detailEntity = entity as PersonDetailEntity & { relatedEntities?: unknown[] };
      if (detailEntity.relatedEntities) {
        relationships.push(`${detailEntity.relatedEntities.length} related entities`);
      }
    }

    return {
      summary: relationships.length > 0 ? relationships.join(', ') : 'No relationships found',
      render: () => (
        <div className="space-y-3">
          {relationships.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relationships.map((rel, index) => (
                <span key={index} className="bg-[#1dd1f5]/20 text-[#014463] px-2 py-1 rounded text-sm">
                  {rel}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No relationship data available for this entity.</p>
          )}
        </div>
      )
    };
  }
}
