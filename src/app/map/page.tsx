'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SimplePageLayout from '@/components/SimplePageLayout';
import { useAuth } from '@/features/auth';
import { useMap, MAP_CONFIG } from '@/features/map';

import { MapDeleteModal, type DeleteRecord } from '@/components/MapDeleteModal';
import { useToast } from '@/features/ui/hooks/useToast';
import { LoginPromptModal } from '@/components/LoginPromptModal';
import { PinSidebar } from '@/components/map/PinSidebar';
import { ProfileTypesTopbar } from '@/components/map/ProfileTypesTopbar';
import MapToolbar from '@/components/map/MapToolbar';
import { saveLocationSearch } from '@/features/location-searches/services/locationSearchService';
import { useMapPinData, useMapPinCRUD, MapPin } from '@/features/map-pins';
import { useMapPageDrawing } from '@/features/map/hooks/useMapPageDrawing';
import MapPageDrawingControls from '@/components/map/MapPageDrawingControls';
import ComingSoonModal from '@/components/map/ComingSoonModal';
import DataLogModal from '@/components/map/DataLogModal';
import { addDataLogEntry, getDataLogCount } from '@/features/map/utils/dataLogStorage';
import { usePageView } from '@/hooks/usePageView';
import MapStats from '@/components/map/MapStats';

export default function CommunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  // Stable ref - never changes, prevents map re-initialization
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Additional safeguard: track if map has been initialized (useMapController also has this)
  const mapInitializedRef = useRef(false);
  const [deletingRecord, setDeletingRecord] = useState<DeleteRecord | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { error: showError, success } = useToast();

  // Filter state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<{ public: boolean; private: boolean }>({
    public: true,
    private: true,
  });

  // 2D/3D mode state
  const [is3DMode, setIs3DMode] = useState(false);

  const [activeMenuAction, setActiveMenuAction] = useState<'search' | 'list' | null>(null);
  const activeMenuActionRef = useRef<'search' | 'list' | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [isPinSidebarOpen, setIsPinSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showDataLogModal, setShowDataLogModal] = useState(false);
  const [dataLogCount, setDataLogCount] = useState(0);
  
  // Track page view for map page
  usePageView({
    entity_type: 'map',
    entity_slug: 'map',
    enabled: true,
  });
  
  // Debug state for cursor position and hovered features
  const [debugInfo, setDebugInfo] = useState<{
    cursor: { lat: number; lng: number };
    features: Array<{ layer: string; id: string | number | undefined; properties: Record<string, unknown> }>;
  }>({
    cursor: { lat: 0, lng: 0 },
    features: [],
  });

  // Keep refs in sync
  useEffect(() => {
    activeMenuActionRef.current = activeMenuAction;
  }, [activeMenuAction]);

  // Handle map click - defined before useMap
  // Note: Actual click handling with area/marker checks is done in useEffect below
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }, mapInstance?: import('mapbox-gl').Map | null) => {
    // Handle map clicks for pin creation
  }, []);

  const {
    map,
    mapLoaded,
    mapInfo,
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPopup,
    flyTo,
    triggerGeolocate,
    changeMapStyle,
  } = useMap({
    mapContainer,
    onMapClick: handleMapClick,
  });

  // Map page drawing functionality
  const {
    drawingData,
    isDrawingMode,
    featureCollection,
    startPinMode,
    startAreaMode,
    stopDrawing,
    clearAll,
    onSave: handleDrawingSave,
  } = useMapPageDrawing({
    map,
    mapLoaded,
  });

  // Update data log count
  useEffect(() => {
    const updateCount = () => {
      setDataLogCount(getDataLogCount());
    };
    
    updateCount(); // Initial count
    
    // Listen for data log updates
    window.addEventListener('dataLogUpdated', updateCount);
    
    return () => {
      window.removeEventListener('dataLogUpdated', updateCount);
    };
  }, []);

  // Handle save and complete - save current features to data log and clear
  const handleSaveAndComplete = useCallback(() => {
    // Save all current features to data log
    featureCollection.features.forEach(feature => {
      addDataLogEntry(feature);
    });
    
    // Clear current drawing
    clearAll();
    
    // Update count and trigger event
    setDataLogCount(getDataLogCount());
    window.dispatchEvent(new CustomEvent('dataLogUpdated'));
  }, [featureCollection, clearAll]);

  // Handle open data log
  const handleOpenDataLog = useCallback(() => {
    setShowDataLogModal(true);
    setDataLogCount(getDataLogCount()); // Refresh count
  }, []);

  // Additional safeguard: track map initialization to prevent any refresh issues
  // (useMapController already has this, but adding component-level protection)
  useEffect(() => {
    if (mapLoaded && map && !mapInitializedRef.current) {
      mapInitializedRef.current = true;
      console.log('[Map] Map initialized once - initialization locked');
    }
  }, [mapLoaded, map]);

  // Visibility filtering is now handled in useMapData hook
  // No need for client-side filtering here - it's applied automatically

  // Handle pin click - open sidebar (or switch to different pin)
  const handlePinClick = useCallback((pin: MapPin) => {
    // If clicking the same pin, do nothing (sidebar already open)
    if (selectedPin?.id === pin.id && isPinSidebarOpen) {
      return;
    }
    
    // Switch to clicked pin (opens sidebar if closed, or switches if different pin)
    setSelectedPin(pin);
    setIsPinSidebarOpen(true);
  }, [selectedPin, isPinSidebarOpen]);

  // Tags removed - tags table deleted
  const [pinTags, setPinTags] = useState<any[]>([]);

  // Memoize filters to prevent unnecessary re-renders
  // For Find Me demo, no profile filtering needed
  const pinFilters = useMemo(() => ({
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    profileId: null, // No profile filtering for demo
    visibility: visibilityFilter,
  }), [selectedTagIds, visibilityFilter]);

  // Map pin data hook - loads pins for the map
  const mapPinData = useMapPinData({
    mapLoaded,
    filters: pinFilters,
    autoLoad: true,
  });

  // Track rendered marker IDs for efficient updates
  const renderedMarkerIdsRef = useRef<Set<string>>(new Set());

  // Map pin CRUD operations
  const mapPinCRUD = useMapPinCRUD({
    onPinCreated: async () => {
      await mapPinData.refresh();
    },
    onPinUpdated: async () => {
      await mapPinData.refresh();
    },
    onPinDeleted: async (pinId) => {
      const markerId = `pin-${pinId}`;
      removeMarker(markerId);
      renderedMarkerIdsRef.current.delete(markerId);
      await mapPinData.refresh();
    },
  });

  // Map style state - track current style
  const [currentMapStyle, setCurrentMapStyle] = useState<'light' | 'dark' | 'satellite' | 'streets' | 'outdoors'>('streets');

  // Capture map click events with point coordinates for dialog positioning
  // This runs after useMap's handleMapClick to check for areas/markers/popups
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const handleMapClickWithPoint = (e: import('mapbox-gl').MapMouseEvent) => {
      // Check if click is on a marker, popup, or sidebar - stop propagation to prevent conflicts
      const originalEvent = e.originalEvent;
      if (originalEvent) {
        const target = originalEvent.target as HTMLElement;
        // Check for both Mapbox marker container and custom pin marker class
        const isMarkerClick = target.closest('.mapboxgl-marker') !== null || 
                             target.closest('.map-pin-marker') !== null ||
                             target.closest('.pin-marker') !== null;
        const isPopupClick = target.closest('.mapboxgl-popup') !== null;
        const isSidebarClick = target.closest('[data-pin-sidebar]') !== null || target.closest('.pin-sidebar') !== null;
        if (isMarkerClick || isPopupClick || isSidebarClick) {
          // Stop propagation to prevent other handlers from firing
          originalEvent.stopPropagation();
          originalEvent.stopImmediatePropagation();
          return;
        }
      }

      // Check if click is on an area layer - don't show dialog if clicking on area
      const areaLayers = ['saved-areas-fill', 'saved-areas-labels'].filter(layerId => {
        try {
          return map && map.loaded() && map.getLayer(layerId) !== undefined;
        } catch {
          return false;
        }
      });
      
      const areaFeatures = areaLayers.length > 0
        ? map.queryRenderedFeatures(e.point, { layers: areaLayers })
        : [];
      
      if (areaFeatures && areaFeatures.length > 0) {
        // Click was on an area, let area handler deal with it
        return;
      }

      // Sidebar should ONLY close via close button, not on map clicks
      // This allows users to interact with the map while sidebar is open

      // If auth is still loading, don't handle the click yet
      if (authLoading) {
        return;
      }

      // Anonymous users - show login prompt
      if (!user) {
        setShowLoginPrompt(true);
        return;
      }

    };

    map.on('click', handleMapClickWithPoint);

    return () => {
      map.off('click', handleMapClickWithPoint);
    };
  }, [map, mapLoaded, removeMarker, addMarker, authLoading, user, isPinSidebarOpen]);


  // Toggle map style between light, dark, satellite, streets, and outdoors
  const handleMapStyleToggle = useCallback(async () => {
    if (!map) return;
    
    const styleOrder: Array<'light' | 'dark' | 'satellite' | 'streets' | 'outdoors'> = ['light', 'dark', 'satellite', 'streets', 'outdoors'];
    const currentIndex = styleOrder.indexOf(currentMapStyle);
    const nextIndex = (currentIndex + 1) % styleOrder.length;
    const newStyle = styleOrder[nextIndex];
    
    try {
      await changeMapStyle(newStyle);
      setCurrentMapStyle(newStyle);
    } catch (error) {
      console.error('Error changing map style:', error);
    }
  }, [currentMapStyle, changeMapStyle, map]);

  // MapboxDraw removed - areas moved to /map/areas page

  // Debug: Track cursor position and features under cursor (throttled to prevent infinite loops)
  useEffect(() => {
    if (!map || !mapLoaded) return;

    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 100; // Update at most every 100ms

    const handleMouseMove = (e: import('mapbox-gl').MapMouseEvent) => {
      // Throttle updates to prevent excessive state changes
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, THROTTLE_MS);

      const { lng, lat } = e.lngLat;
      
      const allFeatures = map.queryRenderedFeatures(e.point);

      setDebugInfo({
        cursor: { lat, lng },
        features: allFeatures.map(f => ({
          layer: f.layer?.id || 'unknown',
          id: f.id,
          properties: f.properties || {},
        })),
      });
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      map.off('mousemove', handleMouseMove);
    };
  }, [map, mapLoaded]);

  // Render pins directly (like my-homes page) - efficient, no flickering
  useEffect(() => {
    if (!mapLoaded || !map || !addMarker || !removeMarker) return;
    
    // Only render if we have pins or if loading is complete
    if (mapPinData.isLoading) return;

    // Filter valid pins with coordinates
    const validPins = mapPinData.pins.filter(pin => {
      return pin.lat != null && pin.lng != null && 
             typeof pin.lat === 'number' && typeof pin.lng === 'number' &&
             !isNaN(pin.lat) && !isNaN(pin.lng) && isFinite(pin.lat) && isFinite(pin.lng);
    });

    // Get current and new marker IDs
    const currentMarkerIds = new Set(renderedMarkerIdsRef.current);
    const newMarkerIds = new Set<string>();
    
    // Remove markers that are no longer needed
    currentMarkerIds.forEach((markerId) => {
      if (!validPins.some(pin => `pin-${pin.id}` === markerId)) {
        removeMarker(markerId);
        renderedMarkerIdsRef.current.delete(markerId);
      }
    });

    // Add or update markers for valid pins
    validPins.forEach((pin) => {
      const markerId = `pin-${pin.id}`;
      newMarkerIds.add(markerId);

      // Create marker element with click handler
      const markerElement = document.createElement('div');
      markerElement.className = 'map-pin-marker';
      markerElement.setAttribute('data-pin-id', pin.id);
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #EF4444;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        cursor: pointer;
      `;
      
      // Add click handler
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        handlePinClick(pin);
      }, true);

      // Create popup content
      const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      const popupContent = `
        <div class="map-pin-popup">
          <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(pin.emoji || '📍')} ${escapeHtml(pin.name || 'Unnamed Pin')}</div>
          ${pin.description ? `<div style="font-size: 12px; margin-bottom: 4px;">${escapeHtml(pin.description)}</div>` : ''}
          ${pin.address ? `<div style="font-size: 11px; color: #666;">${escapeHtml(pin.address)}</div>` : ''}
        </div>
      `;

      // Only add if it doesn't exist yet
      if (!currentMarkerIds.has(markerId)) {
        addMarker(markerId, { lat: pin.lat!, lng: pin.lng! }, {
          element: markerElement,
          popupContent,
        });
        renderedMarkerIdsRef.current.add(markerId);
      } else {
        // Update popup for existing marker
        updateMarkerPopup(markerId, popupContent);
      }
    });

    // Update ref
    renderedMarkerIdsRef.current = newMarkerIds;
  }, [mapLoaded, map, mapPinData.pins, mapPinData.isLoading, addMarker, removeMarker, updateMarkerPopup, handlePinClick]);


  // Handle delete record (pins only - areas moved to /map/areas)
  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (!deletingRecord) return;
    
    if (deletingRecord.type === 'pin') {
      await mapPinCRUD.deletePin(recordId);
      if (selectedPin?.id === recordId) {
        setIsPinSidebarOpen(false);
        setSelectedPin(null);
      }
    }
    
    setDeletingRecord(null);
  }, [deletingRecord, mapPinCRUD, selectedPin]);

  // Handle fly to coordinates
  const handleFlyTo = useCallback((coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (map) {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: zoom || 15,
        duration: 1500,
      });
    }
  }, [map]);

  // Handle Find Me button - geolocate user
  const handleFindMe = useCallback(() => {
    if (!map || !navigator.geolocation) {
      showError('Location Unavailable', 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate Minnesota bounds
        const isInMinnesota = 
          latitude >= MAP_CONFIG.MINNESOTA_BOUNDS.south &&
          latitude <= MAP_CONFIG.MINNESOTA_BOUNDS.north &&
          longitude >= MAP_CONFIG.MINNESOTA_BOUNDS.west &&
          longitude <= MAP_CONFIG.MINNESOTA_BOUNDS.east;

        if (!isInMinnesota) {
          showError('Location Outside Minnesota', 'Your location is outside Minnesota. The map is limited to Minnesota state boundaries.');
          return;
        }

        const coordinates = { lat: latitude, lng: longitude };
        setUserLocation(coordinates);
        
        // Remove existing user location marker if any
        removeMarker('user-location');
        
        // Create simple blue circle marker for user location
        const markerElement = document.createElement('div');
        markerElement.style.width = '20px';
        markerElement.style.height = '20px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = '#3B82F6';
        markerElement.style.border = '3px solid white';
        markerElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        markerElement.style.cursor = 'pointer';
        
        // Add marker to map
        await addMarker('user-location', coordinates, { element: markerElement });
        
        // Fly to user location
        handleFlyTo(coordinates, 15);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        showError('Location Error', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map, handleFlyTo, showError, addMarker, removeMarker]);


  // Profile change effect - disabled for Find Me demo to prevent any map refresh
  // Map initialization is protected by useMapController's mapInitializedRef
  // This effect would only refresh pin data, not the map itself, but disabled for demo stability
  // const lastProfileIdRef = useRef<string | null>(null);
  // useEffect(() => {
  //   if (!mapLoaded || !map) return;
  //   // ... profile change logic disabled
  // }, [selectedProfile?.id, mapLoaded, map]);

  // Temporary search marker ID
  const SEARCH_TEMP_MARKER_ID = 'search-temp-location';

  // Listen for location selection from AppSearch
  useEffect(() => {
    const handleLocationSelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ 
        coordinates: { lat: number; lng: number }; 
        placeName: string;
        mapboxMetadata?: any;
      }>;
      const { coordinates, placeName, mapboxMetadata } = customEvent.detail;
      
      // Remove any existing temporary search marker
      removeMarker(SEARCH_TEMP_MARKER_ID);
      
      // Create simple red dot marker
      const markerElement = document.createElement('div');
      markerElement.className = 'search-temp-marker';
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: #EF4444;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        cursor: pointer;
      `;

      // Add temporary marker with popup showing location name
      addMarker(SEARCH_TEMP_MARKER_ID, coordinates, {
        element: markerElement,
        popupContent: `
          <div style="padding: 8px; font-size: 12px; font-weight: 500; color: #1f2937;">
            ${placeName}
          </div>
        `,
      });

      // Save location search when red dot is dropped (background, non-blocking)
      saveLocationSearch({
        place_name: placeName,
        coordinates,
        mapbox_data: mapboxMetadata || {},
        page_source: 'map',
      });

      // Fly to location
      handleFlyTo(coordinates, 15);
    };

    window.addEventListener('mapLocationSelect', handleLocationSelect);
    return () => {
      window.removeEventListener('mapLocationSelect', handleLocationSelect);
      // Clean up temporary marker on unmount
      removeMarker(SEARCH_TEMP_MARKER_ID);
    };
  }, [handleFlyTo, addMarker, removeMarker]);



  // Handle 2D/3D toggle - on demand, no zoom requirement
  const handle3DToggle = useCallback((enabled: boolean) => {
    setIs3DMode(enabled);
    if (!map || !mapLoaded) return;

    if (enabled) {
      // Enable 3D: apply 60° pitch immediately
      map.easeTo({
        pitch: 60,
        duration: 800,
      });
    } else {
      // Disable 3D: reset to 2D (pitch = 0)
      map.easeTo({
        pitch: 0,
        duration: 800,
      });
    }
  }, [map, mapLoaded]);

  // Handle location select from search
  // Must be called before early return to satisfy hooks rules
  const handleLocationSelect = useCallback((coordinates: { lat: number; lng: number }, placeName: string, mapboxMetadata?: any) => {
    handleFlyTo(coordinates, 15);
    saveLocationSearch({
      place_name: placeName,
      coordinates,
      mapbox_data: mapboxMetadata,
      page_source: 'map',
    });
  }, [handleFlyTo]);

  // Handle map style change
  // Must be called before early return to satisfy hooks rules
  const handleStyleChange = useCallback(async (style: string) => {
    if (map && changeMapStyle) {
      const styleKey = style as 'streets' | 'satellite' | 'light' | 'dark' | 'outdoors';
      try {
        await changeMapStyle(styleKey);
        setCurrentMapStyle(styleKey);
      } catch (error) {
        console.error('Error changing map style:', error);
      }
    }
  }, [map, changeMapStyle]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <SimplePageLayout backgroundColor="bg-black" contentPadding="px-0 py-0" containerMaxWidth="full" hideFooter={true}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white font-medium">Loading...</div>
          </div>
        </div>
      </SimplePageLayout>
    );
  }

  return (
    <SimplePageLayout 
      backgroundColor="bg-black" 
      contentPadding="px-0 py-0" 
      containerMaxWidth="full" 
      hideFooter={true} 
      toolbar={
        <MapToolbar 
          mapStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
          onLocationSelect={handleLocationSelect}
          is3DMode={is3DMode}
          on3DToggle={handle3DToggle}
          onFindMe={handleFindMe}
        />
      }
    >
      <div className="w-full relative" style={{ margin: 0, padding: 0, position: 'relative', width: '100%', height: 'calc(100vh - 104px)', minHeight: 'calc(100vh - 104px)', overflow: 'hidden' }}>
        {/* Pin Sidebar - Left of map container */}
        <PinSidebar
          pin={selectedPin}
          isOpen={isPinSidebarOpen}
          onClose={() => {
            setIsPinSidebarOpen(false);
            setSelectedPin(null);
          }}
          onEdit={async (pinId, data) => {
            await mapPinCRUD.updatePin(pinId, data);
            // Refresh the selected pin from mapPinData
            if (selectedPin?.id === pinId) {
              const updatedPin = mapPinData.pins.find(p => p.id === pinId);
              if (updatedPin) {
                setSelectedPin(updatedPin);
              }
            }
          }}
          onDelete={(pin) => {
            // Open delete modal with pin data
            setDeletingRecord({
              id: pin.id,
              type: 'pin',
              name: pin.name,
              description: pin.description || undefined,
            });
            // Close sidebar
            setIsPinSidebarOpen(false);
          }}
        />

        {/* Map Container */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Floating Elements Container - Outside overflow-hidden */}
        <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 100, pointerEvents: 'none' }}>
          {/* Map Stats Widget - Upper Left */}
          {mapLoaded && (
            <div className="absolute top-4 left-4 z-[102]" style={{ pointerEvents: 'auto' }}>
              <MapStats />
            </div>
          )}

          {/* Profile Types Topbar - Top Center (hidden when pin sidebar is open) */}
          {mapLoaded && user && !isPinSidebarOpen && (
            <div style={{ pointerEvents: 'auto' }}>
              <ProfileTypesTopbar />
            </div>
          )}

          {/* Drawing Controls - Bottom Center */}
          {mapLoaded && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[101]" style={{ pointerEvents: 'auto' }}>
              <MapPageDrawingControls
                isDrawingMode={isDrawingMode}
                hasData={!!(drawingData.pin || drawingData.polygon)}
                dataLogCount={dataLogCount}
                onStartPin={startPinMode}
                onStartArea={startAreaMode}
                onStop={stopDrawing}
                onClear={clearAll}
                onSaveAndComplete={handleSaveAndComplete}
                onOpenDataLog={handleOpenDataLog}
              />
            </div>
          )}

          {/* Dynamic Delete Modal - Works for areas and other records */}
          {deletingRecord && user && (
            <MapDeleteModal
              isOpen={!!deletingRecord}
              record={deletingRecord}
              onClose={() => setDeletingRecord(null)}
              onDelete={handleDeleteRecord}
            />
          )}

          {/* Login Prompt Modal - Only show if auth has finished loading and user is not authenticated */}
          {!authLoading && (
            <LoginPromptModal
              isOpen={showLoginPrompt}
              onClose={() => setShowLoginPrompt(false)}
            />
          )}

          {/* Coming Soon Modal */}
          <ComingSoonModal
            isOpen={showComingSoonModal}
            onClose={() => setShowComingSoonModal(false)}
          />

          {/* Data Log Modal */}
          <DataLogModal
            isOpen={showDataLogModal}
            onClose={() => {
              setShowDataLogModal(false);
              setDataLogCount(getDataLogCount()); // Refresh count on close
            }}
          />
        </div>



        {/* Debug Panel - Left */}
        <div className="absolute bottom-4 left-4 z-[105] text-gray-900 text-xs font-mono pointer-events-none">
          <div className="text-[8px] text-gray-700 mb-1">
            {debugInfo.cursor.lat.toFixed(6)}, {debugInfo.cursor.lng.toFixed(6)}
          </div>
          {debugInfo.features.length > 0 ? (
            <div className="space-y-1">
              {debugInfo.features.map((f, idx) => (
                <div key={idx} className="text-gray-900">
                  <div>Layer: {f.layer}</div>
                  <div>ID: {f.id || 'undefined'}</div>
                  {f.properties.name != null && (
                    <div>Name: {String(f.properties.name)}</div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="text-[8px] text-gray-700 mb-1">
              {mapInfo.center.lat.toFixed(6)}, {mapInfo.center.lng.toFixed(6)}
            </div>
            <div className="text-gray-900 space-y-0.5">
              <div>Zoom: {mapInfo.zoom.toFixed(2)}</div>
              {Math.abs(mapInfo.bearing) > 0.1 && (
                <div>Bearing: {mapInfo.bearing.toFixed(1)}°</div>
              )}
              {Math.abs(mapInfo.pitch) > 0.1 && (
                <div>Pitch: {mapInfo.pitch.toFixed(1)}°</div>
              )}
              <div>Style: {currentMapStyle}</div>
            </div>
          </div>
        </div>



        {/* Map Status Indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center">
              {!MAP_CONFIG.MAPBOX_TOKEN ? (
                <div className="bg-white border-2 border-red-500 rounded-lg p-6 max-w-md mx-4">
                  <div className="text-red-600 font-bold text-lg mb-2">⚠️ Mapbox Token Missing</div>
                  <div className="text-gray-700 text-sm mb-4">
                    Please set <code className="bg-gray-100 px-2 py-1 rounded text-xs">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in your <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env.local</code> file.
                  </div>
                  <div className="text-xs text-gray-500">
                    Get your token from: <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mapbox Account</a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-white font-medium">Loading map...</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </SimplePageLayout>
  );
}
