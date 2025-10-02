'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { UseMapReturn, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';

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

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isTracking] = useState(false);
  const [isInteractionsLocked, setIsInteractionsLocked] = useState(false);

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
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          onMapReady?.(map.current!);
        });

        const handleClick = (e: import('mapbox-gl').MapMouseEvent) => {
          const { lng, lat } = e.lngLat;
          onMapClick?.({ lat, lng });
        };
        map.current.on('click', handleClick);

        return () => {
          if (map.current) {
            map.current.off('click', handleClick);
            map.current.remove();
            map.current = null;
            markers.current.clear();
          }
        };
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    };

    initializeMap();
  }, [mapContainer, onMapReady, onMapClick]);

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
              popupElement.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                
                // Handle popup close button clicks
                const closeBtn = target.closest('.popup-close-btn');
                if (closeBtn) {
                  e.stopPropagation();
                  marker.remove();
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
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation();
          // Toggle popup on marker click
          if (options.popupContent) {
            marker.togglePopup();
          }
        });

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
        });
      }
    },
    [userLocation]
  );

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

    // Map instance
    map: map.current,
  };
}
