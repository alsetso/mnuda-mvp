'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/features/ui/hooks/useToast';
import AddressAutocomplete from '@/features/ui/components/AddressAutocomplete';

interface StartNodeProps {
  onAddressSearch: (address: { street: string; city: string; state: string; zip: string }) => void;
  isSearching?: boolean;
  hasCompleted?: boolean;
  initialAddress?: { street: string; city: string; state: string; zip: string };
  onAddressChanged?: (address: { street: string; city: string; state: string; zip: string }) => Promise<void>;
}

export default function StartNode({ onAddressSearch, isSearching = false, hasCompleted = false, initialAddress, onAddressChanged }: StartNodeProps) {
  const [address, setAddress] = useState({
    street: initialAddress?.street || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zip: initialAddress?.zip || ''
  });
  const [hasSearched, setHasSearched] = useState(hasCompleted);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { withApiToast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced address change handler for map sync
  const handleAddressChange = useCallback((newAddress: typeof address) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      // Only trigger sync if all fields are filled and address sync function is provided
      if (newAddress.street && newAddress.city && newAddress.state && newAddress.zip && onAddressChanged) {
        try {
          await onAddressChanged({
            street: newAddress.street,
            city: newAddress.city,
            state: newAddress.state,
            zip: newAddress.zip
          });
        } catch (error) {
          console.error('Error syncing address to map:', error);
        }
      }
    }, 1000); // 1 second debounce
  }, [onAddressChanged]);

  // Handle individual field changes
  const handleFieldChange = useCallback((field: keyof typeof address, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    handleAddressChange(newAddress);
  }, [address, handleAddressChange]);

  // Handle address autocomplete selection
  const handleAddressSelect = useCallback((selectedAddress: { street: string; city: string; state: string; zip: string }) => {
    const newAddress = {
      street: selectedAddress.street,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zip: selectedAddress.zip
    };
    setAddress(newAddress);
    handleAddressChange(newAddress);
  }, [handleAddressChange]);

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


  const formatAddress = () => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };


  // Update hasSearched when hasCompleted prop changes
  useEffect(() => {
    if (hasCompleted) {
      setHasSearched(true);
    }
  }, [hasCompleted]);

  // Update address when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      const newAddress = {
        street: initialAddress.street || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        zip: initialAddress.zip || ''
      };
      
      // Only update if the address has actually changed
      setAddress(prevAddress => {
        if (
          prevAddress.street !== newAddress.street ||
          prevAddress.city !== newAddress.city ||
          prevAddress.state !== newAddress.state ||
          prevAddress.zip !== newAddress.zip
        ) {
          return newAddress;
        }
        return prevAddress;
      });
    }
  }, [initialAddress?.street, initialAddress?.city, initialAddress?.state, initialAddress?.zip, initialAddress]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-transparent">
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
              'bg-[#1dd1f5]'
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
              <AddressAutocomplete
                value={address.street}
                onChange={(value) => handleFieldChange('street', value)}
                onAddressSelect={handleAddressSelect}
                placeholder="123 Main Street"
                disabled={hasCompleted}
              />
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
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="New York"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] outline-none bg-white touch-manipulation"
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
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="NY"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] outline-none bg-white touch-manipulation"
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
                  onChange={(e) => handleFieldChange('zip', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="10001"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#1dd1f5] focus:border-[#1dd1f5] outline-none bg-white touch-manipulation"
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
                disabled={!address.street || !address.city || !address.state || !address.zip || isSearching || hasCompleted}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-medium text-white bg-[#1dd1f5] border border-transparent rounded hover:bg-[#1bc4e8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1dd1f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : hasCompleted ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Search Completed</span>
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
          /* Completed State - Simple Address Display */
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-700">Address Searched</span>
              </div>
              <div className="text-sm text-gray-700 break-words">
                {formatAddress()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
