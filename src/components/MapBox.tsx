'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { locationService, LocationData } from '@/lib/locationService';
import LocationModal from './LocationModal';
import PinDialog from './PinDialog';
import PinPopup from './PinPopup';
import PinDetailsModal from './PinDetailsModal';
import { PinService } from '@/lib/pinService';
import { CreatePinData, Pin } from '@/types/pin';

interface MapBoxProps {
  onPinDrop?: (lng: number, lat: number) => void;
  showUserLocation?: boolean;
  onLocationToggle?: () => void;
  onFlyToLocation?: (coordinates: [number, number], address: string) => void;
  onPinsChange?: (pins: Pin[]) => void;
}

const MapBox: React.FC<MapBoxProps> = ({ 
  onPinDrop, 
  showUserLocation: shouldShowUserLocation, 
  onLocationToggle,
  onFlyToLocation,
  onPinsChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const addressMarker = useRef<mapboxgl.Marker | null>(null);
  const isProcessingLocation = useRef<boolean>(false);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinDialogData, setPinDialogData] = useState<{
    address: string;
    coordinates: [number, number];
  } | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinMarkers, setPinMarkers] = useState<mapboxgl.Marker[]>([]);
  const pinMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const isInitializing = useRef<boolean>(false);
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPinDetailsModal, setShowPinDetailsModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  // Find pin at specific coordinates (within ~50 meters)
  const findPinAtCoordinates = useCallback((lng: number, lat: number): Pin | null => {
    const threshold = 0.0005; // Approximately 50 meters in degrees
    
    return pins.find(pin => 
      Math.abs(pin.lng - lng) < threshold && 
      Math.abs(pin.lat - lat) < threshold
    ) || null;
  }, [pins]);

  // Load pins for the authenticated user
  const loadPins = useCallback(async () => {
    try {
      const userPins = await PinService.getPins();
      setPins(userPins);
      console.log('📍 Loaded pins for user:', userPins.length);
    } catch (error) {
      console.error('❌ Failed to load pins:', error);
    }
  }, []);

  // Handle pin drop in focus mode with automatic address geocoding
  const handleFocusModePinDrop = useCallback(async (lng: number, lat: number) => {
    try {
      console.log('🎯 Focus mode pin drop at:', lng, lat);
      
      // Geocode the coordinates to get address
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        console.error('❌ Mapbox token not available for geocoding');
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi`
      );

      if (!response.ok) {
        console.error('❌ Geocoding failed:', response.statusText);
        return;
      }

      const data = await response.json();
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Fallback to coordinates
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        address = feature.place_name || feature.text || address;
      }

      // Create pin data with address as name
      const pinData: CreatePinData = {
        name: address, // Use address as the pin name for quick drops
        lat: lat,
        lng: lng,
        full_address: address
      };

      // Save the pin directly
      await PinService.createPin(pinData);
      console.log('✅ Focus mode pin saved:', pinData);
      
      // Refresh pins to show the new one
      await loadPins();
      
      // Show a brief success indicator (optional)
      // You could add a toast notification here
      
    } catch (error) {
      console.error('❌ Failed to save focus mode pin:', error);
      // You could add error handling/notification here
    }
  }, [loadPins]);

  // Display pins on the map
  const displayPinsOnMap = useCallback((pinsToDisplay: Pin[]) => {
    if (!map.current || !mapLoaded) return;

    // Clear existing pin markers using ref
    pinMarkersRef.current.forEach(marker => marker.remove());
    pinMarkersRef.current = [];

    // Create markers for each pin
    const newMarkers: mapboxgl.Marker[] = [];
    
    pinsToDisplay.forEach((pin) => {
      // Create pin marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'w-6 h-6 bg-mnuda-dark-blue rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform';
      markerElement.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>';
      
      // Add hover handlers for popup
      markerElement.addEventListener('mouseenter', (e) => {
        if (map.current) {
          const rect = map.current.getContainer().getBoundingClientRect();
          const point = map.current.project([pin.lng, pin.lat]);
          setPopupPosition({
            x: point.x + rect.left,
            y: point.y + rect.top
          });
          setHoveredPin(pin);
          
          // Change cursor to indicate pin is interactive
          if (map.current.getContainer()) {
            map.current.getContainer().style.cursor = 'pointer';
          }
        }
      });
      
      markerElement.addEventListener('mouseleave', () => {
        setHoveredPin(null);
        
        // Reset cursor
        if (map.current && map.current.getContainer()) {
          map.current.getContainer().style.cursor = '';
        }
      });
      
      // Add click handler for pin
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event
        console.log('Pin clicked:', pin.name, pin.full_address);
        setSelectedPin(pin);
        setShowPinDetailsModal(true);
      });

      // Create and add marker to map
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current!);

      newMarkers.push(marker);
    });

    // Update both ref and state
    pinMarkersRef.current = newMarkers;
    setPinMarkers(newMarkers);
    console.log('📍 Displayed', newMarkers.length, 'pins on map');
  }, [mapLoaded]);

  // Initialize map - runs once on mount
  useEffect(() => {
    if (map.current || mapContainer.current === null || isInitializing.current) return;

    isInitializing.current = true;
    const initializeMap = async () => {
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        if (!mapboxToken) {
          setError('Mapbox access token is not provided.');
          return;
        }

        if (!mapboxToken.startsWith('pk.') || mapboxToken.length < 50) {
          setError('Invalid Mapbox access token format.');
          return;
        }

        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-93.2650, 44.9778],
          zoom: 10,
          attributionControl: false,
          logoPosition: 'bottom-left'
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          setError(null);
          // Load pins when map is ready
          loadPins();
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e.error);
          setError(`Map failed to load: ${e.error?.message || 'Unknown error'}`);
        });

        map.current.on('click', (e) => {
          // Check if click is on an existing pin
          const clickedPin = findPinAtCoordinates(e.lngLat.lng, e.lngLat.lat);
          
          if (clickedPin) {
            console.log('Clicked on existing pin:', clickedPin.name);
            // Don't drop a new pin, just show the existing pin info
            return;
          }
          
          // In focus mode, handle quick pin drop with auto-address
          if (isFocusMode) {
            handleFocusModePinDrop(e.lngLat.lng, e.lngLat.lat);
            return;
          }
          
          // No existing pin at this location, proceed with normal pin drop
          onPinDrop?.(e.lngLat.lng, e.lngLat.lat);
        });

      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map.');
        isInitializing.current = false;
      }
    };

    initializeMap();

    return () => {
      isInitializing.current = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
      if (addressMarker.current) {
        addressMarker.current.remove();
        addressMarker.current = null;
      }
      // Clean up pin markers
      pinMarkersRef.current.forEach(marker => marker.remove());
      locationService.stopWatchingLocation();
    };
  }, [onPinDrop, isFocusMode, handleFocusModePinDrop]);

  // Display pins when they change
  useEffect(() => {
    if (pins.length > 0 && mapLoaded) {
      displayPinsOnMap(pins);
    } else if (pins.length === 0 && mapLoaded) {
      // Clear markers when no pins
      pinMarkersRef.current.forEach(marker => marker.remove());
      pinMarkersRef.current = [];
      setPinMarkers([]);
    }
    
    // Notify parent component of pins change
    onPinsChange?.(pins);
  }, [pins, mapLoaded, displayPinsOnMap]);

  // Check location permissions on mount
  useEffect(() => {
    if (locationService.shouldShowLocationModal()) {
      setShowLocationModal(true);
    }
  }, []);

  // Cleanup processing flag on unmount
  useEffect(() => {
    return () => {
      isProcessingLocation.current = false;
    };
  }, []);

  // Update user marker function
  const updateUserMarker = useCallback((location: LocationData) => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'w-6 h-6 bg-mnuda-light-blue rounded-full border-2 border-white shadow-lg flex items-center justify-center';
    markerElement.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>';

    // Add marker to map
    userMarker.current = new mapboxgl.Marker(markerElement)
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);
  }, [mapLoaded]);

  // Center map on location function
  const centerMapOnLocation = useCallback((location: LocationData) => {
    if (!map.current || !mapLoaded) {
      console.log('❌ MapBox: Cannot center - map not ready');
      return;
    }

    console.log('🎯 MapBox: Centering on user location:', location.latitude, location.longitude);
    
    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 16,
      essential: true,
      duration: 1000,
      easing: (t) => t * (2 - t) // Smooth ease-out animation
    });
  }, [mapLoaded]);

  // Clean location tracking functions
  const startLocationTracking = useCallback(() => {
    if (!map.current || !mapLoaded) return false;

    return locationService.startWatchingLocation((location) => {
      setUserLocation(location);
      setIsTrackingLocation(true);
      
      if (shouldShowUserLocation) {
        updateUserMarker(location);
        // Always center when in focus mode and location is available
        centerMapOnLocation(location);
      }
    });
  }, [mapLoaded, shouldShowUserLocation, updateUserMarker, centerMapOnLocation]);

  const stopLocationTracking = useCallback(() => {
    locationService.stopWatchingLocation();
    setIsTrackingLocation(false);
  }, []);

  const flyToAddress = useCallback((coordinates: [number, number], address: string) => {
    console.log('🎯 MapBox: flyToAddress called with:', address, 'at coordinates:', coordinates);
    
    if (!map.current || !mapLoaded) {
      console.log('❌ MapBox: Map not ready - current:', !!map.current, 'loaded:', mapLoaded);
      return;
    }

    const [longitude, latitude] = coordinates;

    // Remove existing address marker
    if (addressMarker.current) {
      addressMarker.current.remove();
      console.log('🗑️ MapBox: Removed existing address marker');
    }

    // Create red placemarker element
    const markerElement = document.createElement('div');
    markerElement.className = 'w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center cursor-pointer';
    markerElement.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';
    
    // Add click handler for marker
    markerElement.addEventListener('click', () => {
      // Optional: Show address popup or perform action
      console.log('Address marker clicked:', address);
    });

    // Create and add marker to map
    addressMarker.current = new mapboxgl.Marker(markerElement)
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    console.log('📍 MapBox: Red placemarker added to map at coordinates:', [longitude, latitude]);

    // Fly to the address location
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      essential: true,
      duration: 2000,
      easing: (t) => t * (2 - t) // Ease-out animation
    });

    console.log('✈️ MapBox: Flying to address:', address, 'at [', longitude, ',', latitude, '] - SUCCESS!');

    // Show pin dialog after successful fly-to
    setTimeout(() => {
      setPinDialogData({
        address,
        coordinates: [longitude, latitude]
      });
      setShowPinDialog(true);
    }, 2500); // Wait for animation to complete
  }, [mapLoaded]);

  const enableFocusMode = useCallback(async () => {
    if (!map.current) return;
    
    setIsFocusMode(true);
    
    // Disable map interactions
    map.current.dragPan.disable();
    map.current.dragRotate.disable();
    map.current.scrollZoom.disable();
    map.current.boxZoom.disable();
    map.current.doubleClickZoom.disable();
    map.current.keyboard.disable();
    
    // Try to get current location immediately if we don't have one
    const currentUserLocation = userLocation;
    if (!currentUserLocation) {
      try {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          setUserLocation(currentLocation);
          updateUserMarker(currentLocation);
          centerMapOnLocation(currentLocation);
        }
      } catch (error) {
        console.log('❌ MapBox: Failed to get immediate location:', error);
      }
    }
  }, [updateUserMarker, centerMapOnLocation]);

  const disableFocusMode = useCallback(() => {
    if (!map.current) return;
    
    setIsFocusMode(false);
    
    // Re-enable map interactions
    map.current.dragPan.enable();
    map.current.dragRotate.enable();
    map.current.scrollZoom.enable();
    map.current.boxZoom.enable();
    map.current.doubleClickZoom.enable();
    map.current.keyboard.enable();
  }, []);

  // Handle fly to location from MapSearch
  useEffect(() => {
    // Always expose the flyToAddress function globally when map is loaded
    if (mapLoaded) {
      (window as any).flyToAddress = flyToAddress;
      console.log('🌐 MapBox: Global flyToAddress function exposed to window');
    }
  }, [mapLoaded, flyToAddress]);

  // Handle location toggle from topbar
  useEffect(() => {
    if (shouldShowUserLocation === undefined || !onLocationToggle || !mapLoaded || isProcessingLocation.current) return;

    isProcessingLocation.current = true;

    const handleToggle = async () => {
      const permission = locationService.getPermissionStatus();
      
      if (permission === 'granted') {
        if (shouldShowUserLocation) {
          // Enable focus mode first (this will try to get location immediately)
          await enableFocusMode();
          
          // Start location tracking (this will also center on new updates)
          startLocationTracking();
        } else {
          // Disable focus mode and clean up
          disableFocusMode();
          stopLocationTracking();
          
          if (userMarker.current) {
            userMarker.current.remove();
            userMarker.current = null;
          }
        }
      } else {
        setShowLocationModal(true);
      }

      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingLocation.current = false;
      }, 100);
    };

    handleToggle();
  }, [shouldShowUserLocation, mapLoaded]);

  // Modal handlers
  const handleLocationAccept = useCallback(async () => {
    setShowLocationModal(false);
    await enableFocusMode();
    startLocationTracking();
  }, [enableFocusMode, startLocationTracking]);

  const handleLocationDecline = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  const handleLocationClose = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  // Pin dialog handlers
  const handlePinSave = useCallback(async (pinData: CreatePinData) => {
    try {
      await PinService.createPin(pinData);
      console.log('✅ Pin saved successfully:', pinData);
      // Refresh pins after saving
      await loadPins();
    } catch (error) {
      console.error('❌ Failed to save pin:', error);
      throw error; // Re-throw to let PinDialog handle the error display
    }
  }, [loadPins]);

  const handlePinDialogClose = useCallback(() => {
    setShowPinDialog(false);
    setPinDialogData(null);
  }, []);

  const handlePinDetailsClose = useCallback(() => {
    setShowPinDetailsModal(false);
    setSelectedPin(null);
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Map Loading Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-mnuda-light-blue hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Map container - must be completely empty for proper interactivity */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading overlay - positioned outside map container */}
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mnuda-light-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Location Permission Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={handleLocationClose}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
      />

      {/* Pin Count Display - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-mnuda-dark-blue rounded-full"></div>
          <span className="text-sm font-medium text-mnuda-dark-blue">
            {pins.length} pin{pins.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Focus Mode Pin Drop Indicator - Bottom Right */}
      {isFocusMode && (
        <div className="absolute bottom-4 right-4 bg-mnuda-light-blue text-mnuda-dark-blue rounded-lg shadow-lg border border-mnuda-light-blue px-3 py-2 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-mnuda-dark-blue rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Tap to drop pin
            </span>
          </div>
        </div>
      )}

      {/* Pin Hover Popup */}
      {hoveredPin && (
        <PinPopup
          pin={hoveredPin}
          isVisible={!!hoveredPin}
          position={popupPosition}
        />
      )}

      {/* Pin Dialog */}
      {pinDialogData && (
        <PinDialog
          isOpen={showPinDialog}
          onClose={handlePinDialogClose}
          onSave={handlePinSave}
          initialAddress={pinDialogData.address}
          coordinates={pinDialogData.coordinates}
        />
      )}

      {/* Pin Details Modal */}
      <PinDetailsModal
        isOpen={showPinDetailsModal}
        onClose={handlePinDetailsClose}
        pin={selectedPin}
      />
    </div>
  );
};

export default MapBox;
