'use client';

import { useState } from 'react';

interface PersonDetailNodeProps {
  personId: string;
  personData: unknown;
  apiName: string;
}

export default function PersonDetailNode({ personId, personData, apiName }: PersonDetailNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">PersonDetailNode</h3>
            <p className="text-xs text-gray-500 mt-1">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Success</span>
          </div>
        </div>
      </div>

      {/* Person ID Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="text-sm">
          <span className="text-gray-500">Person ID:</span>
          <span className="ml-2 font-mono font-medium text-gray-900">{personId}</span>
        </div>
      </div>

      {/* Person Details */}
      {Boolean(personData && typeof personData === 'object') && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Person Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(personData as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
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
              {JSON.stringify(personData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
