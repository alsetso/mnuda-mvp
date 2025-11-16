'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useMap } from '@/features/map/hooks/useMap';
import { Address } from '@/features/map/types';
import { MAP_CONFIG } from '@/features/map/config';
import { PinEditModal } from '@/features/pins/components/PinEditModal';
import { PinDeleteModal } from '@/features/pins/components/PinDeleteModal';
import { PinCountDisplay } from '@/features/pins/components/PinCountDisplay';
import { usePins } from '@/features/pins/hooks/usePins';
import { ReverseGeocodingService } from '@/features/map/services/reverseGeocodingService';
import { useToast } from '@/features/ui/hooks/useToast';
import { Pin } from '@/features/pins/services/pinService';
import { GlobalFloatingMenu } from '@/components/GlobalFloatingMenu';
import { SearchContent } from '@/components/SearchContent';
import { PinCreationForm } from '@/components/PinCreationForm';
import { LoginPromptModal } from '@/components/LoginPromptModal';
import CommunityChatWidget from '@/features/community/components/CommunityChatWidget';
import MapChatWidget from '@/features/community/components/MapChatWidget';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { AreaService, Area, UpdateAreaData } from '@/features/areas/services/areaService';
import { AreaSaveModal } from '@/features/areas/components/AreaSaveModal';
import { AreaEditModal } from '@/features/areas/components/AreaEditModal';
import { AreaSidebar } from '@/features/areas/components/AreaSidebar';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CommunityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [pinModalCoordinates, setPinModalCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [pinModalAddress, setPinModalAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [deletingPin, setDeletingPin] = useState<Pin | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { error: showError } = useToast();

  // For anonymous users, show limited view (map + public pins only, no create/edit/delete)
  const isAnonymous = !user;

  const [activeMenuAction, setActiveMenuAction] = useState<'create' | 'search' | 'list' | 'draw' | null>(null);
  const activeMenuActionRef = useRef<'create' | 'search' | 'list' | 'draw' | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [drawnGeometry, setDrawnGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [showAreaSaveModal, setShowAreaSaveModal] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [hasDrawnPolygon, setHasDrawnPolygon] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [isActivelyDrawing, setIsActivelyDrawing] = useState(false);
  const [editingAreaShape, setEditingAreaShape] = useState<Area | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isAreaSidebarOpen, setIsAreaSidebarOpen] = useState(false);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  
  // Debug state for cursor position and hovered features
  const [debugInfo, setDebugInfo] = useState<{
    cursor: { lat: number; lng: number };
    features: Array<{ layer: string; id: string | number | undefined; properties: Record<string, unknown> }>;
    hoveredAreaId: string | null;
  }>({
    cursor: { lat: 0, lng: 0 },
    features: [],
    hoveredAreaId: null,
  });

  // Refs for area click handlers to access current state
  // Keep O(1) lookup
  const areasMapRef = useRef<Map<string, Area>>(new Map());
  const areasRef = useRef<Area[]>([]);
  const activeMenuActionForAreasRef = useRef(activeMenuAction);
  const isAnonymousRef = useRef(isAnonymous);
  const editingAreaShapeRef = useRef(editingAreaShape);

  // Keep refs in sync
  useEffect(() => {
    activeMenuActionRef.current = activeMenuAction;
    activeMenuActionForAreasRef.current = activeMenuAction;
  }, [activeMenuAction]);

  // Keep refs in sync when areas change
  useEffect(() => {
    areasRef.current = areas;
    areasMapRef.current = new Map(
      areas.map((a) => [a.id, a])
    );
  }, [areas]);

  useEffect(() => {
    isAnonymousRef.current = isAnonymous;
  }, [isAnonymous]);

  useEffect(() => {
    editingAreaShapeRef.current = editingAreaShape;
  }, [editingAreaShape]);

  // Handle map click - defined before useMap
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }, mapInstance?: import('mapbox-gl').Map | null) => {
    // Don't handle clicks when in draw mode - let Mapbox Draw handle them
    if (activeMenuActionRef.current === 'draw') {
      return;
    }

    // Anonymous users - show login prompt when clicking map
    if (isAnonymous) {
      setShowLoginPrompt(true);
      return;
    }

    // Check zoom level - get from map instance if available
    let currentZoom = 0;
    if (mapInstance) {
      currentZoom = mapInstance.getZoom();
    }

    // If no menu action is selected, start create pin flow
    if (activeMenuActionRef.current === null) {
      // Only allow pin creation if zoom is 12x or more
      if (currentZoom < 12) {
        showError('Zoom In Required', `Please zoom in to at least 12x to create a pin (current: ${currentZoom.toFixed(1)}x)`);
        return;
      }
      
      // Set create mode and proceed with pin creation
      setActiveMenuAction('create');
      setPinModalCoordinates(coordinates);
      setIsLoadingAddress(true);
      
      try {
        const result = await ReverseGeocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
        setPinModalAddress(result.address);
      } catch (err) {
        console.error('Error reverse geocoding:', err);
        setPinModalAddress(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
      } finally {
        setIsLoadingAddress(false);
      }
      return;
    }

    // Only handle map clicks when create menu is active
    if (activeMenuActionRef.current !== 'create') {
      return;
    }

    // Only allow pin creation if zoom is 12x or more
    if (currentZoom < 12) {
      showError('Zoom In Required', `Please zoom in to at least 12x to create a pin (current: ${currentZoom.toFixed(1)}x)`);
      return;
    }

    // Set coordinates - the form will handle reverse geocoding
    setPinModalCoordinates(coordinates);
    setIsLoadingAddress(true);
    
    try {
      const result = await ReverseGeocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
      setPinModalAddress(result.address);
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      setPinModalAddress(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [isAnonymous, showError]);

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

  // Map style state - track current style
  const [currentMapStyle, setCurrentMapStyle] = useState<'dark' | 'satellite'>('dark');


  // Helper function to add Minnesota polygon and areas layers
  const addMapLayers = useCallback(async (mapInstance: import('mapbox-gl').Map) => {
    // Add Minnesota polygon GeoJSON source if it doesn't exist
    // Using simplified bounding box polygon for Minnesota state
    if (!mapInstance.getSource('minnesota')) {
      const bounds = MAP_CONFIG.MINNESOTA_BOUNDS;
      mapInstance.addSource('minnesota', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [bounds.west, bounds.south],  // Southwest corner
                [bounds.east, bounds.south],  // Southeast corner
                [bounds.east, bounds.north],  // Northeast corner
                [bounds.west, bounds.north],  // Northwest corner
                [bounds.west, bounds.south]   // Close polygon
              ]
            ]
          }
        }
      });
    }

    // Add Minnesota fill layer if it doesn't exist
    if (!mapInstance.getLayer('minnesota-fill')) {
      mapInstance.addLayer({
        'id': 'minnesota-fill',
        'type': 'fill',
        'source': 'minnesota',
        'layout': {},
        'paint': {
          'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN,
          'fill-opacity': 0.3
        }
      });
    }

    // Add Minnesota outline layer if it doesn't exist
    if (!mapInstance.getLayer('minnesota-outline')) {
      mapInstance.addLayer({
        'id': 'minnesota-outline',
        'type': 'line',
        'source': 'minnesota',
        'layout': {},
        'paint': {
          'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN,
          'line-width': 2
        }
      });
    }

    // Load and add saved areas
    try {
      const savedAreas = await AreaService.getAllAreas();
      if (savedAreas.length > 0) {
        // IMPORTANT: Ensure IDs are strings for Mapbox feature-state
        const features = savedAreas.map(area => {
          const feature: GeoJSON.Feature = {
            type: 'Feature',
            id: String(area.id), // Ensure ID is a string
            properties: {
              name: area.name,
              description: area.description,
              visibility: area.visibility,
              category: area.category || 'custom',
            },
            geometry: area.geometry,
          };
          return feature;
        });

        const geoJsonData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features,
        };

        // Add or update saved areas source
        if (mapInstance.getSource('saved-areas')) {
          const source = mapInstance.getSource('saved-areas') as import('mapbox-gl').GeoJSONSource;
          source.setData(geoJsonData);
        } else {
          mapInstance.addSource('saved-areas', {
            type: 'geojson',
            data: geoJsonData,
            generateId: false, // Use our own IDs, don't generate new ones
          });
        }

        // Add saved areas layers if they don't exist
        if (!mapInstance.getLayer('saved-areas-fill')) {
          mapInstance.addLayer({
            id: 'saved-areas-fill',
            type: 'fill',
            source: 'saved-areas',
            layout: {},
            paint: {
              'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN,
              'fill-opacity': 0.2,
            },
          });
        }

        if (!mapInstance.getLayer('saved-areas-outline')) {
          mapInstance.addLayer({
            id: 'saved-areas-outline',
            type: 'line',
            source: 'saved-areas',
            layout: {},
            paint: {
              'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN,
              'line-width': 2,
            },
          });
        }

        if (!mapInstance.getLayer('saved-areas-labels')) {
          mapInstance.addLayer({
            id: 'saved-areas-labels',
            type: 'symbol',
            source: 'saved-areas',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 14,
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0, 0, 0, 0.5)',
              'text-halo-width': 2,
              'text-opacity': 0.7,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error loading areas:', err);
    }
  }, []);

  // Toggle map style between dark and satellite
  const handleMapStyleToggle = useCallback(async () => {
    if (!map) return;
    
    const newStyle = currentMapStyle === 'dark' ? 'satellite' : 'dark';
    try {
      await changeMapStyle(newStyle);
      setCurrentMapStyle(newStyle);
      
      // Re-add layers after style change
      map.once('styledata', () => {
        addMapLayers(map);
      });
    } catch (error) {
      console.error('Error changing map style:', error);
    }
  }, [currentMapStyle, changeMapStyle, map, addMapLayers]);

  // Initialize Mapbox Draw and add Minnesota polygon on map load
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Initialize Mapbox Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'simple_select', // Start in select mode - only allow drawing when draw icon is clicked
      styles: [
        // Active polygon being drawn
        {
          'id': 'gl-draw-polygon-fill-inactive',
          'type': 'fill',
          'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
            'fill-opacity': 0.3
          }
        },
        {
          'id': 'gl-draw-polygon-fill-active',
          'type': 'fill',
          'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          'paint': {
            'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
            'fill-opacity': 0.5
          }
        },
        {
          'id': 'gl-draw-polygon-stroke-inactive',
          'type': 'line',
          'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
            'line-width': 2
          }
        },
        {
          'id': 'gl-draw-polygon-stroke-active',
          'type': 'line',
          'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          'paint': {
            'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
            'line-width': 3
          }
        },
        // Point styles
        {
          'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          'paint': {
            'circle-radius': 5,
            'circle-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN // gold-500
          }
        },
        {
          'id': 'gl-draw-polygon-and-line-vertex-inactive',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          'paint': {
            'circle-radius': 3,
            'circle-color': '#fff'
          }
        }
      ]
    });

    map.addControl(draw);
    drawRef.current = draw;
    
    // Ensure draw starts in simple_select mode (not drawing)
    draw.changeMode('simple_select');

    // Handle draw events
    const handleDrawCreate = () => {
      // Polygon creation completed - enable save button
      if (drawRef.current && !isAnonymous) {
        const allFeatures = drawRef.current.getAll();
        if (allFeatures.features.length > 0) {
          setHasDrawnPolygon(true);
        }
        setIsActivelyDrawing(false);
      }
    };

    const handleDrawUpdate = () => {
      // Polygon updated - check if still has features
      if (drawRef.current) {
        const allFeatures = drawRef.current.getAll();
        setHasDrawnPolygon(allFeatures.features.length > 0);
      }
    };

    const handleDrawDelete = () => {
      // Polygon deleted - hide save button if no features remain
      if (drawRef.current) {
        const allFeatures = drawRef.current.getAll();
        setHasDrawnPolygon(allFeatures.features.length > 0);
      }
    };

    const handleDrawModeChange = () => {
      // Check polygon state when mode changes
      if (drawRef.current) {
        const mode = drawRef.current.getMode();
        if (mode === 'draw_polygon') {
          // Reset when starting new polygon
          setHasDrawnPolygon(false);
          setIsActivelyDrawing(true);
        } else {
          const allFeatures = drawRef.current.getAll();
          setHasDrawnPolygon(allFeatures.features.length > 0);
          setIsActivelyDrawing(false);
        }
      }
    };

    // Listen for vertex additions and render events during drawing
    const handleDrawVertexAdded = () => {
      // When a vertex is added, we're actively drawing
      if (drawRef.current) {
        const mode = drawRef.current.getMode();
        if (mode === 'draw_polygon') {
          setIsActivelyDrawing(true);
        }
        const allFeatures = drawRef.current.getAll();
        // Show button if we have any features (completed or in-progress)
        setHasDrawnPolygon(allFeatures.features.length > 0);
      }
    };

    // Also listen for render events which fire on any draw state change
    const handleDrawRender = () => {
      if (drawRef.current) {
        const allFeatures = drawRef.current.getAll();
        const mode = drawRef.current.getMode();
        // Track active drawing state
        if (mode === 'draw_polygon') {
          setIsActivelyDrawing(true);
        } else {
          setIsActivelyDrawing(false);
        }
        // Show button if in draw mode and we have features
        if (mode === 'draw_polygon' || mode === 'simple_select') {
          setHasDrawnPolygon(allFeatures.features.length > 0);
        }
      }
    };

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.modechange', handleDrawModeChange);
    map.on('draw.vertexadded', handleDrawVertexAdded);
    map.on('draw.render', handleDrawRender);

    // Add Minnesota polygon GeoJSON source
    const bounds = MAP_CONFIG.MINNESOTA_BOUNDS;
    map.addSource('minnesota', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [bounds.west, bounds.south],  // Southwest corner
              [bounds.east, bounds.south],  // Southeast corner
              [bounds.east, bounds.north],  // Northeast corner
              [bounds.west, bounds.north],  // Northwest corner
              [bounds.west, bounds.south]   // Close polygon
            ]
          ]
        }
      }
    });

    // Add fill layer for Minnesota polygon
    map.addLayer({
      'id': 'minnesota-fill',
      'type': 'fill',
      'source': 'minnesota',
      'layout': {},
      'paint': {
        'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
        'fill-opacity': 0.3
      }
    });

    // Add outline layer for Minnesota polygon
    map.addLayer({
      'id': 'minnesota-outline',
      'type': 'line',
      'source': 'minnesota',
      'layout': {},
      'paint': {
        'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
        'line-width': 2
      }
    });

    // Load and display saved areas
    const loadAreas = async () => {
      try {
        const loadedAreas = await AreaService.getAllAreas();
        setAreas(loadedAreas);
        
        // Keep refs in sync
        areasRef.current = loadedAreas;
        areasMapRef.current = new Map(
          loadedAreas.map((a) => [a.id, a])
        );

        if (loadedAreas.length > 0) {
          // Create GeoJSON FeatureCollection from saved areas
          // IMPORTANT: Ensure IDs are strings and properly set for Mapbox feature-state
          const features = loadedAreas.map(area => {
            const feature: GeoJSON.Feature = {
              type: 'Feature',
              id: String(area.id), // Ensure ID is a string
              properties: {
                name: area.name,
                description: area.description,
                visibility: area.visibility,
                category: area.category || 'custom',
              },
              geometry: area.geometry,
            };
            return feature;
          });

          const geoJsonData: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features,
          };

          // Add source for saved areas
          // If source exists, remove and recreate to ensure IDs are properly set
          if (map.getSource('saved-areas')) {
            // Remove existing layers first
            if (map.getLayer('saved-areas-fill')) map.removeLayer('saved-areas-fill');
            if (map.getLayer('saved-areas-outline')) map.removeLayer('saved-areas-outline');
            if (map.getLayer('saved-areas-labels')) map.removeLayer('saved-areas-labels');
            
            // Remove source
            map.removeSource('saved-areas');
          }
          
          // Create source with generateId: false to use our own IDs
          map.addSource('saved-areas', {
            type: 'geojson',
            data: geoJsonData,
            generateId: false, // Use our own IDs, don't generate new ones
          });
          
          // Debug: Verify IDs are set
          console.log('[loadAreas] Created/Recreated source with', features.length, 'features');
          features.forEach(f => {
            console.log('[loadAreas] Feature ID:', f.id, 'Name:', f.properties.name);
          });

          // Add fill layer for saved areas with feature-state support for hover
          map.addLayer({
            id: 'saved-areas-fill',
            type: 'fill',
            source: 'saved-areas',
            layout: {},
            paint: {
              'fill-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.4,  // Highlighted opacity when hovered
                0.2   // Default opacity
              ],
            },
          });
          
          // Add outline layer for saved areas
          map.addLayer({
            id: 'saved-areas-outline',
            type: 'line',
            source: 'saved-areas',
            layout: {},
            paint: {
              'line-color': MAP_CONFIG.MARKER_COLORS.ADDRESS_PIN, // gold-500
              'line-width': 2,
            },
          });

          // Add symbol layer for area name labels
          map.addLayer({
            id: 'saved-areas-labels',
            type: 'symbol',
            source: 'saved-areas',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 14,
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0, 0, 0, 0.5)',
              'text-halo-width': 2,
              'text-opacity': 0.7,
            },
          });
        }
      } catch (err) {
        console.error('Error loading areas:', err);
      }
    };

    loadAreas();

    return () => {
      if (drawRef.current && map) {
        map.off('draw.create', handleDrawCreate);
        map.off('draw.update', handleDrawUpdate);
        map.off('draw.delete', handleDrawDelete);
        map.off('draw.modechange', handleDrawModeChange);
        map.off('draw.vertexadded', handleDrawVertexAdded);
        map.off('draw.render', handleDrawRender);
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
      if (map.getSource('minnesota')) {
        map.removeLayer('minnesota-fill');
        map.removeLayer('minnesota-outline');
        map.removeSource('minnesota');
      }
      if (map.getSource('saved-areas')) {
        if (map.getLayer('saved-areas-labels')) {
          map.removeLayer('saved-areas-labels');
        }
        if (map.getLayer('saved-areas-fill')) {
          map.removeLayer('saved-areas-fill');
        }
        if (map.getLayer('saved-areas-outline')) {
          map.removeLayer('saved-areas-outline');
        }
        map.removeSource('saved-areas');
      }
    };
  }, [map, mapLoaded]);

  // Area click/hover handlers - register after layers exist
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // --- CLICK ON AREA → OPEN SIDEBAR ---
    const handleAreaClick: import('mapbox-gl').MapLayerMouseEventHandler = (e) => {
      console.log('[AreaClick] Click detected on area layer', e.features);
      
      // Respect draw/edit modes
      if (
        activeMenuActionForAreasRef.current === 'draw' ||
        editingAreaShapeRef.current
      ) {
        console.log('[AreaClick] Ignoring click - in draw/edit mode');
        return;
      }

      // Stop propagation so background handler doesn't fire
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }

      const features = e.features;
      if (!features || !features.length) {
        console.log('[AreaClick] No features found');
        return;
      }

      const feature = features[0];
      const areaId = feature.id as string;
      if (!areaId) {
        console.log('[AreaClick] No area ID found');
        return;
      }

      console.log('[AreaClick] Looking up area:', areaId);
      const area = areasMapRef.current.get(areaId);
      if (!area) {
        console.log('[AreaClick] Area not found in map:', areaId);
        return;
      }

      console.log('[AreaClick] Opening sidebar for area:', area.name);
      setSelectedArea(area);
      setIsAreaSidebarOpen(true);
    };

    // --- CLICK ON EMPTY MAP → CLOSE SIDEBAR ---
    const handleMapClickForSidebar: import('mapbox-gl').MapMouseEventHandler = (e) => {
      console.log('[MapClickForSidebar] Global click handler fired', e.point);
      
      // Don't close if we're drawing / editing
      if (
        activeMenuActionForAreasRef.current === 'draw' ||
        editingAreaShapeRef.current
      ) {
        console.log('[MapClickForSidebar] Ignoring - in draw/edit mode');
        return;
      }

      // Check if click was on an area feature - if so, don't close
      // Layer-specific handlers should have already handled this, but double-check
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['saved-areas-fill', 'saved-areas-labels'],
      });

      // If clicking on an area, don't close (let handleAreaClick handle it)
      if (features && features.length > 0) {
        console.log('[MapClickForSidebar] Click was on area, ignoring');
        return;
      }

      // Otherwise, close sidebar
      console.log('[MapClickForSidebar] Closing sidebar - empty map click');
      setSelectedArea(null);
      setIsAreaSidebarOpen(false);
    };

    // --- HOVER → POINTER CURSOR + FEATURE-SPECIFIC HIGHLIGHT ---
    const handleAreaMouseEnter: import('mapbox-gl').MapLayerMouseEventHandler = (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      // Identify the specific area being hovered
      const features = e.features;
      if (features && features.length > 0) {
        const feature = features[0];
        const areaId = feature.id as string;
        
        if (areaId) {
          console.log('[AreaHover] Hovering over area:', areaId);
          setHoveredAreaId(areaId);
          
          // Use feature-state to highlight only this specific feature
          if (map.getSource('saved-areas')) {
            map.setFeatureState(
              { source: 'saved-areas', id: areaId },
              { hover: true }
            );
          }
        }
      }
    };

    const handleAreaMouseLeave: import('mapbox-gl').MapLayerMouseEventHandler = (e) => {
      map.getCanvas().style.cursor = '';
      
      // Clear hover state for the specific feature
      const features = e.features;
      if (features && features.length > 0) {
        const feature = features[0];
        const areaId = feature.id as string;
        
        if (areaId) {
          console.log('[AreaHover] Leaving area:', areaId);
          setHoveredAreaId(null);
          
          // Clear feature-state
          if (map.getSource('saved-areas')) {
            map.setFeatureState(
              { source: 'saved-areas', id: areaId },
              { hover: false }
            );
          }
        }
      }
    };

    // Register handlers only if layers exist
    const registerHandlers = () => {
      const fillLayerExists = map.getLayer('saved-areas-fill');
      const labelsLayerExists = map.getLayer('saved-areas-labels');
      
      if (!fillLayerExists && !labelsLayerExists) {
        console.log('[AreaHandlers] Layers not found yet, skipping registration');
        return;
      }
      
      // Remove existing handlers first to prevent duplicates
      if (fillLayerExists) {
        map.off('click', 'saved-areas-fill', handleAreaClick);
        map.off('mouseenter', 'saved-areas-fill', handleAreaMouseEnter);
        map.off('mouseleave', 'saved-areas-fill', handleAreaMouseLeave);
      }
      if (labelsLayerExists) {
        map.off('click', 'saved-areas-labels', handleAreaClick);
        map.off('mouseenter', 'saved-areas-labels', handleAreaMouseEnter);
        map.off('mouseleave', 'saved-areas-labels', handleAreaMouseLeave);
      }
      map.off('click', handleMapClickForSidebar);
      
      // Register layer-specific handlers
      if (fillLayerExists) {
        map.on('click', 'saved-areas-fill', handleAreaClick);
        map.on('mouseenter', 'saved-areas-fill', handleAreaMouseEnter);
        map.on('mouseleave', 'saved-areas-fill', handleAreaMouseLeave);
        console.log('[AreaHandlers] Registered handlers for saved-areas-fill');
      }

      if (labelsLayerExists) {
        map.on('click', 'saved-areas-labels', handleAreaClick);
        map.on('mouseenter', 'saved-areas-labels', handleAreaMouseEnter);
        map.on('mouseleave', 'saved-areas-labels', handleAreaMouseLeave);
        console.log('[AreaHandlers] Registered handlers for saved-areas-labels');
      }

      // Background click handler - register once
      map.on('click', handleMapClickForSidebar);
      console.log('[AreaHandlers] Registered background click handler');
    };

    // Register handlers immediately if layers exist
    registerHandlers();

    // Also listen for when layers are added (after style/data loads)
    const handleDataLoad = () => {
      registerHandlers();
    };
    
    map.on('data', handleDataLoad);
    
    // Also register after a delay to catch async layer creation
    const timeoutId = setTimeout(() => {
      registerHandlers();
    }, 1500);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      if (!map) return;
      
      map.off('data', handleDataLoad);
      
      if (map.getLayer('saved-areas-fill')) {
        map.off('click', 'saved-areas-fill', handleAreaClick);
        map.off('mouseenter', 'saved-areas-fill', handleAreaMouseEnter);
        map.off('mouseleave', 'saved-areas-fill', handleAreaMouseLeave);
      }
      
      if (map.getLayer('saved-areas-labels')) {
        map.off('click', 'saved-areas-labels', handleAreaClick);
        map.off('mouseenter', 'saved-areas-labels', handleAreaMouseEnter);
        map.off('mouseleave', 'saved-areas-labels', handleAreaMouseLeave);
      }
      
      map.off('click', handleMapClickForSidebar);
    };
  }, [map, mapLoaded]);

  // Debug: Track cursor position and features under cursor
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const handleMouseMove = (e: import('mapbox-gl').MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      
      // Query all features at cursor position (areas and any other layers)
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['saved-areas-fill', 'saved-areas-labels', 'saved-areas-outline'],
      });
      
      // Also check for markers/pins by querying all rendered features
      const allFeatures = map.queryRenderedFeatures(e.point);

      setDebugInfo({
        cursor: { lat, lng },
        features: allFeatures.map(f => ({
          layer: f.layer?.id || 'unknown',
          id: f.id,
          properties: f.properties || {},
        })),
        hoveredAreaId: hoveredAreaId,
      });
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, mapLoaded, hoveredAreaId]);

  // Handle draw mode activation/deactivation
  useEffect(() => {
    if (!map || !drawRef.current) return;

    if (activeMenuAction === 'draw') {
      drawRef.current.changeMode('draw_polygon');
      // Use crosshair cursor - Mapbox Draw will handle the cursor properly
      // The custom pencil cursor had offset issues, so we'll use crosshair which is more accurate
      map.getCanvas().style.cursor = 'crosshair';
      setHasDrawnPolygon(false);
      setIsActivelyDrawing(true);
    } else {
      if (drawRef.current.getMode() === 'draw_polygon') {
        drawRef.current.changeMode('simple_select');
      }
      // Only reset cursor if not in create mode
      if (activeMenuAction !== 'create') {
        map.getCanvas().style.cursor = '';
      }
      setHasDrawnPolygon(false);
      setIsActivelyDrawing(false);
    }
  }, [map, activeMenuAction]);

  // Handle editing area shape
  const handleEditAreaShape = useCallback((area: Area) => {
    if (!drawRef.current || !map) return;
    
    // Clear any existing drawn features
    const allFeatures = drawRef.current.getAll();
    allFeatures.features.forEach((feature) => {
      if (feature.id) {
        drawRef.current?.delete(feature.id as string);
      }
    });
    
    // Add the area's geometry to Mapbox Draw
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      id: area.id,
      properties: {
        name: area.name,
        description: area.description,
        visibility: area.visibility,
        category: area.category,
      },
      geometry: area.geometry,
    };
    
    drawRef.current.add(feature);
    
    // Switch to direct_select mode to allow editing vertices
    drawRef.current.changeMode('direct_select', { featureId: area.id });
    
    // Set state to track we're editing
    setEditingAreaShape(area);
    setHasDrawnPolygon(true);
    setIsActivelyDrawing(false);
    
    // Zoom to the area
    if (area.geometry.type === 'Polygon' && area.geometry.coordinates[0]) {
      const coords = area.geometry.coordinates[0];
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 50, duration: 500 }
      );
    }
  }, [map]);

  // Handle save button click
  const handleSaveArea = useCallback(async () => {
    if (!drawRef.current || isAnonymous) return;

    const allFeatures = drawRef.current.getAll();
    if (allFeatures.features.length === 0) return;
    
    const geometry = allFeatures.features[0].geometry;
    
    // If we're editing an existing area shape, update it directly
    if (editingAreaShape) {
      try {
        await AreaService.updateArea(editingAreaShape.id, { geometry });
        
        // Reload areas after update
        const updatedAreas = await AreaService.getAllAreas();
        setAreas(updatedAreas);
        
        // Update map source
        if (map && mapLoaded) {
          const features = updatedAreas.map(area => ({
            type: 'Feature' as const,
            id: area.id,
            properties: {
              name: area.name,
              description: area.description,
              visibility: area.visibility,
              category: area.category || 'custom',
            },
            geometry: area.geometry,
          }));

          const geoJsonData = {
            type: 'FeatureCollection' as const,
            features,
          };

          if (map.getSource('saved-areas')) {
            (map.getSource('saved-areas') as import('mapbox-gl').GeoJSONSource).setData(geoJsonData);
          }
        }
        
        // Clear the drawn geometry from Mapbox Draw
        if (drawRef.current) {
          const features = drawRef.current.getAll();
          if (features.features.length > 0) {
            const featureId = features.features[0].id as string;
            drawRef.current.delete(featureId);
          }
          drawRef.current.changeMode('simple_select');
        }
        
        setEditingAreaShape(null);
        setHasDrawnPolygon(false);
        setIsActivelyDrawing(false);
      } catch (error) {
        console.error('Error updating area shape:', error);
      }
      return;
    }
    
    // Otherwise, open the save modal for a new area
    setDrawnGeometry(geometry);
    setShowAreaSaveModal(true);
  }, [isAnonymous, editingAreaShape, map, mapLoaded]);

  // Handle cancel drawing
  const handleCancelDrawing = useCallback(() => {
    if (!drawRef.current) return;

    // If we're editing an area shape, just exit edit mode
    if (editingAreaShape) {
      const allFeatures = drawRef.current.getAll();
      if (allFeatures.features.length > 0) {
        allFeatures.features.forEach((feature) => {
          if (feature.id) {
            drawRef.current?.delete(feature.id as string);
          }
        });
      }
      drawRef.current.changeMode('simple_select');
      setEditingAreaShape(null);
      setHasDrawnPolygon(false);
      setIsActivelyDrawing(false);
      return;
    }

    // Otherwise, handle normal drawing cancellation
    const allFeatures = drawRef.current.getAll();
    if (allFeatures.features.length > 0) {
      allFeatures.features.forEach((feature) => {
        if (feature.id) {
          drawRef.current?.delete(feature.id as string);
        }
      });
    }
    drawRef.current.changeMode('simple_select');
    setHasDrawnPolygon(false);
    setIsActivelyDrawing(false);
    setActiveMenuAction(null);
  }, [editingAreaShape]);

  // Update cursor style when create mode is active
  useEffect(() => {
    if (!map) return;
    
    if (activeMenuAction === 'create' && mapInfo.zoom >= 12) {
      map.getCanvas().style.cursor = 'crosshair';
    } else if (activeMenuAction !== 'draw') {
      // Only reset if not in draw mode (draw mode handles its own cursor)
      map.getCanvas().style.cursor = '';
    }
  }, [map, activeMenuAction, mapInfo.zoom]);

  // Handle Enter key to complete polygon drawing
  const handleCompleteDrawing = useCallback(() => {
    if (!drawRef.current || !isActivelyDrawing) return;

    const mode = drawRef.current.getMode();
    if (mode === 'draw_polygon') {
      // Complete the polygon by switching to simple_select mode
      // This will trigger the draw.create event if a polygon was completed
      drawRef.current.changeMode('simple_select');
      setIsActivelyDrawing(false);
    }
  }, [isActivelyDrawing]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key completes polygon drawing
      if (e.key === 'Enter' && activeMenuAction === 'draw' && isActivelyDrawing) {
        const target = e.target as HTMLElement;
        // Only trigger if not typing in an input or textarea
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          handleCompleteDrawing();
        }
        return;
      }

      // Escape key closes active menu action
      if (e.key === 'Escape' && activeMenuAction) {
        setActiveMenuAction(null);
        setPinModalCoordinates(null);
        setPinModalAddress('');
        setIsActivelyDrawing(false);
      }
      
      // Forward slash focuses search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Only trigger if not typing in an input
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setActiveMenuAction('search');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenuAction, isActivelyDrawing, handleCompleteDrawing]);

  // Initialize pins hook
  const pins = usePins({
    mapLoaded,
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPopup,
    onPinEdit: (pin) => setEditingPin(pin),
    onPinDelete: (pin) => setDeletingPin(pin),
    currentZoom: mapInfo.zoom,
  });

  // Location tracking - use native Mapbox GeolocateControl
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  // Handle location toggle - trigger native GeolocateControl
  const handleLocationToggle = useCallback((enabled: boolean) => {
    setIsLocationTracking(enabled);
    if (enabled && mapLoaded) {
      // Trigger the native GeolocateControl which will show the blue user location pin
      triggerGeolocate();
    }
  }, [mapLoaded, triggerGeolocate]);

  // Handle pin actions from popup buttons (only for authenticated users)
  useEffect(() => {
    const handlePinAction = (e: Event) => {
      // Anonymous users cannot edit or delete pins
      if (isAnonymous) return;

      const customEvent = e as CustomEvent<{ pinId: string; action: string }>;
      const { pinId, action } = customEvent.detail;
      
      // Find the pin
      const pin = pins.pins.find(p => p.id === pinId);
      if (!pin) return;

      if (action === 'edit') {
        setEditingPin(pin);
      } else if (action === 'delete') {
        setDeletingPin(pin);
      }
    };

    document.addEventListener('pinAction', handlePinAction);
    return () => {
      document.removeEventListener('pinAction', handlePinAction);
    };
  }, [pins.pins, isAnonymous]);

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

  // Handle search completion - drop pin and show modal (only for authenticated users)
  const handleSearchComplete = useCallback((address: Address, coordinates?: { lat: number; lng: number }) => {
    if (coordinates && !isAnonymous) {
      setPinModalCoordinates(coordinates);
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
      setPinModalAddress(fullAddress);
      // Switch to create action to show the pin form
      setActiveMenuAction('create');
    } else if (coordinates) {
      // For anonymous users, just fly to the location
      handleFlyTo(coordinates);
    }
  }, [isAnonymous, handleFlyTo]);

  // Handle saving pin
  const handleSavePin = useCallback(async (data: {
    emoji: string;
    name: string;
    visibility: 'public' | 'private';
    description: string;
    address: string;
    lat: number;
    long: number;
    category_id?: string | null;
  }) => {
    await pins.createPin(data);
    setPinModalCoordinates(null);
    setPinModalAddress('');
    // Auto-close create mode after successful pin creation
    setActiveMenuAction(null);
  }, [pins]);

  // Handle updating pin
  const handleUpdatePin = useCallback(async (pinId: string, data: {
    emoji?: string;
    name?: string;
    visibility?: 'public' | 'private';
    description?: string | null;
  }) => {
    await pins.updatePin(pinId, data);
    setEditingPin(null);
  }, [pins]);

  // Handle deleting pin
  const handleDeletePin = useCallback(async (pinId: string) => {
    await pins.deletePin(pinId);
    setDeletingPin(null);
  }, [pins]);


  // Show loading state while checking auth
  if (authLoading) {
    return (
      <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
        <div className="h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
      <div className="h-[calc(100vh-3rem)] w-full overflow-hidden relative" style={{ margin: 0, padding: 0 }}>
        {/* Map Container */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%', margin: 0, padding: 0, position: 'relative' }}
        />
        
        {/* Community Chat Widget - only show for authenticated users */}
        {!isAnonymous && <CommunityChatWidget />}
        
        {/* Map Chat Widget - broadcast room for map page */}
        {!isAnonymous && <MapChatWidget />}

        {/* Global Floating Menu */}
        <GlobalFloatingMenu
          activeAction={activeMenuAction}
          onMenuAction={(action) => {
            // Anonymous users can only use search, not create or draw
            if (isAnonymous && (action === 'create' || action === 'draw')) {
              return;
            }
            setActiveMenuAction(action);
            // Clear pin form if menu action changes
            if (action !== 'create') {
              setPinModalCoordinates(null);
              setPinModalAddress('');
            }
            // Exit draw mode if switching away
            if (action !== 'draw' && drawRef.current) {
              drawRef.current.changeMode('simple_select');
            }
          }}
          currentZoom={mapInfo.zoom}
          minZoomForCreate={12}
          onRefresh={() => pins.refreshPins()}
          isRefreshing={pins.isLoading}
          onLocationToggle={handleLocationToggle}
          isLocationTracking={isLocationTracking}
          allowCreate={!isAnonymous}
          onMapStyleToggle={handleMapStyleToggle}
          currentMapStyle={currentMapStyle}
        >
          {activeMenuAction === 'create' && !isAnonymous && (
            <PinCreationForm
              coordinates={pinModalCoordinates}
              address={pinModalAddress}
              isLoadingAddress={isLoadingAddress}
              onSave={async (data) => {
                await handleSavePin(data);
                setPinModalCoordinates(null);
                setPinModalAddress('');
                setActiveMenuAction(null);
              }}
              onCancel={() => {
                setPinModalCoordinates(null);
                setPinModalAddress('');
                setActiveMenuAction(null);
              }}
              currentZoom={mapInfo.zoom}
              minZoom={12}
              addMarker={addMarker}
              removeMarker={removeMarker}
            />
          )}
          {activeMenuAction === 'search' && (
            <SearchContent
              onSearchComplete={handleSearchComplete}
              onFlyTo={handleFlyTo}
            />
          )}
          {activeMenuAction === 'list' && (
            <div className="pointer-events-auto bg-transparent backdrop-blur-[5px] rounded-2xl p-4 max-w-xs" style={{ backdropFilter: 'blur(5px)' }}>
              <p className="text-sm font-medium text-white text-center">List functionality coming soon</p>
            </div>
          )}
        </GlobalFloatingMenu>

        {/* Pin Edit Modal - only show for authenticated users */}
        {editingPin && !isAnonymous && (
          <PinEditModal
            isOpen={!!editingPin}
            pin={editingPin}
            onClose={() => setEditingPin(null)}
            onSave={handleUpdatePin}
          />
        )}

        {/* Pin Delete Modal - only show for authenticated users */}
        {deletingPin && !isAnonymous && (
          <PinDeleteModal
            isOpen={!!deletingPin}
            pin={deletingPin}
            onClose={() => setDeletingPin(null)}
            onDelete={handleDeletePin}
          />
        )}

        {/* Login Prompt Modal - shown when anonymous users try to create pins */}
        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />

        {/* Floating instruction text while actively drawing */}
        {activeMenuAction === 'draw' && isActivelyDrawing && !isAnonymous && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
            <div className="bg-transparent backdrop-blur-[5px] rounded-2xl px-4 py-2" style={{ backdropFilter: 'blur(5px)' }}>
              <p className="text-white text-sm font-medium text-center drop-shadow-lg">
                Press <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono">Enter</kbd> to complete
              </p>
            </div>
          </div>
        )}

        {/* Floating Save/Cancel Buttons for Drawing or Editing Shape */}
        {((activeMenuAction === 'draw' && hasDrawnPolygon && !isActivelyDrawing) || editingAreaShape) && !isAnonymous && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
            <div className="flex items-center gap-3 bg-transparent backdrop-blur-[5px] rounded-2xl p-2" style={{ backdropFilter: 'blur(5px)' }}>
              <button
                onClick={handleCancelDrawing}
                className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-xl transition-all flex items-center gap-2 font-medium text-sm shadow-lg"
              >
                <XMarkIcon className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSaveArea}
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-xl transition-all flex items-center gap-2 font-medium text-sm shadow-lg"
              >
                <CheckIcon className="w-5 h-5" />
                {editingAreaShape ? 'Save Changes' : 'Save Area'}
              </button>
            </div>
          </div>
        )}

        {/* Area Save Modal */}
        <AreaSaveModal
          isOpen={showAreaSaveModal}
          geometry={drawnGeometry}
          onClose={() => {
            setShowAreaSaveModal(false);
            setDrawnGeometry(null);
            // Keep the polygon drawn so user can try again or cancel via the floating button
            // Don't delete it here - let the cancel button handle that
          }}
          onSave={async () => {
            // Reload areas after saving
            if (map && mapLoaded) {
              try {
                const savedAreas = await AreaService.getAllAreas();
                setAreas(savedAreas);

                if (savedAreas.length > 0) {
                  const features = savedAreas.map(area => ({
                    type: 'Feature' as const,
                    id: area.id,
                    properties: {
                      name: area.name,
                      description: area.description,
                      visibility: area.visibility,
                      category: area.category || 'custom',
                    },
                    geometry: area.geometry,
                  }));

                  const geoJsonData = {
                    type: 'FeatureCollection' as const,
                    features,
                  };

                  if (map.getSource('saved-areas')) {
                    (map.getSource('saved-areas') as import('mapbox-gl').GeoJSONSource).setData(geoJsonData);
                  }
                }
                // Reload areas state
                const updatedAreas = await AreaService.getAllAreas();
                setAreas(updatedAreas);
              } catch (err) {
                console.error('Error reloading areas:', err);
              }
            }
            // Clear the drawn geometry from Mapbox Draw
            if (drawRef.current) {
              const allFeatures = drawRef.current.getAll();
              if (allFeatures.features.length > 0) {
                const lastFeatureId = allFeatures.features[allFeatures.features.length - 1].id as string;
                drawRef.current.delete(lastFeatureId);
              }
              drawRef.current.changeMode('simple_select');
            }
            setHasDrawnPolygon(false);
            setActiveMenuAction(null);
          }}
        />

          {/* Area Edit Modal */}
          {editingArea && !isAnonymous && (
            <AreaEditModal
              isOpen={!!editingArea}
              area={editingArea}
              onClose={() => setEditingArea(null)}
              onEditShape={handleEditAreaShape}
              onSave={async (areaId, data) => {
              await AreaService.updateArea(areaId, data);
              // Reload areas after update
              const updatedAreas = await AreaService.getAllAreas();
              setAreas(updatedAreas);
              
              // Update map source
              if (map && mapLoaded) {
                const features = updatedAreas.map(area => ({
                  type: 'Feature' as const,
                  id: area.id,
                  properties: {
                    name: area.name,
                    description: area.description,
                    visibility: area.visibility,
                    category: area.category || 'custom',
                  },
                  geometry: area.geometry,
                }));

                const geoJsonData = {
                  type: 'FeatureCollection' as const,
                  features,
                };

                if (map.getSource('saved-areas')) {
                  (map.getSource('saved-areas') as import('mapbox-gl').GeoJSONSource).setData(geoJsonData);
                }
              }
            }}
          />
        )}

        {/* Loading Address Indicator */}
        {isLoadingAddress && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gold-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">Loading address...</span>
            </div>
          </div>
        )}

        {/* Loading Pins Indicator */}
        {pins.isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gold-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">Loading pins...</span>
            </div>
          </div>
        )}

        {/* Pin Count Display */}
        {!pins.isLoading && pins.pins.length > 0 && (
          <div className="absolute top-4 right-4 z-[60]">
            <PinCountDisplay 
              totalPins={pins.pins.length}
              visiblePins={pins.visiblePins.length}
              currentZoom={mapInfo.zoom}
            />
          </div>
        )}

        {/* Debug Panel */}
        <div className="fixed bottom-4 left-4 z-[100] bg-black/90 text-white text-xs font-mono p-3 rounded-lg shadow-lg max-w-md max-h-96 overflow-y-auto">
          <div className="font-bold text-yellow-400 mb-2">🐛 Debug Info</div>
          
          <div className="space-y-1 mb-2">
            <div className="text-gray-300">Cursor Position:</div>
            <div className="text-green-400 ml-2">
              Lat: {debugInfo.cursor.lat.toFixed(6)}, Lng: {debugInfo.cursor.lng.toFixed(6)}
            </div>
          </div>

          <div className="space-y-1 mb-2">
            <div className="text-gray-300">Hovered Area ID:</div>
            <div className={`ml-2 ${debugInfo.hoveredAreaId ? 'text-yellow-400' : 'text-gray-500'}`}>
              {debugInfo.hoveredAreaId || 'None'}
            </div>
          </div>

          <div className="space-y-1 mb-2">
            <div className="text-gray-300">Features Under Cursor:</div>
            {debugInfo.features.length > 0 ? (
              <div className="ml-2 space-y-1">
                {debugInfo.features.map((f, idx) => (
                  <div key={idx} className="text-blue-400">
                    <div>Layer: {f.layer}</div>
                    <div>ID: {f.id || 'undefined'}</div>
                    {f.properties.name && (
                      <div>Name: {String(f.properties.name)}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 ml-2">None</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-gray-300">Map Info:</div>
            <div className="text-purple-400 ml-2">
              Zoom: {mapInfo.zoom.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Area Sidebar */}
        <AreaSidebar
          area={selectedArea}
          isOpen={isAreaSidebarOpen}
          onClose={() => {
            setIsAreaSidebarOpen(false);
            setSelectedArea(null);
          }}
          onEditDetails={(area) => {
            setEditingArea(area);
          }}
          onEditShape={handleEditAreaShape}
          onDelete={async (area) => {
            try {
              await AreaService.deleteArea(area.id);
              // Reload areas after deletion
              const updatedAreas = await AreaService.getAllAreas();
              setAreas(updatedAreas);
              
              // Update map source
              if (map && mapLoaded) {
                const features = updatedAreas.map(a => ({
                  type: 'Feature' as const,
                  id: a.id,
                  properties: {
                    name: a.name,
                    description: a.description,
                    visibility: a.visibility,
                    category: a.category || 'custom',
                  },
                  geometry: a.geometry,
                }));

                const geoJsonData = {
                  type: 'FeatureCollection' as const,
                  features,
                };

                if (map.getSource('saved-areas')) {
                  (map.getSource('saved-areas') as import('mapbox-gl').GeoJSONSource).setData(geoJsonData);
                }
              }
              
              // Close sidebar
              setIsAreaSidebarOpen(false);
              setSelectedArea(null);
            } catch (error) {
              console.error('Error deleting area:', error);
              alert('Failed to delete area. Please try again.');
            }
          }}
        />

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
    </PageLayout>
  );
}
