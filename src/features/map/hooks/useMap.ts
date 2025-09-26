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
          const popup = new mapbox.Popup({ offset: 25 }).setHTML(options.popupContent);
          marker = marker.setPopup(popup);
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

    // Map instance
    map: map.current,
  };
}
