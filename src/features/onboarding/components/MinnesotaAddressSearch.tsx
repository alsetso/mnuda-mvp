'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { minnesotaBoundsService } from '@/features/map/services/minnesotaBoundsService';
import { MAP_CONFIG } from '@/features/map/config';

interface MinnesotaAddressSearchProps {
  value?: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onFlyTo?: (coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

export function MinnesotaAddressSearch({
  value = '',
  onChange,
  onFlyTo,
  placeholder = 'Search Minnesota address...',
  className = '',
}: MinnesotaAddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync value prop with internal state
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Debounced search
  const debouncedSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use Mapbox Geocoding API with Minnesota bounds filter
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAP_CONFIG.MAPBOX_TOKEN}&` +
        `country=us&` +
        `bbox=-97.2392,43.4994,-89.4833,49.3844&` + // Minnesota bounding box
        `limit=5&` +
        `types=address,poi`
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      const filtered = data.features
        .filter((feature: any) => {
          const coords = { lat: feature.center[1], lng: feature.center[0] };
          return minnesotaBoundsService.isWithinMinnesota(coords);
        })
        .map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center,
        }));

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 300);
  }, [debouncedSearch]);

  // Handle suggestion select
  const handleSuggestionSelect = useCallback(async (suggestion: { place_name: string; center: [number, number] }) => {
    setSearchQuery(suggestion.place_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    const coordinates = { lat: suggestion.center[1], lng: suggestion.center[0] };
    
    // Validate Minnesota bounds
    if (!minnesotaBoundsService.isWithinMinnesota(coordinates)) {
      alert('This location is not in Minnesota. Please search for addresses within Minnesota.');
      return;
    }

    // Update parent
    onChange(suggestion.place_name, coordinates);
    
    // Fly to location
    onFlyTo?.(coordinates);
  }, [onChange, onFlyTo]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
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
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl max-h-32 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            // Extract just the address part (remove state/country)
            const addressParts = suggestion.place_name.split(',').slice(0, -2);
            const shortAddress = addressParts.join(',');
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-2 py-1.5 text-[10px] text-white/90 hover:bg-white/10 transition-colors ${
                  index === selectedIndex ? 'bg-white/10' : ''
                } ${index < suggestions.length - 1 ? 'border-b border-white/5' : ''}`}
                title={suggestion.place_name}
              >
                {shortAddress}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

