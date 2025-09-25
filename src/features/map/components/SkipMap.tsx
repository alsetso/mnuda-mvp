'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { NodeData } from '@/features/session/services/sessionStorage';
import { AddressExtractor, ExtractedAddress } from '../services/addressExtractor';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

interface SkipMapProps {
  nodes: NodeData[];
}

export default function SkipMap({ nodes }: SkipMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addresses, setAddresses] = useState<ExtractedAddress[]>([]);
  const [addressSummary, setAddressSummary] = useState<{ total: number; search: number; current: number; previous: number; withCoordinates: number }>({
    total: 0,
    search: 0,
    current: 0,
    previous: 0,
    withCoordinates: 0,
  });

  // Get Mapbox token
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Extract addresses from nodes
  useEffect(() => {
    const extractAddresses = async () => {
      const extractedAddresses = AddressExtractor.extractAllAddresses(nodes);
      
      // Show addresses immediately, then geocode them
      setAddresses(extractedAddresses);
      
      // Update summary
      const summary = AddressExtractor.getAddressSummary(nodes);
      setAddressSummary({
        total: summary.total,
        search: summary.search,
        current: summary.current,
        previous: summary.previous,
        withCoordinates: summary.withCoordinates,
      });
      
      // Geocode missing addresses in the background
      if (extractedAddresses.some(addr => !addr.coordinates)) {
        const geocodedAddresses = await AddressExtractor.geocodeMissingAddresses(extractedAddresses);
        const uniqueAddresses = AddressExtractor.getUniqueAddresses(geocodedAddresses);
        setAddresses(uniqueAddresses);
      }
    };

    extractAddresses();
  }, [nodes]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set Mapbox access token
    if (mapboxToken && mapboxToken !== 'your_mapbox_token_here') {
      mapboxgl.accessToken = mapboxToken;
    } else {
      // Use a default token for development (you should replace this)
      mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-96.3344, 30.6279], // Default to Texas area
      zoom: 10,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      // Clear markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add markers for addresses with coordinates
  useEffect(() => {
    if (!map.current || !mapLoaded || addresses.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers only for addresses with valid coordinates
    addresses.forEach((address) => {
      // Only create markers for addresses that have coordinates
      if (!address.coordinates) {
        return; // Skip addresses without coordinates
      }
      
      const latitude = address.coordinates.latitude;
      const longitude = address.coordinates.longitude;
        
        // Create marker element with proper anchor point
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: ${getAddressMarkerColor(address.type)};
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: white;
          cursor: pointer;
          position: absolute;
          pointer-events: auto;
        `;
        markerEl.textContent = getAddressMarkerIcon(address.type);

        // Create popup content
        const popupContent = `
          <div style="padding: 12px; min-width: 250px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: ${getAddressMarkerColor(address.type)};
                margin-right: 8px;
              "></span>
              <h3 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: capitalize;">${address.type} Address</h3>
            </div>
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 500;">${address.fullAddress}</p>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Source: ${address.source}</p>
            ${address.dateRange ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Date: ${address.dateRange}</p>` : ''}
            ${address.timespan ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Timespan: ${address.timespan}</p>` : ''}
            ${address.county ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">County: ${address.county}</p>` : ''}
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #888;">
              ${address.coordinates ? `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'Geocoding...'}
            </p>
          </div>
        `;

        // Create popup with proper offset for anchored marker
        const popup = new mapboxgl.Popup({
          offset: [0, -12], // Offset above the smaller marker
          closeButton: true,
          closeOnClick: false,
          anchor: 'bottom', // Anchor popup to bottom of marker
        }).setHTML(popupContent);

        // Create marker with proper anchor point
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center' // Center the marker on the coordinates
        })
          .setLngLat([longitude, latitude])
          .setPopup(popup);
        
        if (map.current) {
          marker.addTo(map.current);
        }
        
        // Store marker reference
        markers.current.push(marker);
    });

    // Fit map to show all markers if there are any
    const addressesWithCoords = addresses.filter(addr => addr.coordinates);
    if (addressesWithCoords.length > 0) {
      const coordinates = addressesWithCoords.map(addr => [
        addr.coordinates!.longitude, 
        addr.coordinates!.latitude
      ] as [number, number]);

      if (coordinates.length === 1) {
        // Single marker - center on it
        map.current.setCenter([coordinates[0][0], coordinates[0][1]]);
        map.current.setZoom(15);
      } else if (coordinates.length > 1) {
        // Multiple markers - fit bounds
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    } else {
      // If no coordinates yet, center on default location
      map.current.setCenter([-98.5795, 39.8283]);
      map.current.setZoom(4);
    }
  }, [addresses, mapLoaded]);

  const getAddressMarkerColor = (type: 'search' | 'current' | 'previous') => {
    switch (type) {
      case 'search': return '#3B82F6'; // Blue - Search addresses
      case 'current': return '#10B981'; // Green - Current addresses
      case 'previous': return '#F59E0B'; // Orange - Previous addresses
      default: return '#6B7280'; // Gray
    }
  };

  const getAddressMarkerIcon = (type: 'search' | 'current' | 'previous') => {
    switch (type) {
      case 'search': return 'S';
      case 'current': return 'C';
      case 'previous': return 'P';
      default: return '?';
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full touch-pan-x touch-pan-y" />
      
      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-xs sm:text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map info overlay */}
      {mapLoaded && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-lg shadow-lg p-2 sm:p-3 text-xs max-w-[200px] sm:max-w-none">
          <div className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Address Legend</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 mr-1 sm:mr-2 flex items-center justify-center text-white text-xs font-bold">S</div>
              <span className="text-xs">Search ({addressSummary.search})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 mr-1 sm:mr-2 flex items-center justify-center text-white text-xs font-bold">C</div>
              <span className="text-xs">Current ({addressSummary.current})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 mr-1 sm:mr-2 flex items-center justify-center text-white text-xs font-bold">P</div>
              <span className="text-xs">Previous ({addressSummary.previous})</span>
            </div>
          </div>
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200">
            <div className="text-gray-600 text-xs">
              Total: {addressSummary.total}
            </div>
            <div className="text-gray-600 text-xs">
              With coords: {addressSummary.withCoordinates}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
