'use client';

import { useState, useEffect } from 'react';
import { peopleParseService, FormattedPeopleData } from '@/features/api/services/peopleParse';
import PersonListNode from './PersonListNode';
import { useGeocoding } from '@/features/map/hooks/useGeocoding';

interface AddressResultNodeProps {
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
  onPersonTrace?: (personId: string, personData: unknown, apiName: string, parentNodeId?: string) => void;
}

export default function AddressResultNode({ address, apiResponse, apiName, onPersonTrace }: AddressResultNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const { geocodeAddress, isLoading: isGeocoding } = useGeocoding();

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
    <div className="bg-white">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">AddressResultNode</h3>
            <p className="text-xs text-gray-400">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span className="text-xs text-gray-400">Success</span>
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="text-sm">
          <span className="text-gray-400 font-medium">Address:</span>
          <span className="ml-2 text-gray-700 break-words">{formatAddress()}</span>
        </div>
        
        {/* Coordinates */}
        <div className="mt-0.5 text-sm">
          <span className="text-gray-400 font-medium">Coordinates:</span>
          {isGeocoding ? (
            <span className="ml-2 text-gray-500">Loading...</span>
          ) : coordinates ? (
            <span className="ml-2 text-gray-700">
              {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
            </span>
          ) : (
            <span className="ml-2 text-gray-500">Not available</span>
          )}
        </div>
        
        {peopleData && (
          <div className="mt-0.5 text-sm">
            <span className="text-gray-400 font-medium">Records found:</span>
            <span className="ml-2 text-gray-700">{peopleData.totalRecords} person{peopleData.totalRecords !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Person List - Only show for Skip Trace API */}
      {peopleData && peopleData.totalRecords > 0 && (
        <PersonListNode records={peopleData.people} onPersonTrace={onPersonTrace} />
      )}

      {/* Response Data */}
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
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Relationship Section */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔗 Relationship Context</h4>
        <div className="bg-green-50 border border-green-200 rounded p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-green-800">API Source:</span>
              <div className="mt-1 text-green-700 bg-green-100 px-2 py-1 rounded">
                {apiName || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-green-800">Address:</span>
              <div className="mt-1 text-green-700 bg-green-100 px-2 py-1 rounded">
                {formatAddress()}
              </div>
            </div>
            <div>
              <span className="font-semibold text-green-800">Coordinates:</span>
              <div className="mt-1 text-green-700 bg-green-100 px-2 py-1 rounded">
                {coordinates ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}` : 'Not available'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-green-800">Response Type:</span>
              <div className="mt-1 text-green-700 bg-green-100 px-2 py-1 rounded">
                Address Result
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-600">
              <strong>Note:</strong> This address result can be used to trace people or properties. 
              Use the address information to make subsequent API calls for person details or property information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
