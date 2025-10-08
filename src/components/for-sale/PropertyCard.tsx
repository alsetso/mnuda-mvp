'use client';

import { ZillowProperty, ZillowApiService } from '@/features/for-sale/services/zillowApiService';
import NextImage from 'next/image';

interface PropertyCardProps {
  property: ZillowProperty;
  onPropertyClick?: (zpid: string) => void;
  status?: 'forSale' | 'forRent' | 'recentlySold';
}

export function PropertyCard({ property, onPropertyClick, status }: PropertyCardProps) {

  const handleCardClick = () => {
    if (onPropertyClick) {
      onPropertyClick(property.zpid);
    }
  };

  const getStatusLabel = (statusValue: string) => {
    switch (statusValue?.toUpperCase()) {
      case 'FOR_SALE':
        return 'For Sale';
      case 'FOR_RENT':
        return 'For Rent';
      case 'RECENTLY_SOLD':
        return 'Recently Sold';
      case 'SOLD':
        return 'Sold';
      case 'PENDING':
        return 'Pending';
      case 'COMING_SOON':
        return 'Coming Soon';
      default:
        return statusValue || 'Available';
    }
  };

  const formatPrice = (price: number) => {
    if (status === 'forRent') {
      return `$${price.toLocaleString()}/mo`;
    }
    return ZillowApiService.formatPrice(price);
  };

  const formatSquareFeet = (sqft: number) => {
    return ZillowApiService.formatSquareFeet(sqft);
  };

  // const formatLotSize = (lotSize: number) => {
  //   return ZillowApiService.formatLotSize(lotSize);
  // };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Property Image - Large, Full Width */}
      <div className="relative h-48 md:h-56 lg:h-64 bg-gray-200 overflow-hidden">
        {property.imageUrl ? (
          <NextImage
            src={property.imageUrl}
            alt={`${typeof property.address === 'string' ? property.address : 'Property'} image`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm text-gray-500">No image found</span>
            </div>
          </div>
        )}
        
        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-medium text-gray-800 bg-white bg-opacity-90 px-2 py-1 shadow-sm">
            {getStatusLabel(property.status)?.toUpperCase()}
          </span>
        </div>

        {/* Days on Market Badge - Top Right */}
        {property.daysOnZillow > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-medium text-gray-600 bg-white bg-opacity-90 px-2 py-1 shadow-sm">
              {property.daysOnZillow} DAYS
            </span>
          </div>
        )}

      </div>

      {/* Property Details - Below Image */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-2">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(property.price)}
          </span>
        </div>

        {/* Property Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {property.bedrooms} bd
            </span>
          )}
          
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              {property.bathrooms} ba
            </span>
          )}
          
          {property.squareFeet > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {formatSquareFeet(property.squareFeet)}
            </span>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-gray-700 mb-2">
          {typeof property.address === 'string' ? property.address : 'Address not available'}
        </div>

        {/* Property Type and Location */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {property.propertyType && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {property.propertyType}
            </span>
          )}
          
          <div className="text-xs text-gray-400">
            {typeof property.city === 'string' ? property.city : 'City'}, {typeof property.state === 'string' ? property.state : 'State'}
          </div>
        </div>
      </div>
    </div>
  );
}
