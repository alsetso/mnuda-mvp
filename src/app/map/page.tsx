'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import { useMap } from '@/features/map/hooks/useMap';
import { Address } from '@/features/map/types';
import { MAP_CONFIG } from '@/features/map/config';
import { PinEditModal } from '@/features/pins/components/PinEditModal';
import { PinDeleteModal } from '@/features/pins/components/PinDeleteModal';
import { MapDeleteModal, type DeleteRecord } from '@/components/MapDeleteModal';
import { usePins } from '@/features/pins/hooks/usePins';
import { ReverseGeocodingService } from '@/features/map/services/reverseGeocodingService';
import { useToast } from '@/features/ui/hooks/useToast';
import { Pin } from '@/features/pins/services/pinService';
import { GlobalFloatingMenu } from '@/components/GlobalFloatingMenu';
import { SearchContent } from '@/components/SearchContent';
import { PinCreationForm } from '@/components/PinCreationForm';
import { LoginPromptModal } from '@/components/LoginPromptModal';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { AreaService, Area, UpdateAreaData } from '@/features/areas/services/areaService';
import { AreaSaveModal } from '@/features/areas/components/AreaSaveModal';
import { AreaEditModal } from '@/features/areas/components/AreaEditModal';
import { AreaSidebar } from '@/features/areas/components/AreaSidebar';
import { AreaPopup } from '@/features/areas/components/AreaPopup';
import { MapFilters, DrawCoordinatesDisplay } from '@/features/map';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CommunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProfile } = useProfile();
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Get profile_type from selected profile for experience customization
  const profileAccountType = selectedProfile?.profile_type || null;
  const [pinModalCoordinates, setPinModalCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [pinModalAddress, setPinModalAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [deletingPin, setDeletingPin] = useState<Pin | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DeleteRecord | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { error: showError, success } = useToast();

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
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<[number, number]>>([]);
  const [drawMode, setDrawMode] = useState<'draw' | 'pan'>('draw');
  const [areaPopup, setAreaPopup] = useState<{ area: Area; position: { x: number; y: number } } | null>(null);
  
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

  // Temporary map click handler for onboarding drop pin mode
  const onboardingMapClickHandlerRef = useRef<((coordinates: { lat: number; lng: number }) => void) | null>(null);

  // Handle map click - defined before useMap
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }, mapInstance?: import('mapbox-gl').Map | null) => {
    // Check for onboarding drop pin handler first
    if (onboardingMapClickHandlerRef.current) {
      onboardingMapClickHandlerRef.current(coordinates);
      return;
    }

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
    stopGeolocate,
    changeMapStyle,
  } = useMap({
    mapContainer,
    onMapClick: handleMapClick,
  });

  // Map style state - track current style
  const [currentMapStyle, setCurrentMapStyle] = useState<'dark' | 'satellite'>('dark');


  // Helper function to add areas layers
  const addMapLayers = useCallback(async (mapInstance: import('mapbox-gl').Map) => {
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

  // Initialize Mapbox Draw on map load
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
        setPolygonCoordinates([]);
      }
    };

    const handleDrawModeChange = () => {
      // Check polygon state when mode changes
      if (drawRef.current) {
        const mode = drawRef.current.getMode();
        const allFeatures = drawRef.current.getAll();
        const hasFeatures = allFeatures.features.length > 0;
        
        if (mode === 'draw_polygon') {
          // Don't reset if we already have a polygon - allow continuing to add points
          if (!hasFeatures) {
            // Only reset when starting a completely new polygon
            setHasDrawnPolygon(false);
            setPolygonCoordinates([]);
          }
          setIsActivelyDrawing(true);
        } else if (mode === 'direct_select') {
          // In direct_select mode, we're editing vertices
          setHasDrawnPolygon(hasFeatures);
          setIsActivelyDrawing(false);
        } else {
          // simple_select or other modes
          setHasDrawnPolygon(hasFeatures);
          setIsActivelyDrawing(false);
          // Keep coordinates if polygon exists, otherwise clear
          if (!hasFeatures) {
            setPolygonCoordinates([]);
          }
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
        
        // Update coordinates when vertex is added
        if (allFeatures.features.length > 0) {
          const feature = allFeatures.features[0];
          if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
            const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
            // Filter out any null/undefined coordinates
            const validCoords = coords.filter(
              (coord): coord is [number, number] => 
                Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
            );
            setPolygonCoordinates(validCoords);
          }
        }
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
        
        // Extract coordinates from current polygon being drawn
        if (mode === 'draw_polygon' && allFeatures.features.length > 0) {
          const feature = allFeatures.features[0];
          if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
            // Get coordinates from the first ring (exterior ring)
            const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
            // Filter out any null/undefined coordinates
            const validCoords = coords.filter(
              (coord): coord is [number, number] => 
                Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
            );
            setPolygonCoordinates(validCoords);
          } else {
            setPolygonCoordinates([]);
          }
        } else if (mode === 'simple_select' && allFeatures.features.length > 0) {
          // Show coordinates of selected polygon
          const feature = allFeatures.features[0];
          if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
            const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
            // Filter out any null/undefined coordinates
            const validCoords = coords.filter(
              (coord): coord is [number, number] => 
                Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
            );
            setPolygonCoordinates(validCoords);
          } else {
            setPolygonCoordinates([]);
          }
        } else {
          setPolygonCoordinates([]);
        }
      }
    };

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.modechange', handleDrawModeChange);
    map.on('draw.vertexadded', handleDrawVertexAdded);
    map.on('draw.render', handleDrawRender);

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

      // Show popup at click position with edit option
      setAreaPopup({
        area,
        position: { x: e.point.x, y: e.point.y }
      });
      
      // Also open sidebar (keep existing behavior)
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
      // Only query layers that exist to avoid errors
      const areaLayers = ['saved-areas-fill', 'saved-areas-labels'].filter(
        layerId => map.getLayer(layerId) !== undefined
      );
      
      const features = areaLayers.length > 0
        ? map.queryRenderedFeatures(e.point, { layers: areaLayers })
        : [];

      // If clicking on an area, don't close (let handleAreaClick handle it)
      if (features && features.length > 0) {
        console.log('[MapClickForSidebar] Click was on area, ignoring');
        return;
      }

      // Otherwise, close sidebar and popup
      console.log('[MapClickForSidebar] Closing sidebar - empty map click');
      setSelectedArea(null);
      setIsAreaSidebarOpen(false);
      setAreaPopup(null);
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
      // Only query layers that exist to avoid errors
      const areaLayers = ['saved-areas-fill', 'saved-areas-labels', 'saved-areas-outline'].filter(
        layerId => map.getLayer(layerId) !== undefined
      );
      
      const features = areaLayers.length > 0 
        ? map.queryRenderedFeatures(e.point, { layers: areaLayers })
        : [];
      
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

    // Intercept clicks in pan mode to prevent point placement
    // We'll use a wrapper that checks the mode before allowing draw to handle clicks
    let clickInterceptor: ((e: import('mapbox-gl').MapMouseEvent) => void) | null = null;
    let domClickHandler: ((e: MouseEvent) => void) | null = null;

    // Cursor handlers for pan mode
    const handleMouseDown = () => {
      if (activeMenuAction === 'draw' && drawMode === 'pan') {
        map.getCanvas().style.cursor = 'grabbing';
      }
    };
    const handleMouseUp = () => {
      if (activeMenuAction === 'draw' && drawMode === 'pan') {
        map.getCanvas().style.cursor = 'grab';
      }
    };

    if (activeMenuAction === 'draw') {
      // Always keep draw_polygon mode to preserve the polygon
      // But intercept clicks when in pan mode
      if (drawMode === 'draw') {
        // Check if there's an existing polygon
        const allFeatures = drawRef.current.getAll();
        const hasPolygon = allFeatures.features.length > 0;
        const currentMode = drawRef.current.getMode();
        
        // If we have a polygon and we're switching from pan mode, continue drawing
        // Don't change mode if we're already in draw_polygon - this prevents completion
        if (currentMode !== 'draw_polygon') {
          if (hasPolygon && currentMode === 'simple_select') {
            // Polygon was completed, switch back to draw_polygon to continue adding points
            drawRef.current.changeMode('draw_polygon');
          } else if (!hasPolygon) {
            // No polygon, start fresh
            drawRef.current.changeMode('draw_polygon');
          }
        }
        
        map.getCanvas().style.cursor = 'crosshair';
        setIsActivelyDrawing(true);
        
        // Remove click interceptor in draw mode
        if (clickInterceptor) {
          map.off('click', clickInterceptor);
          clickInterceptor = null;
        }
        // Remove DOM click handler if it exists
        if (domClickHandler) {
          const mapContainer = map.getContainer();
          mapContainer.removeEventListener('click', domClickHandler, true);
          domClickHandler = null;
        }
      } else {
        // Pan mode - keep draw_polygon mode but temporarily disable draw control
        // This preserves the polygon while allowing panning
        if (drawRef.current.getMode() !== 'draw_polygon') {
          drawRef.current.changeMode('draw_polygon');
        }
        map.getCanvas().style.cursor = 'grab';
        setIsActivelyDrawing(false);
        
        // Intercept clicks at the DOM level before Mapbox Draw handles them
        // We need to prevent clicks from adding points while keeping the polygon visible
        clickInterceptor = (e: import('mapbox-gl').MapMouseEvent) => {
          // Stop the event from reaching Mapbox Draw's click handler
          // This allows panning while preserving the polygon
          if (e.originalEvent) {
            e.originalEvent.stopImmediatePropagation();
            e.originalEvent.preventDefault();
          }
        };
        // Use capture phase to intercept before Mapbox Draw
        // We'll attach to the map container's DOM element
        const mapContainer = map.getContainer();
        domClickHandler = (e: MouseEvent) => {
          if (activeMenuAction === 'draw' && drawMode === 'pan') {
            e.stopImmediatePropagation();
          }
        };
        mapContainer.addEventListener('click', domClickHandler, true); // true = capture phase
        
        // Also add to map events as backup
        map.on('click', clickInterceptor);
        
        // Add cursor feedback for pan mode
        map.on('mousedown', handleMouseDown);
        map.on('mouseup', handleMouseUp);
      }
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
      if (clickInterceptor) {
        map.off('click', clickInterceptor);
        clickInterceptor = null;
      }
    }

    // Cleanup
    return () => {
      if (clickInterceptor) {
        map.off('click', clickInterceptor);
      }
      map.off('mousedown', handleMouseDown);
      map.off('mouseup', handleMouseUp);
      // Clean up DOM event listener
      if (domClickHandler) {
        const mapContainer = map.getContainer();
        mapContainer.removeEventListener('click', domClickHandler, true);
        domClickHandler = null;
      }
    };
  }, [map, activeMenuAction, drawMode]);

  // Handle deleting area
  const handleDeleteArea = useCallback(async (areaId: string) => {
    try {
      await AreaService.deleteArea(areaId);
      
      // Reload areas after deletion
      const updatedAreas = await AreaService.getAllAreas();
      setAreas(updatedAreas);
      
      // Update map source
      if (map && mapLoaded) {
        if (updatedAreas.length > 0) {
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
        } else {
          // Remove source if no areas left
          if (map.getSource('saved-areas')) {
            if (map.getLayer('saved-areas-labels')) map.removeLayer('saved-areas-labels');
            if (map.getLayer('saved-areas-fill')) map.removeLayer('saved-areas-fill');
            if (map.getLayer('saved-areas-outline')) map.removeLayer('saved-areas-outline');
            map.removeSource('saved-areas');
          }
        }
      }
      
      // Clear selection if deleted area was selected
      if (selectedArea?.id === areaId) {
        setSelectedArea(null);
        setIsAreaSidebarOpen(false);
      }
      
      // Remove from Mapbox Draw if it's being edited
      if (drawRef.current && editingAreaShape?.id === areaId) {
        const allFeatures = drawRef.current.getAll();
        allFeatures.features.forEach((feature) => {
          if (feature.id === areaId) {
            drawRef.current?.delete(areaId);
          }
        });
        setEditingAreaShape(null);
      }
      
      success('Area Deleted', 'The area has been deleted successfully');
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to delete area');
      throw err;
    }
  }, [map, mapLoaded, selectedArea, editingAreaShape, success, showError]);

  // Handle delete record (dynamic - works for pins, areas, etc.)
  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (!deletingRecord) return;
    
    if (deletingRecord.type === 'area') {
      await handleDeleteArea(recordId);
    }
    
    setDeletingRecord(null);
  }, [deletingRecord, handleDeleteArea]);

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
    
    // Extract coordinates from area geometry
    let coords: Array<[number, number]> = [];
    if (area.geometry.type === 'Polygon' && area.geometry.coordinates[0]) {
      coords = area.geometry.coordinates[0] as Array<[number, number]>;
      // Filter out any invalid coordinates
      coords = coords.filter(
        (coord): coord is [number, number] => 
          Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
      );
    }
    
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
    
    // Set coordinates state for display
    setPolygonCoordinates(coords);
    
    // Set state to track we're editing
    setEditingAreaShape(area);
    setHasDrawnPolygon(true);
    setIsActivelyDrawing(false);
    
    // Switch to draw mode to show the drawing interface
    setActiveMenuAction('draw');
    setDrawMode('draw');
    
    // Switch to direct_select mode to allow editing vertices
    drawRef.current.changeMode('direct_select', { featureId: area.id });
    
    // Zoom to the area
    if (area.geometry.type === 'Polygon' && area.geometry.coordinates[0]) {
      const polygonCoords = area.geometry.coordinates[0];
      const lngs = polygonCoords.map((c: number[]) => c[0]);
      const lats = polygonCoords.map((c: number[]) => c[1]);
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
    // Exit draw mode when opening save modal
    if (drawRef.current) {
      drawRef.current.changeMode('simple_select');
    }
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
      setPolygonCoordinates([]);
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
    setPolygonCoordinates([]);
    setDrawMode('draw'); // Reset to draw mode for next time
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

  // Track selected category IDs for server-side filtering
  // null = not initialized yet (fetch all), [] = no categories selected (fetch none), [ids] = fetch specific categories
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[] | null>(null);

  // Initialize pins hook with category filtering
  const pins = usePins({
    mapLoaded,
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPopup,
    onPinEdit: (pin) => setEditingPin(pin),
    onPinDelete: (pin) => setDeletingPin(pin),
    currentZoom: mapInfo.zoom,
    categoryIds: selectedCategoryIds === null ? undefined : selectedCategoryIds,
  });

  // Track filtered pin IDs for ownership filtering (client-side)
  const filteredPinIdsRef = useRef<Set<string>>(new Set());

  // Handle category IDs change from MapFilters (triggers server-side refetch)
  const handleCategoryIdsChange = useCallback((categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
  }, []);

  // Handle filtered pins change from MapFilters (ownership filtering only)
  const handleFilteredPinsChange = useCallback((filtered: Pin[]) => {
    if (!map || !mapLoaded) return;

    // Update the set of filtered pin IDs (for ownership filtering)
    const newFilteredIds = new Set(filtered.map(p => p.id));
    filteredPinIdsRef.current = newFilteredIds;

    // Get all current pin IDs from the pins hook
    const allPinIds = pins.pins.map(p => p.id);

    // Hide markers that are not in filtered list
    allPinIds.forEach(pinId => {
      const markerId = `pin-${pinId}`;
      if (!newFilteredIds.has(pinId)) {
        removeMarker(markerId);
      }
    });
  }, [map, mapLoaded, pins.pins, removeMarker]);

  // Re-apply ownership filters when pins change
  useEffect(() => {
    if (!map || !mapLoaded || filteredPinIdsRef.current.size === 0) return;
    
    const allPinIds = pins.pins.map(p => p.id);
    allPinIds.forEach(pinId => {
      const markerId = `pin-${pinId}`;
      if (!filteredPinIdsRef.current.has(pinId)) {
        removeMarker(markerId);
      }
    });
  }, [pins.pins, map, mapLoaded, removeMarker]);


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
    subcategory?: string | null;
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

  // Redirect to setup map if not onboarded
  useEffect(() => {
    if (selectedProfile && !selectedProfile.onboarded) {
      router.replace(`/map/setup/${selectedProfile.profile_type}`);
    }
  }, [selectedProfile, router]);

  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="full" contentPadding="" backgroundColor="bg-gold-100">
      <div className="h-[calc(100vh-3rem)] w-full overflow-hidden relative" style={{ margin: 0, padding: 0 }}>
        {/* Map Container */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%', margin: 0, padding: 0, position: 'relative' }}
        />

        {/* Global Floating Menu - Only show if onboarded */}
        {selectedProfile?.onboarded && (
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
          allowCreate={!isAnonymous}
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
            <MapFilters
              map={map}
              pins={pins.pins}
              onFilteredPinsChange={handleFilteredPinsChange}
              onCategoryIdsChange={handleCategoryIdsChange}
              currentMapStyle={currentMapStyle}
              onMapStyleToggle={handleMapStyleToggle}
            />
          )}
          {activeMenuAction === 'draw' && (
            <DrawCoordinatesDisplay
              coordinates={polygonCoordinates}
              isDrawing={isActivelyDrawing}
              drawMode={drawMode}
              onDrawModeChange={setDrawMode}
              onEditVertices={() => {
                if (drawRef.current) {
                  const allFeatures = drawRef.current.getAll();
                  if (allFeatures.features.length > 0 && allFeatures.features[0].id) {
                    const featureId = allFeatures.features[0].id as string;
                    drawRef.current.changeMode('direct_select', { featureId });
                    setIsActivelyDrawing(false);
                  }
                }
              }}
              canEditVertices={hasDrawnPolygon && !isActivelyDrawing && polygonCoordinates.length > 0}
              areaName={editingAreaShape?.name || null}
              areas={areas}
              onAreaSelect={handleEditAreaShape}
              onAreaDelete={(area) => {
                // Open delete modal with area data
                setDeletingRecord({
                  id: area.id,
                  type: 'area',
                  name: area.name,
                  description: area.description || undefined,
                  details: {
                    category: area.category,
                    visibility: area.visibility,
                  },
                });
              }}
            />
          )}
        </GlobalFloatingMenu>
        )}

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

        {/* Dynamic Delete Modal - Works for areas and other records */}
        {deletingRecord && !isAnonymous && (
          <MapDeleteModal
            isOpen={!!deletingRecord}
            record={deletingRecord}
            onClose={() => setDeletingRecord(null)}
            onDelete={handleDeleteRecord}
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
            // Exit draw mode when closing
            if (drawRef.current) {
              drawRef.current.changeMode('simple_select');
            }
            setActiveMenuAction(null);
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
            setPolygonCoordinates([]);
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


        {/* Debug Panel - Left */}
        <div className="fixed bottom-4 left-4 z-[100] text-white text-xs font-mono pointer-events-none">
          <div className="text-[8px] text-gold-500 drop-shadow-lg mb-1">
            {debugInfo.cursor.lat.toFixed(6)}, {debugInfo.cursor.lng.toFixed(6)}
          </div>
          {debugInfo.features.length > 0 ? (
            <div className="space-y-1">
              {debugInfo.features.map((f, idx) => (
                <div key={idx} className="text-white drop-shadow-lg">
                  <div>Layer: {f.layer}</div>
                  <div>ID: {f.id || 'undefined'}</div>
                  {f.properties.name && (
                    <div>Name: {String(f.properties.name)}</div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Debug Panel - Right */}
        <div className="fixed bottom-4 right-4 z-[100] text-white text-xs font-mono pointer-events-none">
          <div className="text-[8px] text-gold-500 drop-shadow-lg mb-1">
            {mapInfo.center.lat.toFixed(6)}, {mapInfo.center.lng.toFixed(6)}
          </div>
          <div className="text-white drop-shadow-lg space-y-0.5">
            <div>Zoom: {mapInfo.zoom.toFixed(2)}</div>
            {Math.abs(mapInfo.bearing) > 0.1 && (
              <div>Bearing: {mapInfo.bearing.toFixed(1)}°</div>
            )}
            {Math.abs(mapInfo.pitch) > 0.1 && (
              <div>Pitch: {mapInfo.pitch.toFixed(1)}°</div>
            )}
            <div>Style: {currentMapStyle}</div>
          </div>
        </div>

        {/* Area Popup - shows on area click with edit option */}
        {areaPopup && user && selectedProfile && areaPopup.area.profile_id === selectedProfile.id && (
          <AreaPopup
            area={areaPopup.area}
            position={areaPopup.position}
            onClose={() => setAreaPopup(null)}
            onEditShape={(area) => {
              handleEditAreaShape(area);
              setAreaPopup(null);
            }}
            isOwner={selectedProfile.id === areaPopup.area.profile_id}
          />
        )}

        {/* Area Sidebar */}
        <AreaSidebar
          area={selectedArea}
          isOpen={isAreaSidebarOpen}
          onClose={() => {
            setIsAreaSidebarOpen(false);
            setSelectedArea(null);
            setAreaPopup(null);
          }}
          onEditDetails={(area) => {
            setEditingArea(area);
          }}
          onEditShape={handleEditAreaShape}
          onDelete={(area) => {
            // Open delete modal with area data
            setDeletingRecord({
              id: area.id,
              type: 'area',
              name: area.name,
              description: area.description || undefined,
              details: {
                category: area.category,
                visibility: area.visibility,
              },
            });
            // Close sidebar
            setIsAreaSidebarOpen(false);
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
