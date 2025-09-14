'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pin } from '@/types/pin';

interface MapboxGeocodeFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy: string;
    address?: string;
    category?: string;
    maki?: string;
    wikidata?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

interface MapboxGeocodeResponse {
  type: string;
  query: string[];
  features: MapboxGeocodeFeature[];
  attribution: string;
}

interface GeocodeSuggestion {
  address: string;
  confidence: number;
  place_name: string;
  center: [number, number];
  feature: MapboxGeocodeFeature;
}

interface MapSearchProps {
  onLocationSelect?: (suggestion: GeocodeSuggestion) => void;
  onFlyToLocation?: (coordinates: [number, number], address: string) => void;
  placeholder?: string;
  proximity?: [number, number]; // [longitude, latitude] for proximity bias
  isFocusMode?: boolean; // When true, disables input and shows focus mode placeholder
  pins?: Pin[]; // Existing pins for duplicate detection
}

const MapSearch: React.FC<MapSearchProps> = ({ 
  onLocationSelect, 
  onFlyToLocation,
  placeholder = "Search for an address...",
  proximity,
  isFocusMode = false,
  pins = []
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateFound, setDuplicateFound] = useState<Pin | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if coordinates match an existing pin (within ~50 meters)
  const findDuplicatePin = (coordinates: [number, number]): Pin | null => {
    const [lng, lat] = coordinates;
    const threshold = 0.0005; // Approximately 50 meters in degrees
    
    return pins.find(pin => 
      Math.abs(pin.lng - lng) < threshold && 
      Math.abs(pin.lat - lat) < threshold
    ) || null;
  };

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      if (!mapboxToken) {
        throw new Error('Mapbox access token not configured');
      }

      const encodedQuery = encodeURIComponent(searchQuery);
      const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=10&types=address${proximityParam}&autocomplete=true&country=US&region=MN`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data: MapboxGeocodeResponse = await response.json();
      
      // Debug logging to understand the API response
      console.log('Mapbox API Response:', data);
      console.log('Features count:', data.features.length);
      
      const suggestions: GeocodeSuggestion[] = data.features
        .filter(feature => {
          // Debug each feature
          console.log('Feature:', {
            place_type: feature.place_type,
            text: feature.text,
            place_name: feature.place_name,
            properties: feature.properties,
            hasAddress: !!feature.properties.address
          });
          
          // Ensure feature has meaningful content
          if (!feature.place_name || feature.place_name.length === 0) {
            return false;
          }
          
          // Filter to only Minnesota addresses
          const isMinnesota = feature.place_name.toLowerCase().includes('minnesota') || 
                             feature.place_name.toLowerCase().includes(', mn') ||
                             feature.place_name.toLowerCase().includes(' mn ') ||
                             feature.place_name.toLowerCase().endsWith(' mn');
          
          return isMinnesota;
        })
        .slice(0, 5) // Limit to 5 results after filtering
        .map(feature => ({
          address: feature.place_name, // Use full place_name for complete address
          confidence: Math.round(feature.relevance * 100),
          place_name: feature.place_name,
          center: feature.center,
          feature: feature
        }));
      
      console.log('Filtered suggestions:', suggestions);

      if (suggestions.length === 0) {
        console.log('No suggestions found for query:', searchQuery);
        setError('No addresses found. Try a different search term.');
      } else {
        setError(null);
      }

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching geocode suggestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFocusMode) return; // Prevent input changes in focus mode
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFocusMode || !isOpen) return; // Prevent keyboard navigation in focus mode

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
        handleEnterPress();
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: GeocodeSuggestion) => {
    console.log('🔍 MapSearch: Suggestion selected:', suggestion.address, 'at coordinates:', suggestion.center);
    setQuery(suggestion.address);
    setIsOpen(false);
    setSelectedIndex(-1);
    onLocationSelect?.(suggestion);
    onFlyToLocation?.(suggestion.center, suggestion.address);
    // Also call the global flyToAddress function if available
    if ((window as any).flyToAddress) {
      console.log('🗺️ MapSearch: Calling global flyToAddress function');
      (window as any).flyToAddress(suggestion.center, suggestion.address);
    } else {
      console.log('❌ MapSearch: Global flyToAddress function not available, retrying in 100ms');
      // Retry after a short delay in case MapBox is still loading
      setTimeout(() => {
        if ((window as any).flyToAddress) {
          console.log('🗺️ MapSearch: Retry successful - calling global flyToAddress function');
          (window as any).flyToAddress(suggestion.center, suggestion.address);
        } else {
          console.log('❌ MapSearch: Global flyToAddress function still not available after retry');
        }
      }, 100);
    }
  };

  const handleEnterPress = async () => {
    if (isFocusMode || !query.trim()) return;

    // If there's a selected suggestion, use it
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const suggestion = suggestions[selectedIndex];
      handleSuggestionSelect(suggestion);
      onFlyToLocation?.(suggestion.center, suggestion.address);
      // Also call the global flyToAddress function if available
      if ((window as any).flyToAddress) {
        (window as any).flyToAddress(suggestion.center, suggestion.address);
      }
      return;
    }

    // If no suggestion is selected but there's text, try to geocode it
    if (query.trim().length >= 2) {
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        if (!mapboxToken) {
          console.error('Mapbox access token not found');
          return;
        }

        const encodedQuery = encodeURIComponent(query.trim());
        const proximityParam = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=1&types=address${proximityParam}&country=US&region=MN`
        );

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
        }

        const data: MapboxGeocodeResponse = await response.json();
        
        if (data.features.length > 0) {
          const feature = data.features[0];
          const address = feature.place_name;
          const coordinates = feature.center;
          
          // Verify it's a Minnesota address
          const isMinnesota = address.toLowerCase().includes('minnesota') || 
                             address.toLowerCase().includes(', mn') ||
                             address.toLowerCase().includes(' mn ') ||
                             address.toLowerCase().endsWith(' mn');
          
          if (isMinnesota) {
            // Check for duplicate pin
            const duplicatePin = findDuplicatePin(coordinates);
            
            if (duplicatePin) {
              // Found existing pin - fly to it without opening dialog
              setDuplicateFound(duplicatePin);
              setQuery(address);
              setIsOpen(false);
              
              // Fly to the existing pin
              onFlyToLocation?.(coordinates, address);
              if ((window as any).flyToAddress) {
                console.log('📍 MapSearch: Found existing pin, flying to it:', duplicatePin.name);
                (window as any).flyToAddress(coordinates, address);
              }
              
              // Clear duplicate notification after 3 seconds
              setTimeout(() => {
                setDuplicateFound(null);
              }, 3000);
              
              return;
            }
            
            // No duplicate found - proceed with normal flow
            setDuplicateFound(null);
            setQuery(address);
            setIsOpen(false);
            onLocationSelect?.({
              address,
              confidence: Math.round(feature.relevance * 100),
              place_name: feature.place_name,
              center: feature.center,
              feature: feature
            });
            onFlyToLocation?.(coordinates, address);
            // Also call the global flyToAddress function if available
            if ((window as any).flyToAddress) {
              console.log('🗺️ MapSearch: Calling global flyToAddress function for Enter key');
              (window as any).flyToAddress(coordinates, address);
            } else {
              console.log('❌ MapSearch: Global flyToAddress function not available for Enter key, retrying in 100ms');
              // Retry after a short delay in case MapBox is still loading
              setTimeout(() => {
                if ((window as any).flyToAddress) {
                  console.log('🗺️ MapSearch: Retry successful - calling global flyToAddress function for Enter key');
                  (window as any).flyToAddress(coordinates, address);
                } else {
                  console.log('❌ MapSearch: Global flyToAddress function still not available after retry for Enter key');
                }
              }, 100);
            }
          } else {
            console.log('Address is not in Minnesota:', address);
          }
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }
  };

  const handleInputFocus = () => {
    if (isFocusMode) return; // Prevent focus behavior in focus mode
    setIsOpen(true);
  };

  return (
    <div className="relative flex-1 max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        placeholder={isFocusMode ? "In focus mode" : placeholder}
        disabled={isFocusMode}
        className={`w-full h-10 px-3 py-2 bg-transparent border-none outline-none transition-colors duration-200 ${
          isFocusMode 
            ? 'text-gray-400 placeholder-gray-400 cursor-not-allowed' 
            : 'text-gray-700 placeholder-gray-400 focus:text-mnuda-dark-blue'
        }`}
        style={{ height: '40px' }}
      />
      
      {/* Duplicate Pin Notification */}
      {duplicateFound && (
        <div className="absolute top-full left-0 mt-1 bg-mnuda-light-blue text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm">
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span>Found existing pin: <strong>{duplicateFound.name}</strong></span>
          </div>
        </div>
      )}
      
      {!isFocusMode && isOpen && (suggestions.length > 0 || isLoading || error || (query.length >= 2 && !isLoading && suggestions.length === 0)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-full w-max max-w-md"
          style={{ width: 'max(100%, 300px)', maxWidth: '400px' }}
        >
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mnuda-light-blue mr-2"></div>
              Searching...
            </div>
          )}
          
          {error && !isLoading && (
            <div className="px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {!isLoading && !error && suggestions.length === 0 && query.length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No addresses found. Try a different search term.
            </div>
          )}
          
          {!isLoading && !error && suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.address}-${index}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-mnuda-light-blue/10' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 truncate">
                  {suggestion.address}
                </span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {suggestion.confidence}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapSearch;
