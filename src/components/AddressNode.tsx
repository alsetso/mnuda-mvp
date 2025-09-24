'use client';

import { useState, useEffect, useRef } from 'react';
import { geocodingService, AddressSuggestion } from '@/lib/geocoding';
import { apiService } from '@/lib/apiService';

interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressNodeProps {
  onApiCall?: (address: AddressData, apiName: string, response: unknown) => void;
  lastSearchedAddress?: AddressData | null;
  hasSearched?: boolean;
}

export default function AddressNode({ onApiCall, lastSearchedAddress, hasSearched }: AddressNodeProps) {
  const [address, setAddress] = useState<AddressData>({
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurlPopup, setShowCurlPopup] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(!hasSearched);
  
  // Update form state when hasSearched prop changes
  useEffect(() => {
    setShowFullForm(!hasSearched);
  }, [hasSearched]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce function
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedStreet = useDebounce(address.street, 300);

  // Fetch suggestions when street input changes
  useEffect(() => {
    if (debouncedStreet.length >= 3) {
      setIsLoading(true);
      geocodingService.getStreetSuggestions(debouncedStreet)
        .then(setSuggestions)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedStreet]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    console.log('Selected suggestion:', suggestion);
    console.log('Suggestion street field:', suggestion.street);
    console.log('Suggestion fullAddress field:', suggestion.fullAddress);
    
    setAddress({
      street: suggestion.street,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip
    });
    setShowSuggestions(false);
    
    // Log the new address state after setting
    setTimeout(() => {
      console.log('Address state after selection:', {
        street: suggestion.street,
        city: suggestion.city,
        state: suggestion.state,
        zip: suggestion.zip
      });
    }, 0);
  };

  // Handle input changes
  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'street') {
      setShowSuggestions(true);
    }
  };

  // Handle API call
  const handleApiCall = async () => {
    if (!address.street || !address.city || !address.state || !address.zip) return;
    
    console.log('API Call - Current address state:', address);
    console.log('API Call - Using Skip Trace API');
    
    setIsApiLoading(true);
    try {
      const response = await apiService.callSkipTraceAPI(address);
      
      if (response && onApiCall) {
        onApiCall(address, 'Skip Trace', response);
        // Switch to compact view after successful search
        setShowFullForm(false);
      }
    } catch (error) {
      console.error('API call failed:', error);
      // You could add error handling UI here
    } finally {
      setIsApiLoading(false);
    }
  };

  // Handle new search - switch back to full form
  const handleNewSearch = () => {
    setShowFullForm(true);
    setAddress({
      street: '',
      city: '',
      state: '',
      zip: ''
    });
  };

  // Format address for display
  const formatAddressForDisplay = (addr: AddressData) => {
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine which address to display
  const displayAddress = lastSearchedAddress || address;

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Address Search</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isApiLoading ? 'bg-yellow-400' : 
              hasSearched && !showFullForm ? 'bg-green-400' : 
              'bg-blue-400'
            }`}></div>
            <span className="text-xs text-gray-500">
              {isApiLoading ? 'Searching...' : 
               hasSearched && !showFullForm ? 'Completed' : 
               'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6">
        {showFullForm ? (
          /* Full Form View - Pre-Search */
          <div className="space-y-4 sm:space-y-6">
            {/* Street Address with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Street Address
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={address.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="123 Main Street"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white touch-manipulation"
                />
                {isLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (suggestions.length > 0 || isLoading) && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto z-20"
                >
                  {isLoading ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span>Searching addresses...</span>
                      </div>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {suggestion.fullAddress}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Address Fields - Horizontal Layout */}
            <div className="flex flex-row gap-2 sm:gap-4">
              {/* City */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  City
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white touch-manipulation"
                />
              </div>

              {/* State */}
              <div className="w-16 sm:w-20">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  State
                </label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NY"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white touch-manipulation"
                />
              </div>
              
              {/* ZIP */}
              <div className="w-20 sm:w-24">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ZIP
                </label>
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="10001"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white touch-manipulation"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
              <div className="text-xs text-gray-500">
                {address.street && address.city && address.state && address.zip 
                  ? '✓ Complete address ready for Skip Trace search' 
                  : 'Enter address details above'
                }
              </div>
              
              <button
                onClick={handleApiCall}
                disabled={!address.street || !address.city || !address.state || !address.zip || isApiLoading}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-transparent rounded hover:bg-[#1bc4e8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
              >
                {isApiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Skip Trace Search</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Compact View - Post-Search */
          <div className="space-y-4">
            {/* Searched Address Display */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Last Searched</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {formatAddressForDisplay(displayAddress)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Searched with Skip Trace
                  </div>
                </div>
                <button
                  onClick={handleNewSearch}
                  className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-[#1dd1f5] bg-[#1dd1f5]/10 border border-[#1dd1f5]/30 rounded hover:bg-[#1dd1f5]/20 transition-colors touch-manipulation min-h-[44px]"
                >
                  New Search
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 space-y-3 sm:space-y-0">
              <div className="text-xs text-gray-500">
                Search completed successfully
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleNewSearch}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-white bg-[#1dd1f5] border border-[#1dd1f5] rounded hover:bg-[#1bc4e8] transition-colors touch-manipulation min-h-[44px]"
                >
                  Search Another Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* cURL Popup */}
      {showCurlPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">cURL Command</h3>
              <button
                onClick={() => setShowCurlPopup(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border overflow-x-auto">
                {showCurlPopup}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
