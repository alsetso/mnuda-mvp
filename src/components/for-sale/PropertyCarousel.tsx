'use client';

import { useState, useEffect } from 'react';
import { ZillowProperty, ZillowApiService } from '@/features/for-sale/services/zillowApiService';
import { PropertyCard } from './PropertyCard';
import { PropertyModal } from './PropertyModal';
import NextImage from 'next/image';

interface PropertyCarouselProps {
  city: string;
  state?: string;
  status?: 'forSale' | 'forRent';
  maxProperties?: number;
  className?: string;
  title?: string;
  showTitle?: boolean;
  isExpandable?: boolean;
}

export function PropertyCarousel({
  city,
  state = 'MN',
  status = 'forSale',
  maxProperties = 4,
  className = '',
  title,
  showTitle = true,
  isExpandable = true
}: PropertyCarouselProps) {
  const [properties, setProperties] = useState<ZillowProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<ZillowProperty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayTitle = title || `${city} Homes ${status === 'forSale' ? 'For Sale' : 'For Rent'}`;

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ZillowApiService.searchProperties({
          location: `${city}, ${state}`,
          status: status,
          page: 1,
          sortSelection: 'priorityscore'
        });

        const limitedProperties = response.results.slice(0, maxProperties);
        setProperties(limitedProperties);
      } catch (err) {
        console.error('Error fetching properties for carousel:', err);
        setError('Unable to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [city, state, status, maxProperties]);

  const handlePropertyClick = (property: ZillowProperty) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const nextProperty = () => {
    setCurrentIndex((prev) => (prev + 1) % properties.length);
  };

  const prevProperty = () => {
    setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {showTitle && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
          </div>
        )}
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="w-20 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || properties.length === 0) {
    return null; // Don't show carousel if no properties
  }

  const visibleProperties = isExpanded ? properties : properties.slice(0, 3);

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {showTitle && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
              {isExpandable && properties.length > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-[#014463] hover:text-[#0a5a7a] font-medium"
                >
                  {isExpanded ? 'Show Less' : `View All ${properties.length}`}
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="p-6">
          {properties.length === 1 ? (
            // Single property - show full card
            <div className="cursor-pointer" onClick={() => handlePropertyClick(properties[0])}>
              <PropertyCard 
                property={properties[0]} 
                status={status}
                onPropertyClick={() => handlePropertyClick(properties[0])}
              />
            </div>
          ) : (
            // Multiple properties - show compact list
            <div className="space-y-4">
              {visibleProperties.map((property, index) => (
                <div
                  key={property.zpid}
                  className="flex space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => handlePropertyClick(property)}
                >
                  {/* Property Image */}
                  <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                    {property.imageUrl ? (
                      <NextImage
                        src={property.imageUrl}
                        alt={`${property.address} image`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="80px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center">No image found</span>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {property.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {property.bedrooms} bed • {property.bathrooms} bath
                          {property.squareFeet && ` • ${ZillowApiService.formatSquareFeet(property.squareFeet)}`}
                        </p>
                        <p className="text-sm font-semibold text-[#014463]">
                          {status === 'forRent' 
                            ? `$${property.price.toLocaleString()}/mo`
                            : ZillowApiService.formatPrice(property.price)
                          }
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-[#014463] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Properties CTA */}
          {properties.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href={`/mn/${city.toLowerCase().replace(/\s+/g, '-')}/${status === 'forSale' ? 'for-sale' : 'for-rent'}`}
                className="block w-full text-center py-2 px-4 bg-[#014463] text-white rounded-lg hover:bg-[#0a5a7a] transition-colors text-sm font-medium"
              >
                View All {city} Properties
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal
          zpid={selectedProperty.zpid}
          propertyData={selectedProperty}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
