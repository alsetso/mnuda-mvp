'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useMap } from '@/features/map/hooks/useMap';
import { FloatingSearchInput } from '@/features/map/components/FloatingSearchInput';
import { Address } from '@/features/map/types';
import { PinCreationModal } from '@/features/pins/components/PinCreationModal';
import { PinService } from '@/features/pins/services/pinService';
import { ReverseGeocodingService } from '@/features/map/services/reverseGeocodingService';
import { useToast } from '@/features/ui/hooks/useToast';

export default function MapPage() {
  const { user, isLoading: authLoading } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalCoordinates, setPinModalCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [pinModalAddress, setPinModalAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingPins, setIsLoadingPins] = useState(false);
  const pinMarkers = useRef<Map<string, import('mapbox-gl').Marker>>(new Map());
  const mapboxglRef = useRef<typeof import('mapbox-gl').default | null>(null);
  const { error } = useToast();

  // Handle map click - defined before useMap
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }) => {
    setIsLoadingAddress(true);
    setPinModalCoordinates(coordinates);
    
    try {
      const result = await ReverseGeocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
      setPinModalAddress(result.address);
      setShowPinModal(true);
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      setPinModalAddress(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
      setShowPinModal(true);
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  const {
    map,
    mapLoaded: mapIsLoaded,
  } = useMap({
    mapContainer,
    onMapClick: handleMapClick,
  });

  useEffect(() => {
    setMapLoaded(mapIsLoaded);
  }, [mapIsLoaded]);

  // Load mapbox-gl once and cache it
  useEffect(() => {
    if (!mapboxglRef.current) {
      import('mapbox-gl').then((module) => {
        mapboxglRef.current = module.default;
      }).catch((err) => {
        console.error('Failed to load mapbox-gl:', err);
      });
    }
  }, []);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      pinMarkers.current.forEach((marker) => marker.remove());
      pinMarkers.current.clear();
    };
  }, []);

  // Load pins function - reusable
  const loadPins = useCallback(async () => {
    if (!map || !user || !mapboxglRef.current) return;

    setIsLoadingPins(true);
    try {
      const loadedPins = await PinService.getAllPins();
      
      // Clear existing markers
      pinMarkers.current.forEach((marker) => marker.remove());
      pinMarkers.current.clear();

      const mapboxgl = mapboxglRef.current;

      // Add markers for each pin
      loadedPins.forEach((pin) => {
        const el = document.createElement('div');
        el.className = 'pin-marker';
        el.textContent = pin.emoji; // Use textContent instead of innerHTML for safety
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';
        el.style.userSelect = 'none';
        el.style.textAlign = 'center';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.lineHeight = '32px';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([pin.long, pin.lat])
          .addTo(map);

        // Create popup content safely
        const popupContent = document.createElement('div');
        popupContent.className = 'pin-popup';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'text-lg mb-1';
        nameDiv.textContent = `${pin.emoji} ${pin.name}`;
        popupContent.appendChild(nameDiv);

        if (pin.description) {
          const descDiv = document.createElement('div');
          descDiv.className = 'text-sm text-gray-600 mb-1';
          descDiv.textContent = pin.description;
          popupContent.appendChild(descDiv);
        }

        const addrDiv = document.createElement('div');
        addrDiv.className = 'text-xs text-gray-500';
        addrDiv.textContent = pin.address;
        popupContent.appendChild(addrDiv);

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);
        marker.setPopup(popup);
        pinMarkers.current.set(pin.id, marker);
      });
    } catch (err) {
      console.error('Error loading pins:', err);
      error('Load Failed', 'Failed to load pins');
    } finally {
      setIsLoadingPins(false);
    }
  }, [map, user, error]);

  // Load pins when map is ready and user is authenticated
  useEffect(() => {
    if (mapLoaded && map && user && mapboxglRef.current) {
      loadPins();
    }
  }, [mapLoaded, map, user, loadPins]);

  // Handle search completion - drop pin and show modal
  const handleSearchComplete = useCallback((address: Address, coordinates?: { lat: number; lng: number }) => {
    if (coordinates) {
      setPinModalCoordinates(coordinates);
      // Use the address from search result
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
      setPinModalAddress(fullAddress);
      setShowPinModal(true);
    }
  }, []);

  // Handle fly to coordinates
  const handleFlyTo = (coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (map) {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom || 15,
        duration: 1500,
      });
    }
  };

  // Handle saving pin
  const handleSavePin = useCallback(async (data: {
    emoji: string;
    name: string;
    visibility: 'public' | 'private';
    description: string;
    address: string;
    lat: number;
    long: number;
  }) => {
    try {
      await PinService.createPin(data);
      // Reload pins using the shared function
      await loadPins();
    } catch (err) {
      // Error is already handled by loadPins
      throw err;
    }
  }, [loadPins]);

  // Handle saving property (can be extended later)
  const handleSaveProperty = async (address: Address, coordinates: { lat: number; lng: number }, status: string = 'Off Market') => {
    // Placeholder for future property saving functionality
    console.log('Save property:', address, coordinates, status);
    return null;
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
        <div className="h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
        <div className="h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-black text-black mb-2">Authentication Required</h1>
            <p className="text-gray-600 mb-4">Please sign in to access the map.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
      <div className="h-[calc(100vh-3rem)] w-full overflow-hidden relative" style={{ margin: 0, padding: 0 }}>
        {/* Map Container */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
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

        {/* Pin Creation Modal */}
        {showPinModal && pinModalCoordinates && (
          <PinCreationModal
            isOpen={showPinModal}
            coordinates={pinModalCoordinates}
            address={pinModalAddress}
            onClose={() => {
              setShowPinModal(false);
              setPinModalCoordinates(null);
              setPinModalAddress('');
            }}
            onSave={handleSavePin}
          />
        )}

        {/* Loading Address Indicator */}
        {isLoadingAddress && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gold-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">Loading address...</span>
            </div>
          </div>
        )}

        {/* Loading Pins Indicator */}
        {isLoadingPins && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gold-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">Loading pins...</span>
            </div>
          </div>
        )}

        {/* Map Status Indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gold-100 bg-opacity-90 z-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-gray-600 font-medium">Loading map...</div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

