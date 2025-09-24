'use client';

import { useState } from 'react';
import { propParseService, FormattedPropertyData, parseMainProperty, PropertyDetails } from '@/lib/propParse';

interface PropResultNodeProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  propResponse: any;
  apiName: string;
}

export default function PropResultNode({ address, propResponse, apiName }: PropResultNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse the raw response into formatted data
  const parsedData: FormattedPropertyData = propParseService.parsePropertyResponse(propResponse);
  const propertyDetails: PropertyDetails = parseMainProperty(propResponse);

  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">PropResultNode</h3>
            <p className="text-xs text-gray-500 mt-1">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Success</span>
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="text-sm">
          <span className="text-gray-500">Property:</span>
          <span className="ml-2 font-medium text-gray-900">{formatAddress()}</span>
        </div>
      </div>

      {/* Property Data Summary */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Property Value */}
          {parsedData.price && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Estimated Value</h4>
              <p className="text-lg font-semibold text-gray-900">
                ${parsedData.price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Bedrooms */}
          {parsedData.bedrooms && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Bedrooms</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.bedrooms}
              </p>
            </div>
          )}

          {/* Bathrooms */}
          {parsedData.bathrooms && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Bathrooms</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.bathrooms}
              </p>
            </div>
          )}

          {/* Square Feet */}
          {parsedData.squareFeet && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Square Feet</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.squareFeet.toLocaleString()} sq ft
              </p>
            </div>
          )}

          {/* Lot Size */}
          {parsedData.lotSize && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Lot Size</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.lotSize} acres
              </p>
            </div>
          )}

          {/* Year Built */}
          {parsedData.yearBuilt && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Year Built</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.yearBuilt}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Property Details */}
      {(propertyDetails.homeType || propertyDetails.homeStatus || propertyDetails.lastSoldPrice || propertyDetails.zpid) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Property Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Home Type */}
            {propertyDetails.homeType && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Home Type</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.homeType}
                </p>
              </div>
            )}

            {/* Home Status */}
            {propertyDetails.homeStatus && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Status</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.homeStatus}
                </p>
              </div>
            )}

            {/* Last Sold Price */}
            {propertyDetails.lastSoldPrice && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Last Sold</h5>
                <p className="text-sm font-medium text-gray-900">
                  ${propertyDetails.lastSoldPrice.toLocaleString()}
                </p>
              </div>
            )}

            {/* ZPID */}
            {propertyDetails.zpid && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">ZPID</h5>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {propertyDetails.zpid}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Details */}
      {(propertyDetails.county || propertyDetails.latitude || propertyDetails.longitude) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Location Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* County */}
            {propertyDetails.county && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">County</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.county}
                </p>
              </div>
            )}

            {/* Coordinates */}
            {propertyDetails.latitude && propertyDetails.longitude && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Coordinates</h5>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {propertyDetails.latitude.toFixed(6)}, {propertyDetails.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Links */}
      {(propertyDetails.url || propertyDetails.image) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Property Links</h4>
          <div className="flex flex-wrap gap-3">
            {/* Zillow URL */}
            {propertyDetails.url && (
              <a
                href={propertyDetails.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                View on Zillow
              </a>
            )}

            {/* Property Image */}
            {propertyDetails.image && (
              <a
                href={propertyDetails.image}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                View Image
              </a>
            )}
          </div>
        </div>
      )}

      {/* Property Description */}
      {propertyDetails.description && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-700 leading-relaxed">
              {propertyDetails.description}
            </p>
          </div>
        </div>
      )}


      {/* Raw Response Data */}
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
            {JSON.stringify(parsedData.rawResponse, null, 2)}
          </pre>
        </div>

        {!isExpanded && (
          <div className="mt-2 text-xs text-gray-500">
            Click "Expand" to view full response
          </div>
        )}
      </div>
    </div>
  );
}
