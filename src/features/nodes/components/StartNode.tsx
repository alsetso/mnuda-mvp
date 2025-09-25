'use client';

import React, { useState, useEffect, useRef } from 'react';
import { geocodingService, AddressSuggestion } from '@/features/map/services/geocoding';
import { useToast } from '@/features/ui/hooks/useToast';

interface StartNodeProps {
  onAddressSearch: (address: { street: string; city: string; state: string; zip: string }) => void;
  isSearching?: boolean;
  hasCompleted?: boolean;
}

export default function StartNode({ onAddressSearch, isSearching = false, hasCompleted = false }: StartNodeProps) {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(hasCompleted);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { withApiToast } = useToast();

  const handleInputChange = (field: keyof typeof address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setSearchError(null);
    
    // Trigger suggestions for street address
    if (field === 'street' && value.length > 2) {
      setIsLoading(true);
      geocodingService.getStreetSuggestions(value)
        .then(suggestions => {
          setSuggestions(suggestions);
          setShowSuggestions(true);
        })
        .catch(error => {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (field === 'street' && value.length <= 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setAddress({
      street: suggestion.street,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAddressSearch = async () => {
    if (!address.street || !address.city || !address.state || !address.zip) {
      setSearchError('Please fill in all address fields');
      return;
    }

    setSearchError(null);
    setHasSearched(true);
    
    try {
      await withApiToast(
        'Address Search',
        () => {
          onAddressSearch(address);
          return Promise.resolve();
        },
        {
          loadingMessage: `Searching address: ${formatAddress()}`,
          successMessage: 'Address search initiated successfully',
          errorMessage: 'Failed to search address'
        }
      );
    } catch (error) {
      console.error('Address search error:', error);
      setSearchError('Failed to search address. Please try again.');
      setHasSearched(false);
    }
  };

  const handleNewSearch = () => {
    // Don't allow new search if already completed
    if (hasCompleted) return;
    
    setAddress({ street: '', city: '', state: '', zip: '' });
    setHasSearched(false);
    setSearchError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
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

  // Update hasSearched when hasCompleted prop changes
  useEffect(() => {
    if (hasCompleted) {
      setHasSearched(true);
    }
  }, [hasCompleted]);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800 truncate">Address Search</h3>
            <p className="text-xs text-gray-400">Skip Trace API</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              isSearching ? 'bg-yellow-400' : 
              hasCompleted ? 'bg-green-400' : 
              hasSearched ? 'bg-green-400' : 
              'bg-blue-400'
            }`}></div>
            <span className="text-xs text-gray-400">
              {isSearching ? 'Searching...' : 
               hasCompleted ? 'Completed' : 
               hasSearched ? 'Completed' : 
               'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-6 py-2">
        {!hasSearched && !hasCompleted ? (
          /* Search Form */
          <div className="space-y-3 sm:space-y-4">
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

            {/* Error Message */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">{searchError}</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
              <div className="text-xs text-gray-500">
                {address.street && address.city && address.state && address.zip 
                  ? 'Ready to search' 
                  : 'Fill in all fields to search'}
              </div>
              <button
                onClick={handleAddressSearch}
                disabled={!address.street || !address.city || !address.state || !address.zip || isSearching}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-transparent rounded hover:bg-[#1bc4e8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Completed State */
          <div className="space-y-3">
            {/* Searched Address Display */}
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">Searched with Skip Trace</span>
                  </div>
                  <div className="text-sm text-gray-700 break-words">
                    {formatAddress()}
                  </div>
                </div>
                {!hasCompleted && (
                  <button
                    onClick={handleNewSearch}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-[#1dd1f5] bg-[#1dd1f5]/10 border border-[#1dd1f5]/30 rounded hover:bg-[#1dd1f5]/20 transition-colors touch-manipulation min-h-[44px]"
                  >
                    New Search
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 space-y-3 sm:space-y-0">
              <div className="text-xs text-gray-500">
                Address search completed. Results will appear below.
              </div>
              {!hasCompleted && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={handleNewSearch}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-white bg-[#1dd1f5] border border-[#1dd1f5] rounded hover:bg-[#1bc4e8] transition-colors touch-manipulation min-h-[44px]"
                  >
                    Search Another Address
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
