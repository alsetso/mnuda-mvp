'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSessionManager } from '@/features/session';
import { useToast } from '@/features/ui/hooks/useToast';
import { minnesotaBoundsService } from '../services/minnesotaBoundsService';
import { Address } from '../types';

interface SearchSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface FloatingSearchInputProps {
  onSearchComplete?: (address: Address) => void;
  onFlyTo?: (coordinates: { lat: number; lng: number }, zoom?: number) => void;
}

export function FloatingSearchInput({ onSearchComplete, onFlyTo }: FloatingSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const { currentSession, addNode } = useSessionManager();
  const { withApiToast } = useToast();

  // Debounced search for suggestions
  const debouncedSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        console.warn('No Mapbox token available for search suggestions');
        setSuggestions([]);
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        country: 'US',
        types: 'address,place,locality,neighborhood',
        limit: '8',
        bbox: '-97.5,43.5,-89.5,49.5' // Minnesota bounds
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Search request failed');

      const data = await response.json();
      const filteredSuggestions = data.features.filter((feature: SearchSuggestion) => {
        // Filter to Minnesota only
        const coordinates = { lat: feature.center[1], lng: feature.center[0] };
        return minnesotaBoundsService.isWithinMinnesota(coordinates);
      });

      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  }, [debouncedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.place_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    const coordinates = { lat: suggestion.center[1], lng: suggestion.center[0] };
    
    // Validate Minnesota bounds
    if (!minnesotaBoundsService.isWithinMinnesota(coordinates)) {
      await withApiToast('Minnesota Only', () => Promise.reject('This location is not in Minnesota. Please search for addresses within Minnesota state boundaries.'), {
        errorMessage: 'Not in Minnesota',
      });
      return;
    }

    // Parse address from suggestion
    const address = parseAddressFromSuggestion(suggestion);
    
    // Fly to location
    onFlyTo?.(coordinates, 16);

    // Create search history node
    if (currentSession) {
      const searchNode = {
        id: `search-${Date.now()}`,
        type: 'start' as const,
        customTitle: `Search: ${suggestion.place_name}`,
        address: {
          ...address,
          coordinates: { latitude: coordinates.lat, longitude: coordinates.lng }
        },
        apiName: 'Search History',
        timestamp: Date.now(),
        mnNodeId: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        hasCompleted: true, // Search is immediately completed
      };
      
      addNode(searchNode);
    }

    // Notify parent component
    onSearchComplete?.(address);

    // Collapse search input
    setIsExpanded(false);
  }, [currentSession, addNode, onFlyTo, onSearchComplete, withApiToast]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect]);

  // Handle click outside to close suggestions
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

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-4 right-4 z-30">
      <div className="relative">
        {/* Search Input */}
        <div
          className={`bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ${
            isExpanded ? 'w-72' : 'w-auto'
          }`}
        >
          {isExpanded ? (
            <div className="flex items-center px-3 py-2">
              <svg
                className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search Minnesota..."
                className="flex-1 outline-none text-sm placeholder-gray-400 bg-transparent"
              />
              {isLoading && (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin ml-2" />
              )}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setSearchQuery('');
                  setShowSuggestions(false);
                  setSelectedIndex(-1);
                }}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm font-medium text-gray-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Search</span>
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-40"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="font-medium truncate">{suggestion.place_name}</div>
                {suggestion.context && (
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.context
                      .filter(ctx => ctx.id.startsWith('place') || ctx.id.startsWith('region'))
                      .map(ctx => ctx.text)
                      .join(', ')}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to parse address from Mapbox suggestion
function parseAddressFromSuggestion(suggestion: SearchSuggestion): Address {
  const context = suggestion.context || [];
  
  // Extract components from context
  const street = suggestion.place_name.split(',')[0] || '';
  const city = context.find(ctx => ctx.id.startsWith('place'))?.text || '';
  const state = context.find(ctx => ctx.id.startsWith('region'))?.text || 'MN';
  const zip = context.find(ctx => ctx.id.startsWith('postcode'))?.text || '';

  return {
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
  };
}
