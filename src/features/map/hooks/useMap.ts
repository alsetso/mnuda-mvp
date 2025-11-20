'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { UseMapReturn, Coordinates } from '../types';
import { MAP_CONFIG } from '../config';

// Dynamic import for Mapbox GL JS
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
  onMapClick?: (coordinates: { lat: number; lng: number }, mapInstance?: import('mapbox-gl').Map | null) => void;
}

/**
 * Simplified map hook - basic functionality only
 */
export function useMap({ mapContainer, onMapReady, onMapClick }: UseMapProps): UseMapReturn {
  const map = useRef<import('mapbox-gl').Map | null>(null);
  const markers = useRef<Map<string, import('mapbox-gl').Marker>>(new Map());
  
  const onMapReadyRef = useRef(onMapReady);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [mapInfo, setMapInfo] = useState({
    zoom: 5,
    center: { lat: 46.7296, lng: -94.6859 },
    cursor: { lat: 0, lng: 0 },
    bearing: 0,
    pitch: 0
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAP_CONFIG.MAPBOX_TOKEN) {
      console.error('Mapbox token missing');
      return;
    }

    const initializeMap = async () => {
      try {
        const mapbox = await loadMapboxGL();
        mapbox.accessToken = MAP_CONFIG.MAPBOX_TOKEN;

        if (!mapContainer.current) return;

        map.current = new mapbox.Map({
          container: mapContainer.current,
          style: MAP_CONFIG.MAPBOX_STYLE,
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: MAP_CONFIG.DEFAULT_ZOOM,
          maxZoom: MAP_CONFIG.MAX_ZOOM,
          maxBounds: [
            [MAP_CONFIG.MINNESOTA_BOUNDS.west, MAP_CONFIG.MINNESOTA_BOUNDS.south], // Southwest corner
            [MAP_CONFIG.MINNESOTA_BOUNDS.east, MAP_CONFIG.MINNESOTA_BOUNDS.north]  // Northeast corner
          ],
        });


        map.current.on('load', () => {
          setMapLoaded(true);
          onMapReadyRef.current?.(map.current!);
        });

        // Handle clicks
        map.current.on('click', (e) => {
          onMapClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }, map.current);
        });

        // Track zoom changes
        map.current.on('zoom', () => {
          if (map.current) {
            const center = map.current.getCenter();
            setMapInfo(prev => ({
              ...prev,
              zoom: map.current!.getZoom(),
              center: { lat: center.lat, lng: center.lng },
              bearing: map.current!.getBearing(),
              pitch: map.current!.getPitch()
            }));
          }
        });

        // Track move
        map.current.on('move', () => {
          if (map.current) {
            const center = map.current.getCenter();
            setMapInfo(prev => ({
              ...prev,
              center: { lat: center.lat, lng: center.lng },
              bearing: map.current!.getBearing(),
              pitch: map.current!.getPitch()
            }));
          }
        });

        // Track rotate
        map.current.on('rotate', () => {
          if (map.current) {
            setMapInfo(prev => ({
              ...prev,
              bearing: map.current!.getBearing()
            }));
          }
        });

        // Track pitch
        map.current.on('pitch', () => {
          if (map.current) {
            setMapInfo(prev => ({
              ...prev,
              pitch: map.current!.getPitch()
            }));
          }
        });

        return () => {
          if (map.current) {
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
  }, [mapContainer]);

  // Setup popup listeners
  const setupPopupListeners = useCallback((popup: import('mapbox-gl').Popup, id: string) => {
    popup.on('open', () => {
      const popupElement = popup.getElement();
      if (popupElement) {
        const popupContent = popupElement.querySelector('.mapboxgl-popup-content') as HTMLElement;
        if (popupContent && popupElement.classList.contains('pin-popup-container')) {
          popupContent.style.background = 'transparent';
          popupContent.style.backdropFilter = 'blur(5px)';
          popupContent.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        }

        popupElement.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const pinActionBtn = target.closest('.pin-edit-btn, .pin-delete-btn');
          if (pinActionBtn) {
            e.stopPropagation();
            const pinId = pinActionBtn.getAttribute('data-pin-id');
            const action = pinActionBtn.getAttribute('data-action');
            if (pinId && action) {
              document.dispatchEvent(new CustomEvent('pinAction', { 
                detail: { pinId, action, markerId: id },
                bubbles: true 
              }));
            }
          }
        });
      }
    });
  }, []);

  // Add marker
  const addMarker = useCallback(
    async (
      id: string,
      coordinates: { lat: number; lng: number },
      options: { color?: string; element?: HTMLElement; popupContent?: string } = {}
    ) => {
      if (!map.current) return;

      // Validate coordinates
      if (!coordinates || 
          typeof coordinates !== 'object' ||
          typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number' ||
          isNaN(coordinates.lat) || isNaN(coordinates.lng) ||
          !isFinite(coordinates.lat) || !isFinite(coordinates.lng)) {
        console.warn('Invalid coordinates provided to addMarker:', coordinates, 'for marker:', id);
        return;
      }

      try {
        const mapbox = await loadMapboxGL();
        const existingMarker = markers.current.get(id);

        if (existingMarker) {
          existingMarker.setLngLat([coordinates.lng, coordinates.lat]);
          if (options.popupContent) {
            const popup = existingMarker.getPopup();
            if (popup) {
              popup.setHTML(options.popupContent);
            } else {
              const newPopup = new mapbox.Popup({ 
                offset: 25,
                closeButton: false,
                closeOnClick: false,
                className: 'pin-popup-container',
                maxWidth: '300px',
              }).setHTML(options.popupContent);
              existingMarker.setPopup(newPopup);
              setupPopupListeners(newPopup, id);
            }
          }
          return;
        }

        const markerOptions: Partial<import('mapbox-gl').MarkerOptions> = {
          anchor: 'center',
        };
        
        if (options.element) {
          markerOptions.element = options.element;
        } else if (options.color) {
          markerOptions.color = options.color;
        }
        
        const marker = new mapbox.Marker(markerOptions).setLngLat([coordinates.lng, coordinates.lat]);

        if (options.popupContent) {
          const popup = new mapbox.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            className: 'pin-popup-container',
            maxWidth: '300px',
          }).setHTML(options.popupContent);
          marker.setPopup(popup);
          setupPopupListeners(popup, id);
        }

        const markerElement = marker.getElement();
        if (markerElement && options.popupContent) {
          markerElement.style.cursor = 'pointer';
        }

        marker.addTo(map.current);
        markers.current.set(id, marker);
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    },
    [setupPopupListeners]
  );

  // Remove marker
  const removeMarker = useCallback((id: string) => {
    const marker = markers.current.get(id);
    if (marker) {
      marker.remove();
      markers.current.delete(id);
    }
  }, []);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();
  }, []);

  // Update marker popup
  const updateMarkerPopup = useCallback((id: string, popupContent: string) => {
    const marker = markers.current.get(id);
    if (marker) {
      const popup = marker.getPopup();
      if (popup) {
        popup.setHTML(popupContent);
      } else {
        const mapbox = require('mapbox-gl');
        const newPopup = new mapbox.Popup({ 
          offset: 25,
          closeButton: false,
          closeOnClick: false,
          className: 'pin-popup-container',
          maxWidth: '300px',
        }).setHTML(popupContent);
        marker.setPopup(newPopup);
        setupPopupListeners(newPopup, id);
      }
    }
  }, [setupPopupListeners]);

  // Fly to coordinates
  const flyTo = useCallback((coordinates: { lat: number; lng: number }, zoom?: number) => {
    if (!map.current) return;
    map.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: zoom || MAP_CONFIG.ADDRESS_ZOOM,
      duration: 1000,
    });
  }, []);

  const triggerGeolocate = useCallback(() => {
    // GeolocateControl removed - function kept for compatibility
  }, []);

  const stopGeolocate = useCallback(() => {
    // GeolocateControl removed - function kept for compatibility
  }, []);

  const changeMapStyle = useCallback((styleKey: keyof typeof MAP_CONFIG.STRATEGIC_STYLES): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!map.current) {
        reject(new Error('Map not initialized'));
        return;
      }

      const styleUrl = MAP_CONFIG.STRATEGIC_STYLES[styleKey];
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();

      try {
        map.current.setStyle(styleUrl);
        map.current.once('styledata', () => {
          if (map.current) {
            map.current.setCenter(currentCenter);
            map.current.setZoom(currentZoom);
            resolve();
          }
        });
        map.current.once('error', (e) => {
          reject(new Error(`Failed to load style: ${e.error?.message || 'Unknown error'}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Stub functions for compatibility
  const addAddressPin = useCallback(() => {}, []);
  const removeAddressPin = useCallback(() => {}, []);
  const addUserMarker = useCallback(() => {}, []);
  const removeUserMarker = useCallback(() => {}, []);
  const lockInteractions = useCallback(() => {}, []);
  const unlockInteractions = useCallback(() => {}, []);
  const setCursorStyle = useCallback(() => {}, []);
  const followUser = useCallback(() => {}, []);
  const updateUserLocation = useCallback(() => {}, []);
  const findUserLocation = useCallback(() => {}, []);
  const zoomToMinnesota = useCallback(() => {}, []);
  const flyFromGlobeToMinnesota = useCallback(() => {}, []);
  const zoomToStrategic = useCallback(() => {}, []);

  return {
    mapLoaded,
    userLocation,
    isTracking: false,
    isInteractionsLocked: false,
    mapInfo,
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
    triggerGeolocate,
    stopGeolocate,
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPopup,
    zoomToMinnesota,
    flyFromGlobeToMinnesota,
    zoomToStrategic,
    changeMapStyle,
    map: map.current,
  };
}
