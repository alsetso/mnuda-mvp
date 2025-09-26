'use client';

import { useState } from 'react';
import { propParseService, FormattedPropertyData, parseMainProperty, PropertyDetails, PropertyImage, PriceHistoryEntry, TaxHistoryEntry } from '@/features/api/services/propParse';

interface PropResultNodeProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  propResponse: unknown;
  apiName: string;
}

export default function PropResultNode({ address, propResponse, apiName }: PropResultNodeProps) {
  const [expandedAccordions, setExpandedAccordions] = useState<{
    description: boolean;
    images: boolean;
    priceHistory: boolean;
    taxHistory: boolean;
    attributionInfo: boolean;
    listingDetails: boolean;
    additionalDetails: boolean;
  }>({
    description: false,
    images: false,
    priceHistory: false,
    taxHistory: false,
    attributionInfo: false,
    listingDetails: false,
    additionalDetails: false,
  });

  // Parse the raw response into formatted data
  const parsedData: FormattedPropertyData = propParseService.parsePropertyResponse(propResponse);
  const propertyDetails: PropertyDetails = parseMainProperty(propResponse);

  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  const toggleAccordion = (accordion: keyof typeof expandedAccordions) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [accordion]: !prev[accordion]
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: propertyDetails.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">PropResultNode</h3>
            <p className="text-xs text-gray-500">{apiName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Success</span>
          </div>
        </div>
      </div>

      {/* Address Info */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
        <div className="text-sm">
          <span className="text-gray-500">Property:</span>
          <span className="ml-2 font-medium text-gray-900">{formatAddress()}</span>
        </div>
      </div>

      {/* Property Data Summary */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Property Value */}
          {parsedData.price && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 mb-0.5">Estimated Value</h4>
              <p className="text-lg font-semibold text-gray-900">
                ${parsedData.price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Bedrooms */}
          {parsedData.bedrooms && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 mb-0.5">Bedrooms</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.bedrooms}
              </p>
            </div>
          )}

          {/* Bathrooms */}
          {parsedData.bathrooms && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 mb-0.5">Bathrooms</h4>
              <p className="text-lg font-semibold text-gray-900">
                {parsedData.bathrooms}
              </p>
            </div>
          )}

          {/* Living Area */}
          {propertyDetails.livingArea && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 mb-0.5">Living Area</h4>
              <p className="text-lg font-semibold text-gray-900">
                {propertyDetails.livingArea.toLocaleString()} {propertyDetails.livingAreaUnits || 'sqft'}
              </p>
            </div>
          )}

          {/* Lot Size */}
          {propertyDetails.lotSize && (
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 mb-0.5">Lot Size</h4>
              <p className="text-lg font-semibold text-gray-900">
                {propertyDetails.lotSize} {propertyDetails.lotSizeUnits || 'sqft'}
              </p>
            </div>
          )}

          {/* Year Built */}
          {parsedData.yearBuilt && (
            <div className="p-3">
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
        <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Property Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Home Type */}
            {propertyDetails.homeType && (
              <div className="p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Home Type</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.homeType}
                </p>
              </div>
            )}

            {/* Home Status */}
            {propertyDetails.homeStatus && (
              <div className="p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Status</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.homeStatus}
                </p>
              </div>
            )}

            {/* Last Sold Price */}
            {propertyDetails.lastSoldPrice && (
              <div className="p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Last Sold</h5>
                <p className="text-sm font-medium text-gray-900">
                  ${propertyDetails.lastSoldPrice.toLocaleString()}
                </p>
              </div>
            )}

            {/* ZPID */}
            {propertyDetails.zpid && (
              <div className="p-3">
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
        <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Location Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* County */}
            {propertyDetails.county && (
              <div className="p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">County</h5>
                <p className="text-sm font-medium text-gray-900">
                  {propertyDetails.county}
                </p>
              </div>
            )}

            {/* Coordinates */}
            {propertyDetails.latitude && propertyDetails.longitude && (
              <div className="p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Coordinates</h5>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {propertyDetails.latitude.toFixed(6)}, {propertyDetails.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description Accordion */}
      {propertyDetails.description && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('description')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Property Description
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.description ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.description && (
            <div className="mt-4 p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {propertyDetails.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Images Accordion */}
      {propertyDetails.images && propertyDetails.images.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('images')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Property Images ({propertyDetails.images.length})
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.images ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.images && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertyDetails.images.map((image: PropertyImage, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={image.caption || `Property image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium transition-opacity duration-200"
                    >
                      View Full Size
                    </a>
                  </div>
                  {image.caption && (
                    <p className="mt-2 text-xs text-gray-600 text-center">{image.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price History Accordion */}
      {propertyDetails.priceHistory && propertyDetails.priceHistory.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('priceHistory')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Price History ({propertyDetails.priceHistory.length} entries)
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.priceHistory ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.priceHistory && (
            <div className="mt-4 space-y-3">
              {propertyDetails.priceHistory.map((entry: PriceHistoryEntry, index: number) => (
                <div key={index} className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatPrice(entry.price)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.event || 'Price Change'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </div>
                      {entry.source && (
                        <div className="text-xs text-gray-500">
                          {entry.source}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tax History Accordion */}
      {propertyDetails.taxHistory && propertyDetails.taxHistory.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('taxHistory')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Tax History ({propertyDetails.taxHistory.length} years)
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.taxHistory ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.taxHistory && (
            <div className="mt-4 space-y-3">
              {propertyDetails.taxHistory.map((entry: TaxHistoryEntry, index: number) => (
                <div key={index} className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        Tax Year {entry.year}
                      </div>
                      <div className="text-sm text-gray-600">
                        Tax Paid: {formatPrice(entry.taxPaid)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Assessment: {formatPrice(entry.assessment)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attribution Info Accordion */}
      {propertyDetails.attributionInfo && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('attributionInfo')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Attribution & MLS Information
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.attributionInfo ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.attributionInfo && (
            <div className="mt-4 space-y-4">
              {/* Agent Information */}
              {(propertyDetails.attributionInfo.agentName || propertyDetails.attributionInfo.agentPhoneNumber || propertyDetails.attributionInfo.agentEmail) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Agent Information</h5>
                  <div className="border-l-4 border-blue-200 pl-3 space-y-2">
                    {propertyDetails.attributionInfo.agentName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-800 font-medium">Agent Name:</span>
                        <span className="text-sm text-blue-700">{propertyDetails.attributionInfo.agentName}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.agentPhoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-800 font-medium">Phone:</span>
                        <span className="text-sm text-blue-700">{propertyDetails.attributionInfo.agentPhoneNumber}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.agentEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-800 font-medium">Email:</span>
                        <span className="text-sm text-blue-700">{propertyDetails.attributionInfo.agentEmail}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.agentLicenseNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-800 font-medium">License:</span>
                        <span className="text-sm text-blue-700">{propertyDetails.attributionInfo.agentLicenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Broker Information */}
              {(propertyDetails.attributionInfo.brokerName || propertyDetails.attributionInfo.brokerPhoneNumber) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Broker Information</h5>
                  <div className="border-l-4 border-green-200 pl-3 space-y-2">
                    {propertyDetails.attributionInfo.brokerName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-800 font-medium">Broker Name:</span>
                        <span className="text-sm text-green-700">{propertyDetails.attributionInfo.brokerName}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.brokerPhoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-800 font-medium">Phone:</span>
                        <span className="text-sm text-green-700">{propertyDetails.attributionInfo.brokerPhoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MLS Information */}
              {(propertyDetails.attributionInfo.mlsName || propertyDetails.attributionInfo.mlsId || propertyDetails.attributionInfo.mlsDisclaimer) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">MLS Information</h5>
                  <div className="border-l-4 border-purple-200 pl-3 space-y-2">
                    {propertyDetails.attributionInfo.mlsName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-800 font-medium">MLS Name:</span>
                        <span className="text-sm text-purple-700">{propertyDetails.attributionInfo.mlsName}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.mlsId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-800 font-medium">MLS ID:</span>
                        <span className="text-sm text-purple-700">{propertyDetails.attributionInfo.mlsId}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.mlsDisclaimer && (
                      <div className="mt-2">
                        <span className="text-sm text-purple-800 font-medium">Disclaimer:</span>
                        <p className="text-xs text-purple-700 mt-1">{propertyDetails.attributionInfo.mlsDisclaimer}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Attribution Details */}
              {(propertyDetails.attributionInfo.attributionTitle || propertyDetails.attributionInfo.lastUpdated || propertyDetails.attributionInfo.trueStatus) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Additional Details</h5>
                  <div className="border-l-4 border-gray-200 pl-3 space-y-2">
                    {propertyDetails.attributionInfo.attributionTitle && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-800 font-medium">Attribution Title:</span>
                        <span className="text-sm text-gray-700">{propertyDetails.attributionInfo.attributionTitle}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.lastUpdated && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-800 font-medium">Last Updated:</span>
                        <span className="text-sm text-gray-700">{propertyDetails.attributionInfo.lastUpdated}</span>
                      </div>
                    )}
                    {propertyDetails.attributionInfo.trueStatus && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-800 font-medium">True Status:</span>
                        <span className="text-sm text-gray-700">{propertyDetails.attributionInfo.trueStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Listing Details Accordion */}
      {(propertyDetails.listingType || propertyDetails.listingSubType) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => toggleAccordion('listingDetails')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-900">
              Listing Details
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedAccordions.listingDetails ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedAccordions.listingDetails && (
            <div className="mt-4 space-y-4">
              {/* Listing Type */}
              {propertyDetails.listingType && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Listing Type</h5>
                  <div className="border-l-4 border-indigo-200 pl-3 py-2">
                    <span className="text-sm text-indigo-800 font-medium">{propertyDetails.listingType}</span>
                  </div>
                </div>
              )}

              {/* Listing Sub-Type Flags */}
              {propertyDetails.listingSubType && Object.keys(propertyDetails.listingSubType).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Listing Characteristics</h5>
                  <div className="border-l-4 border-yellow-200 pl-3 py-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {propertyDetails.listingSubType.is_FSBA && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">FSBA</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_FSBO && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">FSBO</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_bankOwned && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">Bank Owned</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_comingSoon && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">Coming Soon</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_forAuction && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">For Auction</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_foreclosure && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">Foreclosure</span>
                        </div>
                      )}
                      {propertyDetails.listingSubType.is_newHome && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-yellow-800">New Home</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Property Links */}
      {propertyDetails.url && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Property Links</h4>
          <div className="flex flex-wrap gap-3">
            {/* Zillow URL */}
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
          </div>
        </div>
      )}

      {/* Additional Details Accordion */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100">
        <button
          onClick={() => toggleAccordion('additionalDetails')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="text-sm font-medium text-gray-900">
            Additional Details
          </h4>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              expandedAccordions.additionalDetails ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedAccordions.additionalDetails && (
          <div className="mt-4 space-y-4">
            {/* Raw Response Data */}
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">Raw API Response</h5>
              <div className="border border-gray-200 rounded p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(parsedData.rawResponse, null, 2)}
                </pre>
              </div>
            </div>

            {/* Relationship Context */}
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">🔗 Relationship Context</h5>
              <div className="border-l-4 border-orange-200 pl-3 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-orange-800">API Source:</span>
                    <div className="mt-1 text-orange-700 px-2 py-1">
                      {apiName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800">Property Address:</span>
                    <div className="mt-1 text-orange-700 px-2 py-1">
                      {formatAddress()}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800">Property Value:</span>
                    <div className="mt-1 text-orange-700 px-2 py-1">
                      {propertyDetails.price ? `$${propertyDetails.price.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800">Response Type:</span>
                    <div className="mt-1 text-orange-700 px-2 py-1">
                      Property Result
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-600">
                    <strong>Note:</strong> This property result provides detailed property information. 
                    Use the property address and details to make subsequent API calls for related property or owner information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
