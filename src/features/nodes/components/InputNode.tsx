'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/features/ui/hooks/useToast';
import AddressAutocomplete from '@/features/ui/components/AddressAutocomplete';

interface InputNodeProps {
  nodeType: 'name' | 'email' | 'phone' | 'address' | 'zillow';
  onSearch: (searchData: Record<string, string>) => void;
  isSearching?: boolean;
  hasCompleted?: boolean;
  initialData?: Record<string, string>;
}

export default function InputNode({ 
  nodeType, 
  onSearch, 
  isSearching = false, 
  hasCompleted = false, 
  initialData = {}
}: InputNodeProps) {
  const [inputData, setInputData] = useState<Record<string, string>>(initialData);
  const [hasSearched, setHasSearched] = useState(hasCompleted);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { withApiToast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update hasSearched when hasCompleted prop changes
  useEffect(() => {
    if (hasCompleted) {
      setHasSearched(true);
    }
  }, [hasCompleted]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    const timeoutId = debounceTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setInputData(prev => ({
      ...prev,
      [field]: value
    }));
    setSearchError(null);
  }, []);

  // Handle address autocomplete selection
  const handleAddressSelect = useCallback((address: { street: string; city: string; state: string; zip: string }) => {
    setInputData(prev => ({
      ...prev,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip
    }));
    setSearchError(null);
  }, []);

  const handleSearch = async () => {
    if (!canSearch()) return;

    setSearchError(null);
    setHasSearched(true);
    
    try {
      // Call the onSearch callback - this will be handled by the parent component
      // following the legacy pattern where the parent handles the API call and result node creation
      await withApiToast(
        getSearchTitle(),
        () => {
          onSearch(inputData);
          return Promise.resolve();
        },
        {
          loadingMessage: `Searching ${getSearchTitle().toLowerCase()}: ${formatSearchQuery()}`,
          successMessage: `${getSearchTitle()} initiated successfully`,
          errorMessage: `Failed to search ${getSearchTitle().toLowerCase()}`
        }
      );
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
      setHasSearched(false);
    }
  };

  const canSearch = () => {
    switch (nodeType) {
      case 'name':
        return inputData.firstName?.trim() && inputData.lastName?.trim();
      case 'email':
        return inputData.email?.trim() && inputData.email.includes('@');
      case 'phone':
        return inputData.phone?.trim();
      case 'address':
      case 'zillow':
        return inputData.street?.trim() && inputData.city?.trim() && inputData.state?.trim() && inputData.zip?.trim();
      default:
        return false;
    }
  };

  const formatSearchQuery = () => {
    switch (nodeType) {
      case 'name':
        return inputData.middleInitial 
          ? `${inputData.firstName} ${inputData.middleInitial} ${inputData.lastName}`
          : `${inputData.firstName} ${inputData.lastName}`;
      case 'email':
        return inputData.email;
      case 'phone':
        return inputData.phone;
      case 'address':
      case 'zillow':
        return `${inputData.street}, ${inputData.city}, ${inputData.state} ${inputData.zip}`;
      default:
        return '';
    }
  };

  const getNodeTitle = () => {
    switch (nodeType) {
      case 'name': return 'Name Search';
      case 'email': return 'Email Search';
      case 'phone': return 'Phone Search';
      case 'address': return 'Address Search';
      case 'zillow': return 'Zillow Search';
      default: return 'Search';
    }
  };

  const getSearchTitle = () => {
    return getNodeTitle();
  };

  const getNodeSubtitle = () => {
    switch (nodeType) {
      case 'zillow': return 'Zillow API';
      default: return 'Skip Trace API';
    }
  };

  const renderInputFields = () => {
    switch (nodeType) {
      case 'name':
        return (
          <div className="space-y-3">
            {/* Name Fields - Horizontal Layout */}
            <div className="flex flex-row gap-2 sm:gap-4">
              {/* First Name */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  type="text"
                  value={inputData.firstName || ''}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="John"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white touch-manipulation"
                />
              </div>

              {/* Middle Initial */}
              <div className="w-16 sm:w-20">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  Middle
                </label>
                <input
                  type="text"
                  value={inputData.middleInitial || ''}
                  onChange={(e) => handleFieldChange('middleInitial', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="M"
                  maxLength={1}
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
                />
              </div>
              
              {/* Last Name */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  value={inputData.lastName || ''}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="Doe"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
                />
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={inputData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                readOnly={hasCompleted}
                placeholder="john.doe@example.com"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
              />
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                value={inputData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                readOnly={hasCompleted}
                placeholder="(555) 123-4567"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
              />
            </div>
          </div>
        );

      case 'address':
      case 'zillow':
        return (
          <div className="space-y-3">
            {/* Street Address with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Street Address
              </label>
              <AddressAutocomplete
                value={inputData.street || ''}
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
                  value={inputData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="New York"
                  className="w-full px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
                />
              </div>

              {/* State */}
              <div className="w-16 sm:w-20">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  State
                </label>
                <input
                  type="text"
                  value={inputData.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="NY"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
                />
              </div>
              
              {/* ZIP */}
              <div className="w-20 sm:w-24">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ZIP
                </label>
                <input
                  type="text"
                  value={inputData.zip || ''}
                  onChange={(e) => handleFieldChange('zip', e.target.value)}
                  readOnly={hasCompleted}
                  placeholder="10001"
                  className="w-full px-2 sm:px-3 py-3 sm:py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#014463] outline-none bg-white touch-manipulation"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-transparent">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{getNodeTitle()}</h3>
            <p className="text-xs text-gray-500">{getNodeSubtitle()}</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              isSearching ? 'bg-yellow-600' : 
              hasCompleted ? 'bg-green-600' : 
              hasSearched ? 'bg-green-600' : 
              'bg-blue-600'
            }`}></div>
            <span className="text-xs text-gray-500">
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
          <div className="space-y-3">
            {renderInputFields()}

            {/* Error Message */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-600">{searchError}</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-200 space-y-2 sm:space-y-0">
              <div className="text-xs text-gray-500">
                {canSearch() 
                  ? 'Ready to search' 
                  : 'Fill in the required fields to search'}
              </div>
              <button
                onClick={handleSearch}
                disabled={!canSearch() || isSearching || hasCompleted}
                className={`w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px]`}
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
                    <span>Search {getNodeTitle()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Completed State - Simple search query display */
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-600">Search Completed</span>
              </div>
              <div className="text-sm text-gray-700 break-words">
                {formatSearchQuery()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}