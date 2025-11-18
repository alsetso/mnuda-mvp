'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Pin, PinService, CreatePinData, UpdatePinData } from '../services/pinService';
import { useAuth } from '@/features/auth';
import { useToast } from '@/features/ui/hooks/useToast';
import { clusterPins, Cluster } from '../utils/clustering';

interface UsePinsProps {
  mapLoaded: boolean;
  addMarker: (id: string, coordinates: { lat: number; lng: number }, options?: { element?: HTMLElement; color?: string; popupContent?: string }) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  updateMarkerPopup: (id: string, popupContent: string) => void;
  onPinClick?: (pin: Pin) => void;
  onPinEdit?: (pin: Pin) => void;
  onPinDelete?: (pin: Pin) => void;
  currentZoom?: number; // For zoom-based filtering
  categoryIds?: string[]; // Server-side category filtering
}

interface UsePinsReturn {
  pins: Pin[];
  visiblePins: Pin[]; // Pins currently visible on map
  isLoading: boolean;
  loadPins: () => Promise<void>;
  createPin: (data: CreatePinData) => Promise<Pin>;
  updatePin: (pinId: string, data: UpdatePinData) => Promise<Pin>;
  deletePin: (pinId: string) => Promise<void>;
  refreshPins: () => Promise<void>;
}

/**
 * Hook to manage community pins on the map
 * Handles loading, creating, updating, and deleting pins
 * Uses useMap's marker system for rendering
 */
// Removed MIN_PIN_ZOOM - pins now show at all zoom levels with clustering

export function usePins({
  mapLoaded,
  addMarker,
  removeMarker,
  clearMarkers,
  updateMarkerPopup,
  onPinClick,
  onPinEdit,
  onPinDelete,
  currentZoom = 0,
  categoryIds,
}: UsePinsProps): UsePinsReturn {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pinsLoadedRef = useRef(false);
  
  // All pins are visible now (clustering handles grouping)
  const visiblePins = pins;

  /**
   * Create marker element for a pin - small red dot
   */
  const createPinMarkerElement = useCallback((pin: Pin, isOwner: boolean): HTMLElement => {
    const markerElement = document.createElement('div');
    markerElement.className = 'pin-marker';
    markerElement.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #EF4444;
      cursor: pointer;
    `;
    
    return markerElement;
  }, []);

  /**
   * Create marker element for a cluster
   */
  const createClusterMarkerElement = useCallback((pointCount: number): HTMLElement => {
    const markerElement = document.createElement('div');
    markerElement.className = 'pin-cluster';
    const size = pointCount < 10 ? 30 : pointCount < 100 ? 40 : 50;
    markerElement.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: #EF4444;
      border: 3px solid white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${pointCount < 10 ? '12px' : pointCount < 100 ? '14px' : '16px'};
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    markerElement.textContent = pointCount.toString();
    
    return markerElement;
  }, []);

  /**
   * Create popup content for a pin
   */
  const createPinPopupContent = useCallback((pin: Pin, isOwner: boolean): string => {
    let html = `
      <div class="pin-popup">
        <div class="text-lg mb-1 font-bold text-white">${pin.emoji} ${escapeHtml(pin.name)}</div>
    `;

    if (pin.description) {
      html += `<div class="text-sm text-white/80 mb-2">${escapeHtml(pin.description)}</div>`;
    }

    html += `
        <div class="text-xs text-white/70 mb-3">${escapeHtml(pin.address)}</div>
    `;

    if (isOwner) {
      html += `
        <div class="flex gap-2 pt-2 border-t border-white/20">
          <button class="pin-edit-btn flex-1 px-2 py-1 text-xs font-medium text-white bg-transparent border border-white/30 rounded hover:bg-white/10 transition-colors" data-pin-id="${pin.id}" data-action="edit">
            Edit
          </button>
          <button class="pin-delete-btn flex-1 px-2 py-1 text-xs font-medium text-white bg-red-600/80 rounded hover:bg-red-700/80 transition-colors" data-pin-id="${pin.id}" data-action="delete">
            Delete
          </button>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }, []);

  /**
   * Create popup content for a cluster
   */
  const createClusterPopupContent = useCallback((cluster: Cluster): string => {
    const pinNames = cluster.points
      .slice(0, 5)
      .map(p => p.pin ? escapeHtml(p.pin.name) : 'Pin')
      .join(', ');
    const moreText = cluster.pointCount > 5 ? ` and ${cluster.pointCount - 5} more` : '';
    
    return `
      <div class="pin-popup">
        <div class="text-lg mb-1 font-bold text-white">${cluster.pointCount} Pins</div>
        <div class="text-sm text-white/80 mb-2">${pinNames}${moreText}</div>
        <div class="text-xs text-white/70">Click to zoom in and see individual pins</div>
      </div>
    `;
  }, []);

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Track rendered pin IDs to avoid unnecessary updates
  const renderedPinIdsRef = useRef<Set<string>>(new Set());

  /**
   * Render pins as markers on the map with clustering
   * Clusters nearby pins based on zoom level
   */
  const renderPins = useCallback((pinsToRender: Pin[], zoom: number) => {
    // Convert pins to cluster points
    const clusterPoints = pinsToRender.map(pin => ({
      id: pin.id,
      lat: pin.lat,
      lng: pin.long,
      pin,
    }));

    // Cluster points based on zoom level - reduced radius for tighter clustering
    const clusters = clusterPins(clusterPoints, zoom, 30); // 30px cluster radius (reduced from 50)
    const newMarkerIds = new Set<string>();

    // Remove markers that are no longer needed
    renderedPinIdsRef.current.forEach((markerId) => {
      if (!newMarkerIds.has(markerId)) {
        removeMarker(markerId);
      }
    });

    // Render clusters or individual pins
    clusters.forEach((cluster) => {
      if (cluster.isCluster) {
        // Render cluster marker
        const clusterId = `cluster-${cluster.id}`;
        newMarkerIds.add(clusterId);
        const markerElement = createClusterMarkerElement(cluster.pointCount);
        const popupContent = createClusterPopupContent(cluster);

        addMarker(clusterId, { lat: cluster.lat, lng: cluster.lng }, {
          element: markerElement,
          popupContent,
        });
      } else {
        // Render individual pin
        const pin = cluster.points[0].pin as Pin;
        if (!pin) return;
        
        const pinId = `pin-${pin.id}`;
        newMarkerIds.add(pinId);
        const isOwner = user?.id === pin.user_id;
        const markerElement = createPinMarkerElement(pin, isOwner);
        const popupContent = createPinPopupContent(pin, isOwner);

        addMarker(pinId, { lat: pin.lat, lng: pin.long }, {
          element: markerElement,
          popupContent,
        });
      }
    });

    renderedPinIdsRef.current = newMarkerIds;
  }, [user, addMarker, removeMarker, createPinMarkerElement, createPinPopupContent, createClusterMarkerElement, createClusterPopupContent]);

  /**
   * Load pins from the database
   * Works for both authenticated and anonymous users
   * Filters by category IDs if provided (server-side filtering)
   */
  const loadPins = useCallback(async () => {
    if (!mapLoaded) return;

    setIsLoading(true);
    
    try {
      const loadedPins = await PinService.getAllPins(categoryIds);
      setPins(loadedPins);
      pinsLoadedRef.current = true;
      
      // Render pins on map (filtered by zoom)
      renderPins(loadedPins, currentZoom);
    } catch (err) {
      console.error('Error loading pins:', err);
      pinsLoadedRef.current = false; // Allow retry on error
      error('Load Failed', 'Failed to load pins');
    } finally {
      setIsLoading(false);
    }
  }, [mapLoaded, renderPins, error, currentZoom, categoryIds]);
  
  // Track previous categoryIds to detect changes
  const prevCategoryIdsRef = useRef<string[] | undefined>(undefined);

  // Load pins when map is ready (initial load)
  useEffect(() => {
    if (mapLoaded && !pinsLoadedRef.current) {
      prevCategoryIdsRef.current = categoryIds;
      loadPins();
    }
  }, [mapLoaded, loadPins]);

  // Refetch pins when category IDs change
  useEffect(() => {
    if (!mapLoaded || !pinsLoadedRef.current) return;

    // Check if categoryIds actually changed
    const categoryIdsChanged = 
      prevCategoryIdsRef.current !== categoryIds &&
      (prevCategoryIdsRef.current === undefined || categoryIds === undefined ||
       (prevCategoryIdsRef.current && categoryIds && 
        JSON.stringify([...prevCategoryIdsRef.current].sort()) !== JSON.stringify([...categoryIds].sort())));
    
    if (categoryIdsChanged) {
      prevCategoryIdsRef.current = categoryIds;
      pinsLoadedRef.current = false; // Allow reload
      loadPins();
    }
  }, [categoryIds, mapLoaded, loadPins]);

  // Re-render pins when zoom changes
  useEffect(() => {
    if (mapLoaded && pins.length > 0) {
      renderPins(pins, currentZoom);
    }
  }, [currentZoom, mapLoaded, pins, renderPins]);

  /**
   * Refresh pins (reload from database)
   */
  const refreshPins = useCallback(async () => {
    pinsLoadedRef.current = false;
    await loadPins();
  }, [loadPins]);

  /**
   * Create a new pin
   * Requires authentication
   */
  const createPin = useCallback(async (data: CreatePinData): Promise<Pin> => {
    if (!user) {
      throw new Error('Authentication required to create pins');
    }

    try {
      const newPin = await PinService.createPin(data);
      setPins((prev) => {
        const updated = [newPin, ...prev];
        // Re-render all pins with clustering (will handle the new pin)
        renderPins(updated, currentZoom);
        return updated;
      });
      
      success('Pin Created', 'Your pin has been saved');
      return newPin;
    } catch (err) {
      error('Create Failed', err instanceof Error ? err.message : 'Failed to create pin');
      throw err;
    }
  }, [user, renderPins, currentZoom, success, error]);

  /**
   * Update an existing pin
   * Requires authentication
   */
  const updatePin = useCallback(async (pinId: string, data: UpdatePinData): Promise<Pin> => {
    if (!user) {
      throw new Error('Authentication required to update pins');
    }

    try {
      const updatedPin = await PinService.updatePin(pinId, data);
      setPins((prev) => prev.map((pin) => (pin.id === pinId ? updatedPin : pin)));
      
      // Update marker popup
      const isOwner = updatedPin.user_id === user.id;
      const popupContent = createPinPopupContent(updatedPin, isOwner);
      updateMarkerPopup(`pin-${pinId}`, popupContent);
      
      success('Pin Updated', 'Your pin has been updated');
      return updatedPin;
    } catch (err) {
      error('Update Failed', err instanceof Error ? err.message : 'Failed to update pin');
      throw err;
    }
  }, [user, updateMarkerPopup, createPinPopupContent, success, error]);

  /**
   * Delete a pin
   * Requires authentication
   */
  const deletePin = useCallback(async (pinId: string): Promise<void> => {
    if (!user) {
      throw new Error('Authentication required to delete pins');
    }

    try {
      await PinService.deletePin(pinId);
      setPins((prev) => prev.filter((pin) => pin.id !== pinId));
      
      // Remove marker
      removeMarker(`pin-${pinId}`);
      
      success('Pin Deleted', 'Your pin has been deleted');
    } catch (err) {
      error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete pin');
      throw err;
    }
  }, [user, removeMarker, success, error]);

  // Load pins when map is ready (works for both authenticated and anonymous users)
  useEffect(() => {
    if (mapLoaded && !pinsLoadedRef.current) {
      loadPins();
    }
  }, [mapLoaded, loadPins]);

  return {
    pins,
    visiblePins,
    isLoading,
    loadPins,
    createPin,
    updatePin,
    deletePin,
    refreshPins,
  };
}

