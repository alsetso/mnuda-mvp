'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from '@/features/map/hooks/useMap';
import { FloatingSearchInput } from '@/features/map/components/FloatingSearchInput';
import { Address } from '@/features/map/types';
import { useProperties } from '@/features/workspaces/contexts/PropertiesContext';
import { useWorkspace } from '@/features/workspaces/contexts/WorkspaceContext';

interface WorkspaceMapProps {
  onMarkerClick?: (property: { id: string }) => void;
}

/**
 * WorkspaceMap Component
 * - Full screen map for workspace
 * - Simplified without session management
 * - Focus on map functionality within workspace context
 */
export default function WorkspaceMap({ onMarkerClick }: WorkspaceMapProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);

  // --- UI state ---
  const [mapLoaded, setMapLoaded] = useState(false);

  // --- Properties context ---
  const { createProperty, properties } = useProperties();
  
  // --- Workspace context ---
  const { currentWorkspace } = useWorkspace();

  // --- Map hooks ---
  const {
    map,
    mapLoaded: mapIsLoaded,
    addMarker,
    removeMarker,
  } = useMap({
    mapContainer,
  });

  // Update local state when map loads
  useEffect(() => {
    setMapLoaded(mapIsLoaded);
  }, [mapIsLoaded]);

  // Listen for property detail clicks from popup buttons
  useEffect(() => {
    const handlePropertyDetailClick = (e: Event) => {
      const customEvent = e as CustomEvent<{ propertyId: string }>;
      if (customEvent.detail?.propertyId && onMarkerClick) {
        onMarkerClick({ id: customEvent.detail.propertyId });
      }
    };
    
    document.addEventListener('propertyDetailClick', handlePropertyDetailClick);
    return () => {
      document.removeEventListener('propertyDetailClick', handlePropertyDetailClick);
    };
  }, [onMarkerClick]);

  // Track which property markers have been added to avoid re-adding
  const addedMarkersRef = useRef<Set<string>>(new Set());

  // Add property markers when map loads and properties change
  useEffect(() => {
    if (!mapLoaded || !map) return;

    // Get properties that should have markers
    const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);
    const currentPropertyIds = new Set(propertiesWithCoords.map(p => p.id));

    // Remove markers for properties that no longer exist or lost coordinates
    addedMarkersRef.current.forEach(id => {
      if (!currentPropertyIds.has(id)) {
        removeMarker(`property-${id}`);
        addedMarkersRef.current.delete(id);
      }
    });

    // Add markers for properties that don't have them yet
    const updateMarkers = async () => {
      await Promise.all(
        propertiesWithCoords.map(async (property) => {
          const markerId = `property-${property.id}`;
          
          // Skip if marker already exists
          if (addedMarkersRef.current.has(property.id)) {
            return;
          }
          
          // Create clickable marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'cursor-pointer';
          markerElement.style.width = '12px';
          markerElement.style.height = '12px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.backgroundColor = '#3B82F6';
          markerElement.style.border = '2px solid white';
          markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          markerElement.addEventListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick({ id: property.id });
            }
          });
          
          // Add marker
          await addMarker(markerId, {
            lat: property.latitude!,
            lng: property.longitude!
          }, {
            color: '#3B82F6',
            element: markerElement,
            popupContent: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-900 text-sm">${property.full_address}</h3>
                <p class="text-xs text-gray-600">${property.city}, ${property.state} ${property.zipcode}</p>
                <p class="text-xs text-gray-500 mt-1">Status: ${property.status}</p>
                <button class="w-full mt-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors" data-property-id="${property.id}">
                  View Details →
                </button>
              </div>
            `
          });
          
          // Track that this marker has been added
          addedMarkersRef.current.add(property.id);
        })
      );
    };

    updateMarkers();
  }, [mapLoaded, map, properties, addMarker, removeMarker, onMarkerClick]);

  // Handle search completion
  const handleSearchComplete = useCallback((address: Address) => {
    console.log('Search completed:', address);
    // Search completion is handled by the FloatingSearchInput component
  }, []);

  // Handle map fly-to for search results
  const handleFlyTo = useCallback((coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (map) {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom || 16,
        duration: 2000,
        essential: true,
      });
    }
  }, [map]);

  // Handle saving property from search
  const handleSaveProperty = useCallback(async (address: Address, coordinates: { lat: number; lng: number }, status: string = 'Off Market') => {
    if (!currentWorkspace?.id) {
      throw new Error('No workspace selected');
    }

    if (!map) {
      throw new Error('Map not initialized');
    }

    // Create property data
    const propertyData = {
      full_address: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
      street_address: address.street,
      city: address.city,
      state: address.state,
      zipcode: address.zip,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      status: (status || 'Off Market') as 'Preforeclosure' | 'Foreclosure' | 'Foreclosed' | 'Auction' | 'Redemption' | 'Bank Owned' | 'Short Sale' | 'Subject To' | 'Deed In Lieu' | 'Leaseback' | 'For Sale By Owner' | 'Listed On MLS' | 'Under Contract' | 'Sold' | 'Off Market'
    };
    
    // Create the property
    const newProperty = await createProperty(currentWorkspace.id, propertyData);
    
    // Add marker to map for the newly created property
    if (newProperty.latitude && newProperty.longitude) {
      const markerElement = document.createElement('div');
      markerElement.className = 'cursor-pointer';
      markerElement.style.width = '12px';
      markerElement.style.height = '12px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = '#10B981';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      
      // Store reference to property ID for click handler
      const propertyId = newProperty.id;
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onMarkerClick) {
          onMarkerClick({ id: propertyId });
        }
      });
      
      await addMarker(`property-${newProperty.id}`, {
        lat: newProperty.latitude,
        lng: newProperty.longitude
      }, {
        color: '#10B981',
        element: markerElement,
        popupContent: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900 text-sm">${newProperty.full_address}</h3>
            <p class="text-xs text-gray-600">${newProperty.city}, ${newProperty.state} ${newProperty.zipcode}</p>
            <p class="text-xs text-gray-500 mt-1">Status: ${newProperty.status}</p>
            <button class="w-full mt-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors" data-property-id="${newProperty.id}">
              View Details →
            </button>
          </div>
        `
      });
      
      // Track that this marker has been added
      addedMarkersRef.current.add(newProperty.id);
    }
    
    return newProperty;
  }, [createProperty, currentWorkspace, map, addMarker, onMarkerClick]);



  return (
    <div className="relative w-full h-full" style={{ margin: 0, padding: 0 }}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}
      />
      
      {/* Floating Search Input */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <FloatingSearchInput
          onSearchComplete={handleSearchComplete}
          onFlyTo={handleFlyTo}
          onSaveProperty={handleSaveProperty}
        />
      </div>

      {/* Map Status Indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}

    </div>
  );
}
