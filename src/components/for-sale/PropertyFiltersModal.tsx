'use client';

import { useState } from 'react';

interface PropertyFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    minPrice: string;
    maxPrice: string;
    minBeds: string;
    maxBeds: string;
    minBaths: string;
    maxBaths: string;
    sortBy: 'priorityscore' | 'price' | 'beds' | 'baths';
  };
  onFilterChange: (filters: Partial<PropertyFiltersModalProps['filters']>) => void;
  onApplyFilters: () => void;
}

export function PropertyFiltersModal({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange, 
  onApplyFilters 
}: PropertyFiltersModalProps) {
  const handleInputChange = (field: keyof PropertyFiltersModalProps['filters'], value: string) => {
    onFilterChange({ [field]: value });
  };

  const handleSortChange = (sortBy: PropertyFiltersModalProps['filters']['sortBy']) => {
    onFilterChange({ sortBy });
  };

  const clearFilters = () => {
    onFilterChange({
      minPrice: '',
      maxPrice: '',
      minBeds: '',
      maxBeds: '',
      minBaths: '',
      maxBaths: '',
      sortBy: 'priorityscore',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'priorityscore'
  );

  const handleApplyAndClose = () => {
    onApplyFilters();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-t-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-800 hover:text-blue-900"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Content */}
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'priorityscore' | 'price' | 'beds' | 'baths')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
              >
                <option value="priorityscore">Recommended</option>
                <option value="price">Price (Low to High)</option>
                <option value="beds">Bedrooms</option>
                <option value="baths">Bathrooms</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.minBeds}
                  onChange={(e) => handleInputChange('minBeds', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                >
                  <option value="">Min Beds</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
                <select
                  value={filters.maxBeds}
                  onChange={(e) => handleInputChange('maxBeds', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                >
                  <option value="">Max Beds</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.minBaths}
                  onChange={(e) => handleInputChange('minBaths', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                >
                  <option value="">Min Baths</option>
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                  <option value="2.5">2.5+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
                <select
                  value={filters.maxBaths}
                  onChange={(e) => handleInputChange('maxBaths', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-sm"
                >
                  <option value="">Max Baths</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer with Apply Button */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyAndClose}
              className="inline-flex w-full justify-center rounded-md bg-blue-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
