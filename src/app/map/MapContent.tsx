'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import SimplePageLayout from '@/components/SimplePageLayout';
import MapToolbar from '@/components/map/MapToolbar';
import PinsLayer from '@/components/map/PinsLayer';
import CreatePinModal from '@/components/map/CreatePinModal';
import { useAuth } from '@/features/auth';
import { usePageView } from '@/hooks/usePageView';
import type { MapboxMetadata } from '@/types/mapbox';
import type { MapboxMapInstance, MapboxMouseEvent } from '@/types/mapbox-events';

declare global {
  interface Window {
    mapboxgl: {
      accessToken: string;
      Map: new (options: {
        container: HTMLElement;
        style: string;
        center: [number, number];
        zoom: number;
        maxZoom: number;
        maxBounds: [[number, number], [number, number]];
      }) => MapboxMapInstance;
    };
  }
}

const STYLE_MAP: Record<string, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

export default function MapContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState('streets');
  const [is3DMode, setIs3DMode] = useState(false);
  const mapInstanceRef = useRef<MapboxMapInstance | null>(null);
  const clickZoomLevelRef = useRef<number | null>(null);
  const lastClickLocationRef = useRef<{ lng: number; lat: number } | null>(null);
  const isProgrammaticZoomRef = useRef<boolean>(false);
  const { user } = useAuth();
  const [createPinCoordinates, setCreatePinCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isCreatePinModalOpen, setIsCreatePinModalOpen] = useState(false);
  const [pinsRefreshKey, setPinsRefreshKey] = useState(0);

  // Track page view
  usePageView({
    entity_type: 'map',
    entity_slug: 'map',
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    let mounted = true;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token || token === 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw') {
      setMapError('missing-token');
      return;
    }

    const initMap = () => {
      if (!mounted || !mapContainer.current || !window.mapboxgl) return;

      try {
        window.mapboxgl.accessToken = token;

        const mapInstance = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-93.2650, 44.9778],
          zoom: 10,
          maxZoom: 22,
          maxBounds: [
            [-97.5, 43.5],
            [-89.5, 49.5],
          ],
        });

        mapInstanceRef.current = mapInstance;

        mapInstance.on('load', () => {
          if (mounted) {
            setMapLoaded(true);
          }
        });

        mapInstance.on('error', (e: unknown) => {
          console.error('Map error:', e);
          if (mounted) {
            setMapError('load-error');
          }
        });

        // Reset incremental zoom when user manually zooms or pans
        mapInstance.on('zoomend', () => {
          if (!mounted) return;
          if (!isProgrammaticZoomRef.current) {
            // User manually zoomed - reset click zoom sequence
            clickZoomLevelRef.current = null;
            lastClickLocationRef.current = null;
          }
          isProgrammaticZoomRef.current = false;
        });

        mapInstance.on('moveend', () => {
          if (!mounted) return;
          if (!isProgrammaticZoomRef.current) {
            // User manually panned - reset click zoom sequence
            clickZoomLevelRef.current = null;
            lastClickLocationRef.current = null;
          }
          isProgrammaticZoomRef.current = false;
        });

        // Add click handler to fly to location and optionally create pin
        mapInstance.on('click', (e: MapboxMouseEvent) => {
          if (!mounted) return;
          
          const { lng, lat } = e.lngLat;
          
          // Check if click is within Minnesota bounds
          const isInMinnesota = 
            lat >= 43.5 && lat <= 49.5 &&
            lng >= -97.5 && lng <= -89.5;
          
          if (!isInMinnesota) return;
          
          const currentZoom = mapInstance.getZoom();
          const maxZoom = 22;
          const minZoomForClick = 12;
          const zoomIncrement = 1.5;
          const distanceThreshold = 0.01; // ~1km in degrees
          
          // Calculate distance from last click location
          let isNearLastClick = false;
          if (lastClickLocationRef.current) {
            const distance = Math.sqrt(
              Math.pow(lng - lastClickLocationRef.current.lng, 2) +
              Math.pow(lat - lastClickLocationRef.current.lat, 2)
            );
            isNearLastClick = distance < distanceThreshold;
          }
          
          // Determine target zoom level
          let targetZoom: number;
          
          if (clickZoomLevelRef.current === null) {
            // First click in sequence - start zoom sequence
            targetZoom = Math.max(currentZoom + 1, minZoomForClick);
          } else if (isNearLastClick) {
            // Clicking near same location - continue zooming in
            targetZoom = Math.min(clickZoomLevelRef.current + zoomIncrement, maxZoom);
          } else {
            // Clicked far from last location - start new zoom sequence
            targetZoom = Math.max(currentZoom + 1, minZoomForClick);
          }
          
          // If already at max zoom and clicking same area, don't zoom further
          if (clickZoomLevelRef.current !== null && 
              clickZoomLevelRef.current >= maxZoom && 
              isNearLastClick) {
            // Already at max zoom on this location - just center without zooming
            mapInstance.flyTo({
              center: [lng, lat],
              zoom: maxZoom,
              duration: 800,
            });
            
            // Still open pin modal for authenticated users
            if (user) {
              setCreatePinCoordinates({ lat, lng });
              setIsCreatePinModalOpen(true);
            }
            return;
          }
          
          // Update tracking refs
          clickZoomLevelRef.current = targetZoom;
          lastClickLocationRef.current = { lng, lat };
          isProgrammaticZoomRef.current = true;
          
          // Fly to clicked location with incremental zoom
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: targetZoom,
            duration: 1000,
          });
          
          // For authenticated users, also open create pin modal
          if (user) {
            setCreatePinCoordinates({ lat, lng });
            setIsCreatePinModalOpen(true);
          }
        });
      } catch (err) {
        console.error('Failed to initialize map:', err);
        if (mounted) {
          setMapError('init-error');
        }
      }
    };

    // Load Mapbox GL via script tag if not already loaded
    if (window.mapboxgl) {
      initMap();
    } else {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
      script.async = true;
      script.onload = () => {
        if (mounted) {
          initMap();
        }
      };
      script.onerror = () => {
        if (mounted) {
          setMapError('script-error');
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      if (mapInstanceRef.current && !mapInstanceRef.current.removed) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const handleStyleChange = useCallback((style: string) => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const styleUrl = STYLE_MAP[style];
    if (!styleUrl) return;
    
    const currentCenter = mapInstanceRef.current.getCenter();
    const currentZoom = mapInstanceRef.current.getZoom();
    
    mapInstanceRef.current.setStyle(styleUrl);
    mapInstanceRef.current.once('styledata', () => {
      if (mapInstanceRef.current && !mapInstanceRef.current.removed) {
        mapInstanceRef.current.setCenter(currentCenter);
        mapInstanceRef.current.setZoom(currentZoom);
      }
    });
    
    setCurrentMapStyle(style);
  }, [mapLoaded]);

  const handle3DToggle = useCallback((enabled: boolean) => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    setIs3DMode(enabled);
    
    mapInstanceRef.current.easeTo({
      pitch: enabled ? 60 : 0,
      duration: 800,
    });
  }, [mapLoaded]);

  const handleFindMe = useCallback(() => {
    if (!mapInstanceRef.current || !mapLoaded || !navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const isInMinnesota = 
          latitude >= 43.5 && latitude <= 49.5 &&
          longitude >= -97.5 && longitude <= -89.5;

        if (!isInMinnesota) {
          alert('Your location is outside Minnesota. The map is limited to Minnesota state boundaries.');
          return;
        }

        if (mapInstanceRef.current && !mapInstanceRef.current.removed) {
          // Reset click zoom sequence when using find me
          clickZoomLevelRef.current = null;
          lastClickLocationRef.current = null;
          
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500,
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location access in your browser settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [mapLoaded]);

  const handleLocationSelect = useCallback((coordinates: { lat: number; lng: number }, placeName: string, mapboxMetadata?: MapboxMetadata) => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    
    // Reset click zoom sequence when using location search
    clickZoomLevelRef.current = null;
    lastClickLocationRef.current = null;
    
    mapInstanceRef.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      duration: 1500,
    });
  }, [mapLoaded]);

  const handlePinCreated = useCallback(() => {
    // Trigger refresh of pins layer
    setPinsRefreshKey((prev) => prev + 1);
  }, []);

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
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Pins Layer */}
        {mapLoaded && mapInstanceRef.current && (
          <PinsLayer key={pinsRefreshKey} map={mapInstanceRef.current} mapLoaded={mapLoaded} />
        )}

        {/* Create Pin Modal */}
        <CreatePinModal
          isOpen={isCreatePinModalOpen}
          onClose={() => {
            setIsCreatePinModalOpen(false);
            setCreatePinCoordinates(null);
          }}
          coordinates={createPinCoordinates}
          onPinCreated={handlePinCreated}
        />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center">
              {mapError === 'missing-token' ? (
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
