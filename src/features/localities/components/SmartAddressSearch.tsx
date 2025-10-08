/**
 * Context-aware address search component
 * Automatically adjusts placement, styling, and messaging based on page type
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PropertyModal } from '@/components/for-sale';

// Transform Zillow API response to PropertyModal expected format
function transformZillowResponse(data: Record<string, unknown>) {
  // Handle nested address object
  const addressObj = data.address || {};
  
  // Helper function to safely convert to string
  const safeString = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value === null || value === undefined) return '';
    return String(value);
  };
  
  // Helper function to safely convert to number
  const safeNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  return {
    zpid: safeString(data.zpid),
    address: safeString((addressObj as Record<string, unknown>).streetAddress as string || data.streetAddress),
    city: safeString((addressObj as Record<string, unknown>).city as string || data.city),
    state: safeString((addressObj as Record<string, unknown>).state as string || data.state),
    zipcode: safeString((addressObj as Record<string, unknown>).zipcode as string || data.zipcode),
    price: safeNumber(data.price),
    bedrooms: safeNumber(data.bedrooms),
    bathrooms: safeNumber(data.bathrooms),
    squareFeet: safeNumber(data.livingArea || data.livingAreaValue),
    lotSize: safeNumber(data.lotSize || data.lotAreaValue),
    propertyType: safeString(data.propertyTypeDimension || data.homeType),
    listingType: safeString(data.listingTypeDimension),
    status: safeString(data.homeStatus),
    daysOnZillow: safeNumber(data.daysOnZillow),
    imageUrl: safeString(data.hiResImageLink || data.desktopWebHdpImageLink || data.imgSrc),
    imageUrls: Array.isArray(data.originalPhotos) ? data.originalPhotos.map((photo: Record<string, unknown>) => safeString(photo.url)).filter(Boolean) : [],
    description: safeString(data.description),
    yearBuilt: safeNumber(data.yearBuilt),
    latitude: safeNumber(data.latitude),
    longitude: safeNumber(data.longitude),
    detailUrl: safeString(data.hdpUrl),
    neighborhood: safeString(data.neighborhood),
    county: safeString(data.county),
    homeType: safeString(data.homeType),
    homeStatus: safeString(data.homeStatus),
    // Additional fields that might be useful
    zestimate: safeNumber(data.zestimate),
    taxHistory: Array.isArray(data.taxHistory) ? data.taxHistory : [],
    priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
    schools: Array.isArray(data.schools) ? data.schools : [],
    hoaFee: safeNumber(data.monthlyHoaFee),
    propertyTax: safeNumber(data.propertyTax),
    parking: safeString(data.parking),
    heating: safeString(data.heating),
    cooling: safeString(data.cooling),
    // Keep original data for debugging
    _originalData: data
  };
}

interface SmartAddressSearchProps {
  pageType: 'city-landing' | 'property-search' | 'county' | 'zip';
  localityName: string;
  className?: string;
}

interface AddressSearchResult {
  zpid: string;
  address: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  propertyType?: string;
  listingStatus?: string;
  daysOnZillow?: number;
  isFeatured?: boolean;
  shouldHighlight?: boolean;
  availabilityDate?: string;
  rentZestimate?: number;
  latitude?: number;
  longitude?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  currency?: string;
  description?: string;
  homeStatus?: string;
  homeType?: string;
  imgSrc?: string;
  detailUrl?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  taxHistory?: Array<{
    date: string;
    taxPaid: number;
  }>;
  monthlyHoa?: number;
  yearlyTax?: number;
  pricePerSqft?: number;
  zestimate?: number;
  openHouse?: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;
}

interface AddressSuggestion {
  text: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  zpid: string | null;
}

export default function SmartAddressSearch({ 
  pageType, 
  localityName, 
  className = '' 
}: SmartAddressSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<AddressSearchResult | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Debounced autocomplete search
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/geocode/autocomplete?q=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounce the autocomplete search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchSuggestions]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (addressToSearch?: string) => {
    const searchAddress = addressToSearch || searchQuery.trim();
    
    if (!searchAddress) {
      setError('Please enter an address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `/api/zillow/search-address?address=${encodeURIComponent(searchAddress)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search address');
      }

      const data = await response.json();
      
      if (data && (data.zpid || data.address)) {
        // Transform the Zillow API response to match PropertyModal expectations
        const transformedData = transformZillowResponse(data);
        setSearchResults(transformedData);
        setShowPropertyModal(true);
        setIsExpanded(false);
        setSearchQuery('');
      } else {
        setError('No property found for this address');
      }
    } catch {
      setError('Failed to search address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    handleSearch(suggestion.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setError('');
      setSearchQuery('');
    }
  };

  // Context-aware configuration
  const getConfig = () => {
    switch (pageType) {
      case 'city-landing':
        return {
          title: `Looking for a specific address in ${localityName}?`,
          subtitle: 'Search by full address to find exact property details',
          buttonText: 'Search Address',
          containerClass: 'bg-white border-b border-gray-200',
          buttonClass: 'text-gray-600 hover:text-[#014463]',
          expandedClass: 'mt-6'
        };
      case 'property-search':
        return {
          title: 'Search Specific Address',
          subtitle: 'Find exact property details',
          buttonText: 'Address Search',
          containerClass: 'bg-gray-50 border border-gray-200 rounded-lg',
          buttonClass: 'text-sm text-[#014463] hover:text-[#0a5a7a] font-medium',
          expandedClass: 'mt-3'
        };
      case 'county':
        return {
          title: `Find a specific property in ${localityName} County`,
          subtitle: 'Search by full address for exact property details',
          buttonText: 'Search Address',
          containerClass: 'bg-white border-b border-gray-200',
          buttonClass: 'text-gray-600 hover:text-[#014463]',
          expandedClass: 'mt-4'
        };
      case 'zip':
        return {
          title: `Find a specific property in ZIP ${localityName}`,
          subtitle: 'Search by full address for exact property details',
          buttonText: 'Search Address',
          containerClass: 'bg-white border-b border-gray-200',
          buttonClass: 'text-gray-600 hover:text-[#014463]',
          expandedClass: 'mt-4'
        };
      default:
        return {
          title: 'Search Specific Address',
          subtitle: 'Find exact property details',
          buttonText: 'Search Address',
          containerClass: 'bg-white border-b border-gray-200',
          buttonClass: 'text-gray-600 hover:text-[#014463]',
          expandedClass: 'mt-4'
        };
    }
  };

  const config = getConfig();

  return (
    <>
      <div className={`${config.containerClass} ${className}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <button
                onClick={handleToggle}
                className={`flex items-center transition-colors ${config.buttonClass}`}
              >
                <svg 
                  className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-medium">
                  {isExpanded ? 'Hide' : config.buttonText}
                </span>
              </button>
              
              {!isExpanded && (
                <p className="text-xs text-gray-500 mt-1">
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className={`${config.expandedClass} space-y-3`}>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setError('');
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter full address (e.g., 123 Main St, Minneapolis, MN 55401)"
                    className="w-full px-6 py-4 text-lg font-semibold bg-transparent focus:outline-none"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  
                  {/* Loading indicator for suggestions */}
                  {isLoadingSuggestions && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-6 py-3 bg-[#014463] text-white rounded-lg font-medium hover:bg-[#0a5a7a] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Debug: showSuggestions={showSuggestions.toString()}, suggestions.length={suggestions.length}
                </div>
              )}

              {/* Inline Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.address}-${index}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        index === selectedSuggestionIndex ? 'bg-blue-50 text-[#014463]' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                          </div>
                        </div>
                        {suggestion.zpid && (
                          <div className="ml-2 flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Property
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Property Modal */}
      {showPropertyModal && searchResults && (
        <PropertyModal
          zpid={searchResults.zpid}
          propertyData={searchResults as unknown as Record<string, unknown>}
          isOpen={showPropertyModal}
          onClose={() => {
            setShowPropertyModal(false);
            setSearchResults(null);
          }}
        />
      )}
    </>
  );
}
