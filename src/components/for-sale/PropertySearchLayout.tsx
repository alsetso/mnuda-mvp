'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyCard, PropertyFiltersModal, PropertyModal } from './';
import { ZillowApiService, ZillowProperty, ZillowSearchResponse } from '@/features/for-sale/services/zillowApiService';
import { PropertyStatus } from './types';

interface PropertySearchLayoutProps {
  city: string;
  state: string;
  status: PropertyStatus;
  className?: string;
}

export function PropertySearchLayout({ 
  city, 
  state, 
  status, 
  className = '' 
}: PropertySearchLayoutProps) {
  const router = useRouter();
  
  // Property search state
  const [properties, setProperties] = useState<ZillowProperty[]>([]);
  const [searchResponse, setSearchResponse] = useState<ZillowSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Property modal state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  
  // Filter states - simplified to only price, beds, and baths
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    maxBeds: '',
    minBaths: '',
    maxBaths: '',
    sortBy: 'priorityscore' as 'priorityscore' | 'price' | 'beds' | 'baths',
  });

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        location: `${city}, ${state}`,
        page: currentPage,
        status: status as const,
        sortSelection: filters.sortBy,
        listing_type: 'by_agent' as const,
        doz: 'any' as const,
        ...(filters.minPrice && { minPrice: parseInt(filters.minPrice) }),
        ...(filters.maxPrice && { maxPrice: parseInt(filters.maxPrice) }),
        ...(filters.minBeds && { minBeds: parseInt(filters.minBeds) }),
        ...(filters.maxBeds && { maxBeds: parseInt(filters.maxBeds) }),
        ...(filters.minBaths && { minBaths: parseInt(filters.minBaths) }),
        ...(filters.maxBaths && { maxBaths: parseInt(filters.maxBaths) }),
      };

      const response = await ZillowApiService.searchProperties(searchParams);
      setProperties(response.results);
      setSearchResponse(response);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [city, state, status, currentPage, filters]);

  // Load properties when component mounts or filters change with 2-second delay
  useEffect(() => {
    if (city && state) {
      const timer = setTimeout(() => {
        loadProperties();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [city, state, loadProperties]);

  // Scroll detection for sticky header
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setIsScrolled(scrollTop > 60);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleBackToSearch = () => {
    const marketplaceType = status === 'forRent' ? 'for-rent' : 'for-sale';
    router.push(`/marketplace/${marketplaceType}`);
  };

  const handlePropertyClick = (zpid: string) => {
    setSelectedPropertyId(zpid);
    setShowPropertyModal(true);
  };

  const handleClosePropertyModal = () => {
    setShowPropertyModal(false);
    setSelectedPropertyId(null);
  };

  const getStatusText = () => {
    switch (status) {
      case 'forSale':
        return 'Homes for Sale';
      case 'forRent':
        return 'Homes for Rent';
      case 'recentlySold':
        return 'Recently Sold Homes';
      default:
        return 'Properties';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'forSale':
        return 'text-blue-600';
      case 'forRent':
        return 'text-green-600';
      case 'recentlySold':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Search Header */}
      <div className={`sticky top-[64px] z-40 bg-gray-100 border-b border-gray-200 transition-all duration-300 ${isScrolled ? 'shadow-lg shadow-gray-200/50' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={handleBackToSearch}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Search
                </button>
              </div>
              <h1 className={`font-bold text-gray-900 transition-all duration-300 ease-out ${isScrolled ? 'text-lg leading-tight' : 'text-2xl leading-relaxed'}`}>
                {getStatusText()} in {city}, {state}
              </h1>
              {searchResponse && (
                <div className={`transition-all duration-300 ease-out ${isScrolled ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-8 mt-2'}`}>
                  <p className="text-sm text-gray-500">
                    Showing{' '}
                    <span className={`font-semibold ${getStatusColor()}`}>
                      {((currentPage - 1) * searchResponse.resultsPerPage) + 1}
                    </span>
                    {' '}to{' '}
                    <span className={`font-semibold ${getStatusColor()}`}>
                      {Math.min(currentPage * searchResponse.resultsPerPage, searchResponse.totalResultCount)}
                    </span>
                    {' '}of{' '}
                    <span className={`font-semibold ${getStatusColor()}`}>{searchResponse.totalResultCount.toLocaleString()}</span>
                    {' '}properties
                  </p>
                </div>
              )}
            </div>
            
            {/* Quick Stats - Only show when scrolled and on desktop */}
            {isScrolled && searchResponse && (
              <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-900">{searchResponse.totalResultCount.toLocaleString()}</span>
                  <span>properties</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-1">
                  <span>Page</span>
                  <span className="font-medium text-gray-900">{currentPage}</span>
                  <span>of</span>
                  <span className="font-medium text-gray-900">{searchResponse.totalPages}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results */}
        <div className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                    <div className="h-48 md:h-56 lg:h-64 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading properties</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={loadProperties}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
                >
                  Try Again
                </button>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria or browse other Minnesota cities.
                </p>
              </div>
            ) : (
              <>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {properties.map((property) => (
                    <PropertyCard 
                      key={property.zpid} 
                      property={property} 
                      onPropertyClick={handlePropertyClick}
                      status={status}
                    />
                  ))}
                </div>
              </>
            )}
        </div>
      </div>

      {/* Floating Filters Button - Only visible on mobile */}
      <div className="xl:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={() => setShowFiltersModal(true)}
          className="inline-flex items-center px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filters Modal */}
      <PropertyFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={() => {
          setCurrentPage(1);
        }}
      />

      {/* Property Modal */}
      {selectedPropertyId && (
        <PropertyModal
          zpid={selectedPropertyId}
          isOpen={showPropertyModal}
          onClose={handleClosePropertyModal}
        />
      )}
    </div>
  );
}
