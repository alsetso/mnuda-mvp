'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { saveLocationSearch } from '@/features/location-searches/services/locationSearchService';

// Search type definitions - extensible for future search types
type SearchType = 'locations' | 'pins' | 'areas' | 'general';

interface SearchTypeConfig {
  id: SearchType;
  label: string;
  color: string;
  bgColor: string;
  enabled: boolean;
}

interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{ id: string; text: string }>;
}

interface AppSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }, placeName: string, mapboxMetadata?: MapboxMetadata) => void;
}

export default function AppSearch({ 
  placeholder = 'Search',
  onSearch,
  onLocationSelect,
}: AppSearchProps) {
  const pathname = usePathname();
  const isMapPage = pathname === '/map';
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeSearchTypes, setActiveSearchTypes] = useState<SearchType[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [tagContainerWidth, setTagContainerWidth] = useState(0);

  // Search type configurations - extensible architecture
  const searchTypeConfigs: Record<SearchType, SearchTypeConfig> = {
    locations: {
      id: 'locations',
      label: 'Locations',
      color: 'text-gold-600',
      bgColor: 'bg-gold-100',
      enabled: isMapPage,
    },
    pins: {
      id: 'pins',
      label: 'Pins',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      enabled: true,
    },
    areas: {
      id: 'areas',
      label: 'Areas',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      enabled: true,
    },
    general: {
      id: 'general',
      label: 'General',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      enabled: true,
    },
  };

  // Auto-add Locations tag when on map page and input is focused
  useEffect(() => {
    if (isMapPage && isOpen && !activeSearchTypes.includes('locations')) {
      setActiveSearchTypes(['locations']);
    }
  }, [isMapPage, isOpen, activeSearchTypes]);

  // Measure tag container width for proper input padding
  useEffect(() => {
    if (tagsContainerRef.current && activeSearchTypes.length > 0) {
      const width = tagsContainerRef.current.offsetWidth;
      setTagContainerWidth(width);
    } else {
      setTagContainerWidth(0);
    }
  }, [activeSearchTypes]);

  // Mapbox geocoding search for locations
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        console.warn('No Mapbox token available for location search');
        setLocationSuggestions([]);
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      const params = new URLSearchParams({
        access_token: token,
        country: 'US',
        types: 'address,poi,place',
        limit: '8',
        bbox: '-97.5,43.5,-89.5,49.5', // Minnesota bounds
        proximity: '-94.6859,46.7296', // Center of Minnesota
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Location search failed');

      const data = await response.json();
      setLocationSuggestions(data.features || []);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (activeSearchTypes.includes('locations') && query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchLocations(query);
      }, 300);
    } else {
      setLocationSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeSearchTypes, searchLocations]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || locationSuggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        const suggestion = locationSuggestions[selectedSuggestionIndex];
        handleLocationSelect(suggestion);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, locationSuggestions, selectedSuggestionIndex]);

  const handleLocationSelect = async (suggestion: LocationSuggestion) => {
    const [lng, lat] = suggestion.center;
    setQuery(suggestion.place_name);
    setIsOpen(false);
    setLocationSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Save location search (background, non-blocking) - only on map or my-homes page with locations tag
    if (isMapPage && activeSearchTypes.includes('locations')) {
      saveLocationSearch({
        place_name: suggestion.place_name,
        coordinates: { lat, lng },
        mapbox_data: suggestion,
        search_query: query,
        page_source: isMapPage ? 'map' : 'my-homes',
      });
    }
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng }, suggestion.place_name, suggestion);
    }
  };

  const removeSearchType = (type: SearchType) => {
    setActiveSearchTypes(prev => prev.filter(t => t !== type));
    if (type === 'locations') {
      setLocationSuggestions([]);
      setQuery('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && locationSuggestions.length > 0) {
      handleLocationSelect(locationSuggestions[selectedSuggestionIndex]);
    } else {
      onSearch?.(query);
      setIsOpen(false);
    }
  };

  const handleInputClick = () => {
    // Only open if user has typed something
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    // Only open if user has typed something
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Mock recent searches - only show when not searching locations
  const recentSearches = activeSearchTypes.length === 0 || !activeSearchTypes.includes('locations') ? [
    { id: 1, query: 'Pins downtown', type: 'Pins' },
    { id: 2, query: 'Homes in Minneapolis', type: 'Homes' },
    { id: 3, query: 'Areas near lake', type: 'Areas' },
  ] : [];

  return (
    <form onSubmit={handleSubmit} className="w-full flex justify-center">
      <div ref={containerRef} className="relative" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
          <MagnifyingGlassIcon className="w-5 h-5 text-white/70" />
        </div>
        
        {/* Search Type Tags - Positioned to work with input */}
        {activeSearchTypes.length > 0 && (
          <div 
            ref={tagsContainerRef}
            className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20 pointer-events-none"
          >
            {activeSearchTypes.map((type) => {
              const config = searchTypeConfigs[type];
              if (!config.enabled) return null;
              
              // Color mapping - Gold/beige for locations (matching MNUDA gold)
              const colorMap: Record<SearchType, { bg: string; text: string }> = {
                locations: { bg: 'rgba(194, 178, 137, 0.2)', text: '#C2B289' }, // MNUDA Gold/Beige
                pins: { bg: 'rgba(168, 85, 247, 0.15)', text: 'rgb(147, 51, 234)' },
                areas: { bg: 'rgba(34, 197, 94, 0.15)', text: 'rgb(22, 163, 74)' },
                general: { bg: 'rgba(107, 114, 128, 0.15)', text: 'rgb(75, 85, 99)' },
              };
              
              const colors = colorMap[type];
              
              return (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium pointer-events-auto transition-all duration-200"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.text}20`,
                  }}
                >
                  <span>{config.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearchType(type);
                    }}
                    className="hover:opacity-60 transition-opacity duration-150"
                    style={{ color: colors.text }}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            setSelectedSuggestionIndex(-1);
            // Open dropdown when user starts typing
            if (newQuery.length > 0) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          placeholder={activeSearchTypes.length > 0 ? '' : placeholder}
          className="
            w-full py-2 relative z-10
            bg-transparent rounded-lg
            text-sm text-white/90 placeholder-white/60
            focus:outline-none focus:ring-2 focus:ring-gold-500/50
            transition-all
          "
          style={{
            borderWidth: '2px',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            paddingLeft: activeSearchTypes.length > 0 && tagContainerWidth > 0
              ? `${tagContainerWidth + 16 + (isMapPage ? 35 : 0)}px` // Tag width + gap + extra for map page
              : '2.5rem',
          }}
        />

        {/* Search Overlay */}
        {isOpen && (
          <>
            {/* Backdrop overlay for mobile */}
            <div
              className="fixed inset-0 bg-black/20 z-[110] md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md rounded-lg shadow-xl border border-header-focus z-[110] overflow-hidden"
              style={{
                marginTop: '10px',
                width: 'calc(100% + 20px)',
                left: '-10px',
                right: '-10px',
              }}
            >
              <div className="p-2.5 max-h-[60vh] overflow-y-auto">
              {/* Location Suggestions - Dark mode design */}
              {isMapPage && activeSearchTypes.includes('locations') && (
                <div className="mb-2">
                  {isLoadingSuggestions ? (
                    <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>
                  ) : locationSuggestions.length > 0 ? (
                    <div className="space-y-0.5">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleLocationSelect(suggestion)}
                          className={`w-full text-left px-3 py-2 text-xs rounded transition-all duration-150 ${
                            index === selectedSuggestionIndex
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-gray-300 hover:bg-gray-800 border border-transparent'
                          }`}
                        >
                          <div className="font-medium truncate">{suggestion.place_name}</div>
                          {suggestion.context && suggestion.context.length > 0 && (
                            <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                              {suggestion.context
                                .filter(ctx => ctx.id.startsWith('place') || ctx.id.startsWith('region'))
                                .map(ctx => ctx.text)
                                .join(', ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : query.length >= 2 && !isLoadingSuggestions ? (
                    <div className="px-3 py-2 text-xs text-gray-400">No locations found</div>
                  ) : null}
                </div>
              )}

              {/* Other Search Types - Future extensibility */}
              {activeSearchTypes.some(type => type !== 'locations') && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Search other types...</p>
                  {/* Placeholder for future search types */}
                </div>
              )}

              {/* Recent Searches - Dark mode */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-medium text-gray-400">Recent searches</p>
                    <button
                      type="button"
                      onClick={() => {
                        // Clear recent searches logic here
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        type="button"
                        onClick={() => {
                          setQuery(search.query);
                          setIsOpen(false);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
                      >
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="flex-1 text-left">{search.query}</span>
                        <span className="text-xs text-gray-500">{search.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

