'use client';

import { useState, useEffect } from 'react';
import { peopleParseService, FormattedPeopleData } from '@/features/api/services/peopleParse';
import PersonListSection from './PersonListSection';
import { useGeocoding } from '@/features/map/hooks/useGeocoding';
import RelationshipIndicator from './RelationshipIndicator';
import { NodeData } from '@/features/session/services/sessionStorage';
import { PersonRecord } from '@/features/api/services/peopleParse';
import { PersonDetailEntity } from '@/features/api/services/personDetailParse';

interface SkipTraceResultNodeProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  apiResponse: unknown;
  apiName: string;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => void;
  onEntityClick?: (entity: PersonRecord | PersonDetailEntity) => void;
  node?: NodeData;
  allNodes?: NodeData[];
}

export default function SkipTraceResultNode({ address, apiResponse, apiName, onPersonTrace, onEntityClick, node, allNodes }: SkipTraceResultNodeProps) {
  const [isExpanded] = useState(false);
  const [isRelationshipExpanded, setIsRelationshipExpanded] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const { geocodeAddress } = useGeocoding();

  // Parse people data if this is a Skip Trace response
  const peopleData: FormattedPeopleData | null = apiName === 'Skip Trace' 
    ? peopleParseService.parsePeopleResponse(apiResponse as import('@/features/api/services/peopleParse').SkipTracePeopleResponse, 'address-result-node')
    : null;

  // Auto-geocode address if coordinates not provided
  useEffect(() => {
    if (!address.coordinates && address.street && address.city && address.state && address.zip) {
      geocodeAddress(address).then(result => {
        if (result.success && result.coordinates) {
          setCoordinates(result.coordinates);
        }
      });
    } else if (address.coordinates) {
      setCoordinates(address.coordinates);
    }
  }, [address, geocodeAddress]);

  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  return (
    <div className="bg-transparent">
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">Skip Trace</h3>
            <p className="text-xs text-gray-500 truncate">{formatAddress()}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              peopleData && peopleData.totalRecords > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-500">
              {peopleData ? `${peopleData.totalRecords} found` : '0 found'}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Results - Always Visible */}
      {peopleData && peopleData.totalRecords > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{peopleData.totalRecords} person{peopleData.totalRecords !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{apiName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Person List - Always Visible */}
      {peopleData && peopleData.totalRecords > 0 && (
        <div className="px-3 py-2">
          <PersonListSection records={peopleData.people} onPersonTrace={onPersonTrace} onEntityClick={onEntityClick} />
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 py-3 space-y-3">
          {/* Address Details */}
          <div className="bg-white/20 rounded-lg p-3">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 font-medium">Address:</span>
                <p className="text-gray-800 break-words">{formatAddress()}</p>
              </div>
              {coordinates && (
                <div>
                  <span className="text-gray-500 font-medium">Coordinates:</span>
                  <p className="text-gray-800 font-mono text-xs">
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {peopleData && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-blue-800">Records Found</span>
                  <p className="text-lg font-bold text-blue-900">{peopleData.totalRecords}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-600">person{peopleData.totalRecords !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          )}


          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setIsRelationshipExpanded(!isRelationshipExpanded)}
              className="flex items-center justify-between w-full text-left hover:bg-white/20 -mx-3 px-3 py-2 rounded transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Advanced Details</span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${isRelationshipExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isRelationshipExpanded && (
              <div className="mt-3 space-y-3">
                {/* Node Relationships */}
                {node && allNodes && (
                  <RelationshipIndicator node={node} allNodes={allNodes} />
                )}

                {/* Raw Response Data */}
                <div className="bg-white/20 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Raw Response</h5>
                    <span className="text-xs text-gray-500">JSON</span>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-32 bg-white p-2 rounded border">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
