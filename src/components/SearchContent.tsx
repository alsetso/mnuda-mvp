'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/features/ui/hooks/useToast';
import { minnesotaBoundsService } from '@/features/map/services/minnesotaBoundsService';
import { Address } from '@/features/map/types';

interface SearchSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface SearchContentProps {
  onSearchComplete?: (address: Address, coordinates?: { lat: number; lng: number }) => void;
  onFlyTo?: (coordinates: { lat: number; lng: number }, zoom?: number) => void;
}

export function SearchContent({ onSearchComplete, onFlyTo }: SearchContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
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
        types: 'address',
        limit: '8',
        bbox: '-97.5,43.5,-89.5,49.5', // Minnesota bounds (west,south,east,north)
        proximity: '-94.6859,46.7296' // Center of Minnesota for better relevance
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Search request failed');

      const data = await response.json();
      const filteredSuggestions = data.features.filter((feature: SearchSuggestion) => {
        // Multiple layers of Minnesota filtering
        const coordinates = { lat: feature.center[1], lng: feature.center[0] };
        const isWithinBounds = minnesotaBoundsService.isWithinMinnesota(coordinates);
        
        const context = feature.context || [];
        const stateContext = context.find(ctx => ctx.id.startsWith('region'));
        const isMinnesotaState = stateContext ? 
          minnesotaBoundsService.isMinnesotaState(stateContext.text) : false;
        
        const placeName = feature.place_name.toLowerCase();
        const hasMinnesotaIndicators = placeName.includes('minnesota') || 
                                     placeName.includes(', mn') || 
                                     placeName.includes(' mn ');
        
        return isWithinBounds && (isMinnesotaState || hasMinnesotaIndicators);
      });

      // Final safety check
      const finalSuggestions = filteredSuggestions.filter((suggestion: Record<string, unknown>) => {
        const coordinates = { lat: (suggestion.center as number[])[1], lng: (suggestion.center as number[])[0] };
        return minnesotaBoundsService.isWithinMinnesota(coordinates);
      });

      setSuggestions(finalSuggestions);
      setShowSuggestions(finalSuggestions.length > 0);
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
    
    // Parse address from suggestion
    const address = parseAddressFromSuggestion(suggestion);
    
    // Validate Minnesota bounds
    if (!minnesotaBoundsService.isWithinMinnesota(coordinates)) {
      await withApiToast('Minnesota Only', () => Promise.reject('This location is not in Minnesota. Please search for addresses within Minnesota state boundaries.'), {
        errorMessage: 'Not in Minnesota',
      });
      return;
    }

    // Fly to location immediately
    onFlyTo?.(coordinates, 16);

    // Notify parent component
    onSearchComplete?.(address, coordinates);
  }, [onFlyTo, onSearchComplete, withApiToast]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : prev;
          // Scroll selected item into view
          if (suggestionsRef.current && newIndex >= 0) {
            const buttons = suggestionsRef.current.querySelectorAll('button');
            if (buttons[newIndex]) {
              buttons[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          // Scroll selected item into view
          if (suggestionsRef.current && newIndex >= 0) {
            const buttons = suggestionsRef.current.querySelectorAll('button');
            if (buttons[newIndex]) {
              buttons[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
          return newIndex;
        });
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

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="pointer-events-auto bg-transparent backdrop-blur-[5px] rounded-2xl w-80 max-h-[30rem] flex flex-col overflow-hidden" style={{ backdropFilter: 'blur(5px)' }}>
      <div className="p-4 flex-shrink-0">
        {/* Search Input */}
        <div className="flex items-center px-3 py-2 bg-transparent backdrop-blur-[5px] rounded-lg" style={{ backdropFilter: 'blur(5px)' }}>
          <svg
            className="w-4 h-4 text-white/70 mr-2 flex-shrink-0"
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
            className="flex-1 outline-none text-sm placeholder-white/50 bg-transparent text-white"
          />
          {isLoading && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
          )}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
                setSelectedIndex(-1);
                setSuggestions([]);
              }}
              className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* No results message */}
        {searchQuery.length >= 2 && !isLoading && !showSuggestions && (
          <div className="mt-2 text-sm text-white/70 text-center py-2">
            No results found
          </div>
        )}
      </div>

      {/* Suggestions Dropdown - Scrollable area */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 pb-4">
          <div
            ref={suggestionsRef}
            className="flex-1 overflow-y-auto bg-transparent backdrop-blur-[5px] rounded-lg" style={{ backdropFilter: 'blur(5px)' }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-3 py-2 text-left text-sm bg-transparent hover:bg-white/10 last:border-b-0 transition-colors ${
                  index === selectedIndex ? 'bg-white/20 text-white' : 'text-white'
                }`}
              >
                <div className="font-medium truncate">
                  {formatAddressSuggestion(suggestion)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format address suggestion for display
function formatAddressSuggestion(suggestion: SearchSuggestion): string {
  const context = suggestion.context || [];
  
  const street = suggestion.place_name.split(',')[0] || '';
  const city = context.find(ctx => ctx.id.startsWith('place'))?.text || '';
  const state = context.find(ctx => ctx.id.startsWith('region'))?.text || 'MN';
  const zip = context.find(ctx => ctx.id.startsWith('postcode'))?.text || '';

  const parts = [street.trim()];
  if (city) parts.push(city.trim());
  if (state) parts.push(state.trim());
  if (zip) parts.push(zip.trim());
  
  return parts.join(', ');
}

// Helper function to parse address from Mapbox suggestion
function parseAddressFromSuggestion(suggestion: SearchSuggestion): Address {
  const context = suggestion.context || [];
  
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

