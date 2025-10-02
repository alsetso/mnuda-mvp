'use client';

import { useState, useEffect } from 'react';
import { NodeData } from '@/features/session/services/sessionStorage';
import { useGeocoding } from '@/features/map/hooks/useGeocoding';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personNode: NodeData;
}

export default function PersonModal({ isOpen, onClose, personNode }: PersonModalProps) {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { geocodeAddress, isLoading: isGeocoding } = useGeocoding();

  const personData = personNode.personData as { entityCounts?: Record<string, number>; entities?: unknown[] };
  const entityCounts = personData?.entityCounts || {};
  const entities = personData?.entities || [];
  const totalEntities = entityCounts.addresses + entityCounts.phones + entityCounts.emails + entityCounts.persons + entityCounts.properties + entityCounts.images;

  // Extract person basic info from clickedEntityData (same as PersonDetailNode)
  const personInfo = personNode.clickedEntityData as Record<string, unknown>;
  const personName = String(personInfo?.name || personNode.personId || 'Unknown Person');
  const personAge = personInfo?.age ? Number(personInfo.age) : undefined;
  const currentResidence = personInfo?.lives_in ? String(personInfo.lives_in) : undefined;
  const pastResidences = personInfo?.used_to_live_in ? String(personInfo.used_to_live_in) : undefined;

  // Auto-geocode if coordinates available
  useEffect(() => {
    if (personData && 'addresses' in personData && Array.isArray((personData as any).addresses) && (personData as any).addresses.length > 0) {
      const firstAddress = (personData as any).addresses[0];
      if (firstAddress.street && firstAddress.city && firstAddress.state) {
        geocodeAddress({
          street: firstAddress.street,
          city: firstAddress.city,
          state: firstAddress.state,
          zip: firstAddress.postal || '',
        }).then(result => {
          if (result.success && result.coordinates) {
            setCoordinates(result.coordinates);
          }
        });
      }
    }
  }, [personData, geocodeAddress]);

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

  // Group entities by type
  const groupedEntities = entities.reduce((acc: Record<string, unknown[]>, entity: Record<string, unknown>) => {
    const type = entity.type || 'person';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {});

  // Toggle accordion section
  const toggleSection = (type: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Single Line Nav */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Back to Map Arrow */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Map"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Person Name - Centered */}
              <div className="flex-1 text-center">
                <h2 className="text-lg font-semibold text-gray-900 truncate px-4">{personName}</h2>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Person Info */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{personName}</h3>
                  <p className="text-sm text-gray-500">Person ID: {personNode.personId}</p>
                  <p className="text-sm text-gray-500">Total Entities: {totalEntities}</p>
                </div>
              </div>

              {/* Person Details */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">👤</span>
                  <span className="font-semibold text-gray-800">{personName}</span>
                </div>
                
                {personAge && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">🎂</span>
                    <span className="text-gray-700">{personAge} years old</span>
                  </div>
                )}
                
                {currentResidence && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">🏠</span>
                    <span className="text-gray-700">Lives in {currentResidence}</span>
                  </div>
                )}
                
                {pastResidences && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">📍</span>
                    <span className="text-gray-700">Used to live in {pastResidences}</span>
                  </div>
                )}
              </div>

              {/* Coordinates */}
              {coordinates && (
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">Coordinates:</span>
                  <span className="ml-2">
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {/* Entity Summary */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Entity Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(entityCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                    <span className="text-sm font-medium text-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Entities - Accordion Style */}
            <div className="px-6 py-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Structured Entities</h4>
              <div className="space-y-2">
                {Object.entries(groupedEntities).map(([type, typeEntities]: [string, unknown[]]) => {
                  const isExpanded = expandedSections.has(type);
                  return (
                    <div key={type} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleSection(type)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 flex items-center justify-between transition-colors"
                      >
                        <h5 className="text-sm font-medium text-gray-800 capitalize">
                          {type} ({typeEntities.length})
                        </h5>
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
                        <div className="p-4">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {typeEntities.map((entity, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-gray-900 truncate">
                                    {entity.name || entity.email || entity.number || entity.address || 'Unknown'}
                                  </div>
                                  {entity.mnEntityId && (
                                    <div className="text-xs text-gray-500 font-mono">
                                      {entity.mnEntityId}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 ml-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeLabelColor(type)}`}>
                                    {type}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
