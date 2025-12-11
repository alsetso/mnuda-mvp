'use client';

import { useEffect, useRef } from 'react';
import { PublicMapPinService } from '@/features/map-pins/services/publicMapPinService';
import type { MapPin } from '@/types/map-pin';
import type { MapboxMapInstance } from '@/types/mapbox-events';

interface PinsLayerProps {
  map: MapboxMapInstance;
  mapLoaded: boolean;
}

/**
 * PinsLayer component manages Mapbox pin visualization
 * Handles fetching, formatting, and real-time updates
 */
export default function PinsLayer({ map, mapLoaded }: PinsLayerProps) {
  const sourceId = 'map-pins';
  const layerId = 'map-pins-clusters';
  const clusterCountLayerId = 'map-pins-cluster-count';
  const unclusteredPointLayerId = 'map-pins-unclustered-point';
  const unclusteredPointLabelLayerId = 'map-pins-unclustered-point-label';
  
  const pinsRef = useRef<MapPin[]>([]);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const isAddingLayersRef = useRef<boolean>(false);

  // Fetch pins and add to map
  useEffect(() => {
    if (!map || !mapLoaded) return;

    let mounted = true;

    const loadPins = async () => {
      // Prevent concurrent calls
      if (isAddingLayersRef.current) return;
      
      try {
        const pins = await PublicMapPinService.getPins();
        if (!mounted) return;

        pinsRef.current = pins;
        const geoJSON = PublicMapPinService.pinsToGeoJSON(pins);

        isAddingLayersRef.current = true;

        // Check if source already exists - if so, just update the data
        const existingSource = map.getSource(sourceId);
        if (existingSource && existingSource.type === 'geojson') {
          // Update existing source data (no flash)
          existingSource.setData(geoJSON);
          isAddingLayersRef.current = false;
          return;
        }

        // Source doesn't exist - need to add source and layers
        // First, clean up any existing layers (shouldn't exist if source doesn't, but be safe)
        try {
          if (map.getLayer(unclusteredPointLabelLayerId)) {
            map.removeLayer(unclusteredPointLabelLayerId);
          }
          if (map.getLayer(unclusteredPointLayerId)) {
            map.removeLayer(unclusteredPointLayerId);
          }
          if (map.getLayer(clusterCountLayerId)) {
            map.removeLayer(clusterCountLayerId);
          }
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (e) {
          // Source or layers may already be removed (e.g., during style change)
          // This is expected and safe to ignore
        }

        // Add source
        map.addSource(sourceId, {
          type: 'geojson',
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Add cluster circles
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              10,
              '#f1f075',
              30,
              '#f28cb1',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              10,
              30,
              30,
              40,
            ],
          },
        });

        // Add cluster count labels
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
        });

        // Add unclustered points
        map.addLayer({
          id: unclusteredPointLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['get', 'color'],
              ['get', 'color'],
              '#3b82f6', // Default blue
            ],
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Add labels for unclustered points
        map.addLayer({
          id: unclusteredPointLabelLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': [
              'case',
              ['get', 'label'],
              ['get', 'label'],
              ['get', 'icon'],
              ['get', 'icon'],
              '📍',
            ],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2,
            'text-halo-blur': 1,
          },
        });

        isAddingLayersRef.current = false;
      } catch (error) {
        console.error('Error loading map pins:', error);
        isAddingLayersRef.current = false;
      }
    };

    loadPins();

    // Re-add pins when map style changes (e.g., switching to satellite)
    // 'styledata' fires when style loads, but we need to wait for it to be ready
    const handleStyleData = () => {
      if (!mounted) return;
      // Wait for next frame to ensure style is fully loaded
      requestAnimationFrame(() => {
        if (mounted && map.isStyleLoaded()) {
          // Reset the flag and reload pins
          isAddingLayersRef.current = false;
          loadPins();
        }
      });
    };

    map.on('styledata', handleStyleData);

    // Subscribe to real-time updates
    const subscription = PublicMapPinService.subscribeToPins((payload) => {
      if (!mounted) return;
      
      // Reload pins on any change
      loadPins();
    });

    subscriptionRef.current = subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      map.off('styledata', handleStyleData);
      
      // Cleanup layers and source
      if (map.getSource(sourceId)) {
        try {
          if (map.getLayer(unclusteredPointLabelLayerId)) {
            map.removeLayer(unclusteredPointLabelLayerId);
          }
          if (map.getLayer(unclusteredPointLayerId)) {
            map.removeLayer(unclusteredPointLayerId);
          }
          if (map.getLayer(clusterCountLayerId)) {
            map.removeLayer(clusterCountLayerId);
          }
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          map.removeSource(sourceId);
        } catch (e) {
          // Layers may already be removed
        }
      }
    };
  }, [map, mapLoaded]);

  return null; // This component doesn't render anything
}
