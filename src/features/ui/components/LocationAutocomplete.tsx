'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationSuggestion {
  id: string;
  city: string;
  state: string;
  zip?: string;
  county?: string;
  fullName: string;
  coordinates?: [number, number];
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: LocationSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: 'city' | 'place' | 'postcode';
}

export default function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search for a city...",
  disabled = false,
  className = "",
  type = 'place'
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 200;

  // Search for Minnesota cities/places
  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      
      if (!token) {
        throw new Error('Mapbox token not configured');
      }

      // Mapbox bounding box for Minnesota: [west, south, east, north]
      const mnBounds = '-97.2,43.5,-89.5,49.4';
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        country: 'us',
        bbox: mnBounds,
        types: type, // 'place' for cities, 'postcode' for ZIP codes
        limit: '8',
        autocomplete: 'true',
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter to ensure results are in Minnesota
      const filteredFeatures = (data.features || []).filter((feature: any) => {
        const context = feature.context || [];
        const stateContext = context.find((c: any) => c.id && c.id.startsWith('region.'));
        return stateContext && (
          stateContext.short_code === 'US-MN' || 
          stateContext.text === 'Minnesota'
        );
      });

      // Transform to LocationSuggestion format
      const locationSuggestions: LocationSuggestion[] = filteredFeatures.map((feature: any) => {
        const context = feature.context || [];
        const place = context.find((c: any) => c.id && c.id.startsWith('place.'));
        const postcode = context.find((c: any) => c.id && c.id.startsWith('postcode.'));
        const district = context.find((c: any) => c.id && c.id.startsWith('district.'));
        const region = context.find((c: any) => c.id && c.id.startsWith('region.'));
        
        return {
          id: feature.id || `location-${Math.random()}`,
          city: place?.text || feature.text || '',
          state: region?.short_code?.replace('US-', '') || 'MN',
          zip: postcode?.text || '',
          county: district?.text || '',
          fullName: feature.place_name || feature.text || '',
          coordinates: feature.center ? [feature.center[0], feature.center[1]] : undefined,
        };
      });

      setSuggestions(locationSuggestions);
      setShowSuggestions(locationSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Location autocomplete error:', err);
      setError('Failed to load location suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchSuggestions(newValue);
    }, DEBOUNCE_DELAY);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.city);
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow for clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Location search"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        role="combobox"
        aria-controls="location-suggestions"
        className={className || `w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed`}
        autoComplete="off"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="location-suggestions"
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Location suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              onKeyDown={(e) => e.key === 'Enter' && handleSuggestionSelect(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-black text-white' : 'text-gray-700'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{suggestion.city}</div>
                  <div className={`text-xs mt-0.5 ${index === selectedIndex ? 'text-gray-200' : 'text-gray-500'}`}>
                    {suggestion.county && `${suggestion.county} County`}
                    {suggestion.zip && ` • ${suggestion.zip}`}
                    {!suggestion.county && !suggestion.zip && 'Minnesota'}
                  </div>
                </div>
                <div className="text-xs ml-2">
                  📍
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



