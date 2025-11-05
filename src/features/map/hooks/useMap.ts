'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { UseMapReturn, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';
import { mapPerformanceService } from '../services/mapPerformanceService';

// Dynamic import for Mapbox GL JS to avoid chunk loading issues
let mapboxgl: typeof import('mapbox-gl').default | null = null;
const loadMapboxGL = async () => {
  if (!mapboxgl) {
    const mapboxModule = await import('mapbox-gl');
    mapboxgl = mapboxModule.default;
  }
  return mapboxgl;
};

interface UseMapProps {
  mapContainer: React.RefObject<HTMLDivElement | null>;
  onMapReady?: (map: import('mapbox-gl').Map) => void;
  onMapClick?: (coordinates: { lat: number; lng: number }) => void;
}

/**
 * useMap hook
 * - Centralizes Mapbox lifecycle
 * - Typed marker registry for flexible add/remove
 * - Popup system baked in
 * - Interaction locks, cursor, flyTo helpers
 */
export function useMap({ mapContainer, onMapReady, onMapClick }: UseMapProps): UseMapReturn {
  const map = useRef<import('mapbox-gl').Map | null>(null);

  // Dedicated marker registry keyed by string IDs
  const markers = useRef<Map<string, import('mapbox-gl').Marker>>(new Map());

  // Store callbacks in refs to prevent infinite re-renders
  const onMapReadyRef = useRef(onMapReady);
  const onMapClickRef = useRef(onMapClick);

  // Update refs when callbacks change
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);


  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isTracking] = useState(false);
  const [isInteractionsLocked, setIsInteractionsLocked] = useState(false);
  const [mapInfo, setMapInfo] = useState({
    zoom: 0,
    center: { lat: 0, lng: 0 },
    cursor: { lat: 0, lng: 0 },
    bearing: 0,
    pitch: 0
  });

  // Throttling refs to prevent excessive updates
  const updateMapInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleMouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track map movement and cursor position - moved to top level
  const updateMapInfo = useCallback(() => {
    if (!map.current) return;
    
    // Clear existing timeout
    if (updateMapInfoTimeoutRef.current) {
      clearTimeout(updateMapInfoTimeoutRef.current);
    }
    
    // Throttle updates to prevent excessive re-renders
    updateMapInfoTimeoutRef.current = setTimeout(() => {
      if (!map.current) return;
      
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      const bearing = map.current.getBearing();
      const pitch = map.current.getPitch();
      
      // Use a more precise comparison to avoid unnecessary updates
      setMapInfo(prev => {
        const centerChanged = Math.abs(prev.center.lat - center.lat) > 0.000001 || 
                             Math.abs(prev.center.lng - center.lng) > 0.000001;
        const zoomChanged = Math.abs(prev.zoom - zoom) > 0.001;
        const bearingChanged = Math.abs(prev.bearing - bearing) > 0.001;
        const pitchChanged = Math.abs(prev.pitch - pitch) > 0.001;
        
        if (!centerChanged && !zoomChanged && !bearingChanged && !pitchChanged) {
          return prev;
        }
        
        return {
          ...prev,
          zoom,
          center: { lat: center.lat, lng: center.lng },
          bearing,
          pitch
        };
      });
    }, 16); // ~60fps throttling
  }, []);

  const handleMouseMove = useCallback((e: import('mapbox-gl').MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    
    // Clear existing timeout
    if (handleMouseMoveTimeoutRef.current) {
      clearTimeout(handleMouseMoveTimeoutRef.current);
    }
    
    // Throttle mouse move updates
    handleMouseMoveTimeoutRef.current = setTimeout(() => {
      // Use a more precise comparison for cursor position
      setMapInfo(prev => {
        const cursorChanged = Math.abs(prev.cursor.lat - lat) > 0.000001 || 
                             Math.abs(prev.cursor.lng - lng) > 0.000001;
        
        if (!cursorChanged) {
          return prev;
        }
        
        return {
          ...prev,
          cursor: { lat, lng }
        };
      });
    }, 16); // ~60fps throttling
  }, []);

  // ---------------------------------------------------------------------------
  // Init + teardown
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current || !MAP_CONFIG.MAPBOX_TOKEN || map.current) return;

    const initializeMap = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        if (!mapContainer.current) {
          console.error('Map container not ready');
          return;
        }
        const mapbox = await loadMapboxGL();
        mapbox.accessToken = MAP_CONFIG.MAPBOX_TOKEN;

        if (!(mapContainer.current instanceof HTMLElement)) {
          console.error('Invalid map container:', mapContainer.current);
          return;
        }

        map.current = new mapbox.Map({
          container: mapContainer.current,
          style: MAP_CONFIG.MAPBOX_STYLE,
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: MAP_CONFIG.DEFAULT_ZOOM,
          maxZoom: MAP_CONFIG.MAX_ZOOM,
          // Performance optimizations
          renderWorldCopies: MAP_CONFIG.PERFORMANCE.RENDER_WORLD_COPIES,
          maxTileCacheSize: MAP_CONFIG.PERFORMANCE.MAX_TILE_CACHE_SIZE,
          preserveDrawingBuffer: MAP_CONFIG.PERFORMANCE.PRESERVE_DRAWING_BUFFER,
          antialias: MAP_CONFIG.PERFORMANCE.ANTIALIAS,
          // Strategic advantages
          pitch: 0,
          bearing: 0,
          // Faster loading
          localIdeographFontFamily: MAP_CONFIG.PERFORMANCE.LOCAL_IDEOGRAPH_FONT_FAMILY ? 'Arial Unicode MS' : undefined,
        });

        map.current.on('load', async () => {
          // Performance optimizations after map loads
          if (map.current) {
            // Apply performance optimizations
            mapPerformanceService.optimizeMapRendering(map.current);
            
            // Preload Minnesota tiles for faster navigation
            mapPerformanceService.preloadMinnesotaTiles(map.current).catch(console.warn);
            
            // Start with globe view, then smoothly fly to Minnesota bounds
            setTimeout(() => {
              if (map.current) {
                map.current.flyTo({
                  center: [-94.6859, 46.7296], // Center of Minnesota
                  zoom: 5, // Appropriate zoom level to see Minnesota
                  duration: 3000, // 3 second smooth transition
                  essential: true,
                });
              }
            }, 500); // Small delay to ensure map is fully loaded
          }
          
          setMapLoaded(true);
          onMapReadyRef.current?.(map.current!);
        });

        // Track last interaction to prevent duplicate events
        let lastInteractionTime = 0;
        const INTERACTION_DEBOUNCE_MS = 300; // Prevent duplicate events within 300ms

        const handleMapInteraction = (e: import('mapbox-gl').MapMouseEvent | import('mapbox-gl').MapTouchEvent) => {
          const now = Date.now();
          if (now - lastInteractionTime < INTERACTION_DEBOUNCE_MS) {
            return; // Ignore duplicate events
          }
          lastInteractionTime = now;

          const { lng, lat } = e.lngLat;
          onMapClickRef.current?.({ lat, lng });
        };

        const handleClick = (e: import('mapbox-gl').MapMouseEvent) => {
          handleMapInteraction(e);
        };

        // Handle mobile touch events for immediate pin dropping
        const handleTouchEnd = (e: import('mapbox-gl').MapTouchEvent) => {
          // Only handle single touch (not multi-touch gestures)
          if (e.originalEvent.touches.length === 0) {
            handleMapInteraction(e);
          }
        };

        // Add both click and touchend event listeners
        map.current.on('click', handleClick);
        map.current.on('touchend', handleTouchEnd);

        // Track map movement and cursor position

        // Add event listeners for map changes
        map.current.on('move', updateMapInfo);
        map.current.on('zoom', updateMapInfo);
        map.current.on('rotate', updateMapInfo);
        map.current.on('pitch', updateMapInfo);
        map.current.on('mousemove', handleMouseMove);

        // Initial update
        updateMapInfo();

        return () => {
          if (map.current) {
            map.current.off('click', handleClick);
            map.current.off('touchend', handleTouchEnd);
            map.current.off('move', updateMapInfo);
            map.current.off('zoom', updateMapInfo);
            map.current.off('rotate', updateMapInfo);
            map.current.off('pitch', updateMapInfo);
            map.current.off('mousemove', handleMouseMove);
            map.current.remove();
            map.current = null;
            markers.current.clear();
          }
          
          // Clear any pending timeouts
          if (updateMapInfoTimeoutRef.current) {
            clearTimeout(updateMapInfoTimeoutRef.current);
            updateMapInfoTimeoutRef.current = null;
          }
          if (handleMouseMoveTimeoutRef.current) {
            clearTimeout(handleMouseMoveTimeoutRef.current);
            handleMouseMoveTimeoutRef.current = null;
          }
        };
      } catch (err) {
        console.error('Error initializing map:', err);
        return;
      }
    };

    initializeMap();
  }, [mapContainer, updateMapInfo, handleMouseMove]);

  // ---------------------------------------------------------------------------
  // Marker helpers
  // ---------------------------------------------------------------------------

  const addMarker = useCallback(
    async (
      id: string,
      coordinates: { lat: number; lng: number },
      options: { color?: string; element?: HTMLElement; popupContent?: string } = {}
    ) => {
      if (!map.current) return;
      try {
        const mapbox = await loadMapboxGL();

        // Remove existing marker with same id
        if (markers.current.has(id)) {
          const existingMarker = markers.current.get(id);
          if (existingMarker) {
            existingMarker.remove();
            markers.current.delete(id);
          }
        }

        const markerOptions: Partial<import('mapbox-gl').MarkerOptions> = {};
        if (options.element) markerOptions.element = options.element;
        if (options.color) markerOptions.color = options.color;

        let marker = new mapbox.Marker(markerOptions).setLngLat([coordinates.lng, coordinates.lat]);

        // Attach popup if provided
        if (options.popupContent) {
          const popup = new mapbox.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false
          }).setHTML(options.popupContent);
          marker = marker.setPopup(popup);
          
          // Add event delegation for person item clicks, child result clicks, and accordion toggles
          popup.on('open', () => {
            const popupElement = popup.getElement();
            if (popupElement) {
              // Store property ID from popup content on marker for later retrieval
              const propertyIdAttr = popupElement.querySelector('[data-property-id]');
              if (propertyIdAttr) {
                const propertyId = propertyIdAttr.getAttribute('data-property-id');
                if (propertyId) {
                  // propertyId available via popupElement dataset if needed
                  popupElement.setAttribute('data-current-property-id', propertyId);
                }
              }
              
              popupElement.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                
                // Handle property detail button clicks
                const propertyBtn = target.closest('[data-property-id]');
                if (propertyBtn) {
                  e.stopPropagation();
                  const propertyId = propertyBtn.getAttribute('data-property-id');
                  if (propertyId) {
                    // Dispatch custom event that WorkspaceMap can listen to
                    const event = new CustomEvent('propertyDetailClick', { 
                      detail: { propertyId },
                      bubbles: true 
                    });
                    document.dispatchEvent(event);
                  }
                  return;
                }
                
                // Handle popup close button clicks
                const closeBtn = target.closest('.popup-close-btn');
                if (closeBtn) {
                  e.stopPropagation();
                  popup.remove();
                  return;
                }
                
                // Handle accordion toggle clicks
                const accordionToggle = target.closest('.accordion-toggle');
                if (accordionToggle) {
                  e.stopPropagation();
                  const targetId = accordionToggle.getAttribute('data-target');
                  if (targetId) {
                    const content = popupElement.querySelector(`[data-target="${targetId}"].accordion-content`);
                    const icon = popupElement.querySelector(`[data-target="${targetId}"].accordion-icon`);
                    
                    if (content && icon) {
                      const isHidden = content.classList.contains('hidden');
                      if (isHidden) {
                        content.classList.remove('hidden');
                        (icon as HTMLElement).style.transform = 'rotate(180deg)';
                      } else {
                        content.classList.add('hidden');
                        (icon as HTMLElement).style.transform = 'rotate(0deg)';
                      }
                    }
                  }
                  return;
                }
                
                // Handle person item clicks
                const personItem = target.closest('.person-item');
                if (personItem) {
                  e.stopPropagation();
                  const personData = personItem.getAttribute('data-person-data');
                  if (personData) {
                    try {
                      const person = JSON.parse(personData);
                      // Dispatch custom event for person click
                      const event = new CustomEvent('personClick', { 
                        detail: { person, markerId: id },
                        bubbles: true 
                      });
                      document.dispatchEvent(event);
                    } catch (error) {
                      console.error('Error parsing person data:', error);
                    }
                  }
                  return;
                }
                
                // Handle child result clicks
                const childResultItem = target.closest('.child-result-item');
                if (childResultItem) {
                  e.stopPropagation();
                  const childNodeData = childResultItem.getAttribute('data-child-node-data');
                  if (childNodeData) {
                    try {
                      const childNode = JSON.parse(childNodeData);
                      // Dispatch custom event for child result click
                      const event = new CustomEvent('childResultClick', { 
                        detail: { childNode, markerId: id },
                        bubbles: true 
                      });
                      document.dispatchEvent(event);
                    } catch (error) {
                      console.error('Error parsing child node data:', error);
                    }
                  }
                }
              });
            }
          });
        }

        // Add click event handler to prevent map click when clicking on marker
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            // Toggle popup on marker click
            if (options.popupContent) {
              marker.togglePopup();
            }
            // Property click handled via custom event in popup button click handler above
          });
        }

        marker.addTo(map.current);
        markers.current.set(id, marker);
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    },
    []
  );

  const removeMarker = useCallback((id: string) => {
    const marker = markers.current.get(id);
    if (marker) {
      marker.remove();
      markers.current.delete(id);
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markers.current.forEach((m) => m.remove());
    markers.current.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // Predefined markers
  // ---------------------------------------------------------------------------
  const addAddressPin = useCallback(
    (coordinates: { lat: number; lng: number }) => {
      return addMarker('addressPin', coordinates, {
        color: MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN,
      });
    },
    [addMarker]
  );

  const removeAddressPin = useCallback(() => removeMarker('addressPin'), [removeMarker]);

  const addUserMarker = useCallback(
    (coordinates: { lat: number; lng: number }) => {
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = MAP_CONFIG.MARKER_COLORS.USER_MARKER;
      el.style.border = '3px solid white';
      el.style.animation = `pulse ${MAP_CONFIG.PULSE_ANIMATION_DURATION}ms infinite`;

      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }`;
        document.head.appendChild(style);
      }

      return addMarker('userMarker', coordinates, { element: el });
    },
    [addMarker]
  );

  const removeUserMarker = useCallback(() => removeMarker('userMarker'), [removeMarker]);

  // ---------------------------------------------------------------------------
  // Map controls
  // ---------------------------------------------------------------------------
  const lockInteractions = useCallback(() => {
    if (!map.current) return;
    map.current.dragPan.disable();
    map.current.boxZoom.disable();
    map.current.doubleClickZoom.disable();
    setIsInteractionsLocked(true);
  }, []);

  const unlockInteractions = useCallback(() => {
    if (!map.current) return;
    map.current.dragPan.enable();
    map.current.boxZoom.enable();
    map.current.doubleClickZoom.enable();
    setIsInteractionsLocked(false);
  }, []);

  const setCursorStyle = useCallback((cursor: string) => {
    if (map.current) {
      map.current.getCanvas().style.cursor = cursor;
    }
  }, []);

  const flyTo = useCallback((coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: zoom || MAP_CONFIG.ADDRESS_ZOOM,
      duration: MAP_CONFIG.FLY_TO_DURATION,
      essential: true, // Performance optimization
    });
  }, []);

  const followUser = useCallback(
    (enabled: boolean) => {
      if (!map.current || !userLocation) return;
      if (enabled) {
        map.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: MAP_CONFIG.USER_LOCATION_ZOOM,
          duration: MAP_CONFIG.FLY_TO_DURATION,
          essential: true,
        });
      }
    },
    [userLocation]
  );

  // Strategic zoom controls
  const zoomToMinnesota = useCallback(() => {
    if (!map.current) return;
    map.current.fitBounds([
      [-97.5, 43.5], // Southwest corner
      [-89.5, 49.5]  // Northeast corner
    ], {
      padding: 50,
      duration: MAP_CONFIG.FLY_TO_DURATION,
    });
  }, []);

  // Globe to Minnesota animation
  const flyFromGlobeToMinnesota = useCallback(() => {
    if (!map.current) return;
    
    // First go to globe view
    map.current.flyTo({
      center: [0, 0], // Center of globe
      zoom: 0, // Globe view
      duration: 1000,
      essential: true,
    });
    
    // Then fly to Minnesota after a brief pause
    setTimeout(() => {
      if (map.current) {
        map.current.flyTo({
          center: [-94.6859, 46.7296], // Center of Minnesota
          zoom: 5, // Appropriate zoom level to see Minnesota
          duration: 3000, // 3 second smooth transition
          essential: true,
        });
      }
    }, 1200);
  }, []);

  const zoomToStrategic = useCallback((level: 'state' | 'region' | 'local') => {
    if (!map.current) return;
    
    switch (level) {
      case 'state':
        map.current.flyTo({
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: 6,
          duration: MAP_CONFIG.FLY_TO_DURATION,
          essential: true,
        });
        break;
      case 'region':
        map.current.flyTo({
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: 8,
          duration: MAP_CONFIG.FLY_TO_DURATION,
          essential: true,
        });
        break;
      case 'local':
        map.current.flyTo({
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: 10,
          duration: MAP_CONFIG.FLY_TO_DURATION,
          essential: true,
        });
        break;
    }
  }, []);

  // Strategic style controls
  const changeMapStyle = useCallback((styleKey: keyof typeof MAP_CONFIG.STRATEGIC_STYLES): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!map.current) {
        reject(new Error('Map not initialized'));
        return;
      }
      
      const styleUrl = MAP_CONFIG.STRATEGIC_STYLES[styleKey];
      
      // Store current view state before style change
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      try {
        map.current.setStyle(styleUrl);
        
        // Reapply performance optimizations and restore view after style change
        map.current.once('styledata', () => {
          if (map.current) {
            // Restore the view state
            map.current.setCenter(currentCenter);
            map.current.setZoom(currentZoom);
            
            // Reapply performance optimizations
            mapPerformanceService.optimizeMapRendering(map.current);
            
            // Re-add any existing markers that might have been lost during style change
            markers.current.forEach((marker, id) => {
              const coordinates = marker.getLngLat();
              const popup = marker.getPopup();
              const popupContent = popup && popup.isOpen() ? popup.getElement()?.innerHTML : undefined;
              
              // Remove and re-add marker to ensure it's properly rendered with new style
              marker.remove();
              markers.current.delete(id);
              
              // Re-add marker with same properties
              addMarker(id, { lat: coordinates.lat, lng: coordinates.lng }, { 
                popupContent: popupContent || undefined 
              });
            });
            
            resolve();
          }
        });
        
        // Handle style loading errors
        map.current.once('error', (e) => {
          reject(new Error(`Failed to load style: ${e.error?.message || 'Unknown error'}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }, [addMarker]);

  // ---------------------------------------------------------------------------
  // User location updates
  // ---------------------------------------------------------------------------
  const updateUserLocation = useCallback(
    (location: Coordinates | null) => {
      setUserLocation(location);
      if (location) {
        addUserMarker({ lat: location.latitude, lng: location.longitude });
      } else {
        removeUserMarker();
      }
    },
    [addUserMarker, removeUserMarker]
  );

  const findUserLocation = useCallback(() => {
    console.warn('findUserLocation is deprecated. Use useUserLocationTracker instead.');
  }, []);

  // ---------------------------------------------------------------------------
  // Return API
  // Update marker popup content
  const updateMarkerPopup = useCallback((id: string, popupContent: string) => {
    if (!map.current) return;
    
    const marker = markers.current.get(id);
    if (marker) {
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
        popup.setHTML(popupContent);
      }
    }
  }, []);


  // ---------------------------------------------------------------------------
  return {
    // State
    mapLoaded,
    userLocation,
    isTracking,
    isInteractionsLocked,
    mapInfo,

    // Actions
    findUserLocation,
    addAddressPin,
    removeAddressPin,
    addUserMarker,
    removeUserMarker,
    lockInteractions,
    unlockInteractions,
    setCursorStyle,
    flyTo,
    followUser,
    updateUserLocation,
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPopup,

    // Strategic controls
    zoomToMinnesota,
    flyFromGlobeToMinnesota,
    zoomToStrategic,
    changeMapStyle,

    // Map instance
    map: map.current,
  };
}
