'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Pin, PinService, CreatePinData, UpdatePinData } from '../services/pinService';
import { useAuth } from '@/features/auth';
import { useToast } from '@/features/ui/hooks/useToast';

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
const MIN_PIN_ZOOM = 10; // Minimum zoom level to show pins

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
}: UsePinsProps): UsePinsReturn {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pinsLoadedRef = useRef(false);
  
  // Calculate visible pins based on zoom level
  const visiblePins = currentZoom >= MIN_PIN_ZOOM ? pins : [];

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

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Track rendered pin IDs to avoid unnecessary updates
  const renderedPinIdsRef = useRef<Set<string>>(new Set());

  /**
   * Render pins as markers on the map
   * addMarker handles deduplication and updates internally
   * Only renders pins if zoom level is sufficient
   */
  const renderPins = useCallback((pinsToRender: Pin[], zoom: number) => {
    const shouldShowPins = zoom >= MIN_PIN_ZOOM;
    const pinsToRenderFiltered = shouldShowPins ? pinsToRender : [];
    const newPinIds = new Set(pinsToRenderFiltered.map(p => p.id));

    // Remove markers that are no longer in the list or below zoom threshold
    renderedPinIdsRef.current.forEach((pinId) => {
      if (!newPinIds.has(pinId)) {
        removeMarker(`pin-${pinId}`);
      }
    });

    // Add/update visible pins - addMarker handles deduplication
    pinsToRenderFiltered.forEach((pin) => {
      const isOwner = user?.id === pin.user_id;
      const markerElement = createPinMarkerElement(pin, isOwner);
      const popupContent = createPinPopupContent(pin, isOwner);

      addMarker(`pin-${pin.id}`, { lat: pin.lat, lng: pin.long }, {
        element: markerElement,
        popupContent,
      });
    });

    renderedPinIdsRef.current = newPinIds;
  }, [user, addMarker, removeMarker, createPinMarkerElement, createPinPopupContent]);

  /**
   * Load pins from the database
   * Works for both authenticated and anonymous users
   */
  const loadPins = useCallback(async () => {
    if (!mapLoaded || pinsLoadedRef.current) return;

    pinsLoadedRef.current = true;
    setIsLoading(true);
    
    try {
      const loadedPins = await PinService.getAllPins();
      setPins(loadedPins);
      
      // Render pins on map (filtered by zoom)
      renderPins(loadedPins, currentZoom);
    } catch (err) {
      console.error('Error loading pins:', err);
      pinsLoadedRef.current = false;
      error('Load Failed', 'Failed to load pins');
    } finally {
      setIsLoading(false);
    }
  }, [mapLoaded, renderPins, error, currentZoom]);
  
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
      setPins((prev) => [newPin, ...prev]);
      
      // Add marker for new pin
      const isOwner = true; // User owns the pin they just created
      const markerElement = createPinMarkerElement(newPin, isOwner);
      const popupContent = createPinPopupContent(newPin, isOwner);
      
      addMarker(`pin-${newPin.id}`, { lat: newPin.lat, lng: newPin.long }, {
        element: markerElement,
        popupContent,
      });
      
      success('Pin Created', 'Your pin has been saved');
      return newPin;
    } catch (err) {
      error('Create Failed', err instanceof Error ? err.message : 'Failed to create pin');
      throw err;
    }
  }, [user, addMarker, createPinMarkerElement, createPinPopupContent, success, error]);

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

