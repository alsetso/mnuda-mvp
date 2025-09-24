'use client';

import { useState } from 'react';
import { peopleParseService, FormattedPeopleData } from '@/lib/peopleParse';
import PersonListNode from '@/components/PersonListNode';

interface AddressResultNodeProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  apiResponse: unknown;
  apiName: string;
  onPersonTrace?: (personId: string, personData: unknown, apiName: string) => void;
}

export default function AddressResultNode({ address, apiResponse, apiName, onPersonTrace }: AddressResultNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse people data if this is a Skip Trace response
  const peopleData: FormattedPeopleData | null = apiName === 'Skip Trace' 
    ? peopleParseService.parsePeopleResponse(apiResponse as import('@/lib/peopleParse').SkipTracePeopleResponse)
    : null;

  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">AddressResultNode</h3>
            <p className="text-xs text-gray-400 mt-0.5">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span className="text-xs text-gray-400">Success</span>
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="text-sm">
          <span className="text-gray-400 font-medium">Address:</span>
          <span className="ml-2 text-gray-700">{formatAddress()}</span>
        </div>
        {peopleData && (
          <div className="mt-1 text-sm">
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Raw Response</h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        <div className={`bg-gray-50 border border-gray-200 rounded p-4 ${isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'}`}>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        {!isExpanded && (
          <div className="mt-2 text-xs text-gray-500">
            Click &quot;Expand&quot; to view full response
          </div>
        )}
      </div>
    </div>
  );
}
