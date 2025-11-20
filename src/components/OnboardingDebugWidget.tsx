'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingService, OnboardingQuestion, OnboardingAnswer } from '@/features/onboarding/services/onboardingService';
import { ProfileService } from '@/features/profiles/services/profileService';
import { useProfile } from '@/features/profiles/contexts/ProfileContext';
import { MyHomesService } from '@/features/my-homes/services/myHomesService';
import { ReverseGeocodingService } from '@/features/map/services/reverseGeocodingService';
import { MAP_CONFIG } from '@/features/map/config';
import { XMarkIcon, CheckIcon, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, MapPinIcon, PlusIcon, TrashIcon, HandRaisedIcon, PencilIcon, EyeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { MinnesotaAddressSearch } from '@/features/onboarding/components/MinnesotaAddressSearch';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

interface OnboardingDebugWidgetProps {
  onFlyTo?: (coordinates: { lat: number; lng: number }, zoom?: number) => void;
  onSetMapClickHandler?: (handler: ((coordinates: { lat: number; lng: number }) => void) | null) => void;
  addMarker?: (id: string, coordinates: { lat: number; lng: number }, options?: { element?: HTMLElement; color?: string; popupContent?: string }) => void;
  removeMarker?: (id: string) => void;
  getMapCenter?: () => { lat: number; lng: number } | null;
  map?: import('mapbox-gl').Map | null;
}

export default function OnboardingDebugWidget({ onFlyTo, onSetMapClickHandler, addMarker, removeMarker, getMapCenter, map }: OnboardingDebugWidgetProps) {
  const router = useRouter();
  const { selectedProfile, refreshProfiles } = useProfile();
  const [isOpen, setIsOpen] = useState(true);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [formData, setFormData] = useState<Record<number, any>>({});
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempMarkerIds, setTempMarkerIds] = useState<Set<string>>(new Set());
  const [pendingDropPinIndex, setPendingDropPinIndex] = useState<number | null>(null);
  const [allOnboardingLocations, setAllOnboardingLocations] = useState<Map<number, Array<{ address: string; lat: number; lng: number }>>>(new Map());
  const drawRef = useRef<MapboxDraw | null>(null);
  const drawHandlersRef = useRef<{
    create: () => void;
    update: () => void;
    delete: () => void;
    modechange: () => void;
    render: () => void;
  } | null>(null);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawMode, setDrawMode] = useState<'draw' | 'pan'>('draw');
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<[number, number]>>([]);
  const [hasDrawnPolygon, setHasDrawnPolygon] = useState(false);
  const [savedPolygons, setSavedPolygons] = useState<Array<{id: string; name: string; geometry: any}>>([]);
  const [editingPolygonName, setEditingPolygonName] = useState<string | null>(null);
  const [polygonNameInput, setPolygonNameInput] = useState<string>('');
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const drawModeRef = useRef<'draw' | 'pan'>('draw');

  const loadData = useCallback(async () => {
    if (!selectedProfile) return;

    setLoading(true);
    setError('');
    try {
      const [allQuestions, existingAnswers] = await Promise.all([
        OnboardingService.getAllQuestions(),
        OnboardingService.getAnswersByProfile(selectedProfile.id),
      ]);

      const filtered = OnboardingService.filterQuestions(allQuestions, selectedProfile.profile_type);
      
      // Normalize options field - ensure it's always an object or null
      const normalizedQuestions = filtered.map(q => ({
        ...q,
        options: q.options 
          ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
          : null
      }));
      
      setQuestions(normalizedQuestions);
      setAnswers(existingAnswers);

      // Initialize form data with existing answers
      const initialFormData: Record<number, any> = {};
      existingAnswers.forEach((answer) => {
        initialFormData[answer.question_id] = answer.value;
      });
      setFormData(initialFormData);

      // Load all map_point locations and render their markers
      const allMapPointLocations = new Map<number, Array<{ address: string; lat: number; lng: number }>>();
      normalizedQuestions.forEach((q) => {
        if (q.field_type === 'map_point') {
          const answer = existingAnswers.find((a) => a.question_id === q.id);
          if (answer?.value) {
            const locations = Array.isArray(answer.value) ? answer.value : [answer.value];
            const validLocations = locations
              .filter((loc: any) => loc && typeof loc === 'object' && loc.lat && loc.lng)
              .map((loc: any) => ({
                address: loc.address || '',
                lat: loc.lat,
                lng: loc.lng,
              }));
            if (validLocations.length > 0) {
              allMapPointLocations.set(q.id, validLocations);
            }
          }
        }
      });
      setAllOnboardingLocations(allMapPointLocations);

      // Render markers for all loaded locations
      allMapPointLocations.forEach((locations, questionId) => {
        locations.forEach((location, index) => {
          if (location.lat && location.lng) {
            const markerId = `onboarding-temp-${questionId}-${index}`;
            addMarker?.(markerId, { lat: location.lat, lng: location.lng }, {
              color: '#C2B289',
              popupContent: location.address,
            });
            setTempMarkerIds((prev) => {
              const updated = new Set(prev);
              updated.add(markerId);
              return updated;
            });
          }
        });
      });

      // Find first unanswered question and open it
      const firstUnanswered = normalizedQuestions.find(
        (q) => !existingAnswers.some((a) => a.question_id === q.id)
      );
      setOpenQuestionId(firstUnanswered?.id ?? normalizedQuestions[0]?.id ?? null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedProfile, addMarker]);

  useEffect(() => {
    if (isOpen && selectedProfile) {
      loadData();
    }
  }, [isOpen, selectedProfile, loadData]);

  // Display all saved map_area polygons as gold polygons on the map
  useEffect(() => {
    if (!map || !map.loaded()) return;

    const SOURCE_ID = 'onboarding-saved-areas';
    const LAYER_FILL_ID = 'onboarding-saved-areas-fill';
    const LAYER_STROKE_ID = 'onboarding-saved-areas-stroke';

    // Collect all saved map_area polygons from answers
    const allSavedPolygons: any[] = [];
    questions.forEach((question) => {
      if (question.field_type === 'map_area') {
        const answer = answers.find((a) => a.question_id === question.id);
        if (answer?.value) {
          let polygons: any[] = [];
          if (Array.isArray(answer.value)) {
            polygons = answer.value;
          } else if (answer.value && typeof answer.value === 'object') {
            if (answer.value.type === 'Polygon') {
              polygons = [{ geometry: answer.value }];
            } else if (answer.value.geometry) {
              polygons = [answer.value];
            }
          }

          polygons.forEach((p: any) => {
            const geometry = p.geometry || p;
            if (geometry && geometry.type === 'Polygon') {
              allSavedPolygons.push({
                type: 'Feature',
                geometry: geometry,
                properties: { questionId: question.id, saved: true }
              });
            }
          });
        }
      }
    });

    // Remove existing source and layers if they exist
    if (map.getSource(SOURCE_ID)) {
      if (map.getLayer(LAYER_FILL_ID)) map.removeLayer(LAYER_FILL_ID);
      if (map.getLayer(LAYER_STROKE_ID)) map.removeLayer(LAYER_STROKE_ID);
      map.removeSource(SOURCE_ID);
    }

    // Add source and layers if we have polygons
    if (allSavedPolygons.length > 0) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: allSavedPolygons
        }
      });

      // Add fill layer (gold)
      map.addLayer({
        id: LAYER_FILL_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#C2B289',
          'fill-opacity': 0.3
        }
      });

      // Add stroke layer (gold)
      map.addLayer({
        id: LAYER_STROKE_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#C2B289',
          'line-width': 2
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.getSource(SOURCE_ID)) {
        if (map.getLayer(LAYER_FILL_ID)) map.removeLayer(LAYER_FILL_ID);
        if (map.getLayer(LAYER_STROKE_ID)) map.removeLayer(LAYER_STROKE_ID);
        map.removeSource(SOURCE_ID);
      }
    };
  }, [map, questions, answers]);

  // Touch drag handlers for mobile bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    // Only allow dragging down
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    // Close if dragged down more than 100px
    if (dragY > 100) {
      setIsOpen(false);
    }
    setDragY(0);
    setIsDragging(false);
  };

  // Initialize Mapbox Draw for map_area questions
  useEffect(() => {
    if (!map || !map.loaded()) return;
    
    const currentQuestion = openQuestionId ? questions.find(q => q.id === openQuestionId) : null;
    if (!currentQuestion || currentQuestion.field_type !== 'map_area') {
      // Clean up draw if we're not on a map_area question
      if (drawRef.current) {
        try {
          map.removeControl(drawRef.current);
        } catch (e) {
          // Control might already be removed
        }
        drawRef.current = null;
        setIsDrawingActive(false);
      }
      return;
    }

    const questionId = currentQuestion.id;

    // Initialize Mapbox Draw if not already initialized
    if (!drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: 'simple_select',
        styles: [
          // Saved polygons (gold)
          {
            'id': 'gl-draw-polygon-fill-saved',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'saved', true]],
            'paint': {
              'fill-color': '#C2B289',
              'fill-opacity': 0.3
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-saved',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'saved', true]],
            'paint': {
              'line-color': '#C2B289',
              'line-width': 2
            }
          },
          // Inactive polygons (gold)
          {
            'id': 'gl-draw-polygon-fill-inactive',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'paint': {
              'fill-color': '#C2B289',
              'fill-opacity': 0.3
            }
          },
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#C2B289',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-inactive',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'paint': {
              'line-color': '#C2B289',
              'line-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'line-color': '#C2B289',
              'line-width': 3
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#C2B289'
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

      // Handle draw events - use closure to capture questionId
      const handleDrawCreate = () => {
        // This is handled by Enter key now - polygons are saved to array
        setIsDrawingActive(false);
      };

      const handleDrawUpdate = () => {
        // Update the currently active polygon in the saved polygons array
        if (drawRef.current) {
          const allFeatures = drawRef.current.getAll();
          const activeFeature = allFeatures.features.find((f: any) => f.properties?.isActive);
          if (activeFeature) {
            const polygonId = activeFeature.properties?.id;
            if (polygonId) {
              setSavedPolygons((prev) => 
                prev.map((p) => 
                  p.id === polygonId 
                    ? { ...p, geometry: activeFeature.geometry }
                    : p
                )
              );
            }
          }
        }
      };

      const handleDrawDelete = () => {
        setFormData((prev) => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setIsDrawingActive(false);
        setHasDrawnPolygon(false);
        setPolygonCoordinates([]);
      };

      // Track polygon coordinates in real-time
      const handleDrawRender = () => {
        if (drawRef.current) {
          const allFeatures = drawRef.current.getAll();
          const mode = drawRef.current.getMode();
          
          if (allFeatures.features.length > 0 && mode === 'draw_polygon') {
            const feature = allFeatures.features[0];
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
              const validCoords = coords.filter(
                (coord): coord is [number, number] =>
                  Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
              );
              setPolygonCoordinates(validCoords);
              setHasDrawnPolygon(validCoords.length >= 3);
            }
          } else if (mode === 'simple_select' && allFeatures.features.length > 0) {
            const feature = allFeatures.features[0];
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
              const validCoords = coords.filter(
                (coord): coord is [number, number] =>
                  Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null
              );
              setPolygonCoordinates(validCoords);
              setHasDrawnPolygon(true);
            }
          } else {
            setPolygonCoordinates([]);
          }
        }
      };

      // Handle mode changes - respect drawMode state to prevent unwanted mode switches
      const handleDrawModeChange = () => {
        if (drawRef.current) {
          const mode = drawRef.current.getMode();
          const allFeatures = drawRef.current.getAll();
          const hasFeatures = allFeatures.features.length > 0;
          const currentDrawMode = drawModeRef.current;
          
          // If we're in pan mode, prevent switching to draw_polygon
          if (currentDrawMode === 'pan' && mode === 'draw_polygon') {
            drawRef.current.changeMode('simple_select');
            setIsDrawingActive(false);
            return;
          }
          
          // If we're in draw mode, ensure we stay in draw_polygon
          if (currentDrawMode === 'draw' && mode !== 'draw_polygon' && mode !== 'direct_select') {
            drawRef.current.changeMode('draw_polygon');
            setIsDrawingActive(true);
            return;
          }
          
          if (mode === 'draw_polygon') {
            setIsDrawingActive(true);
            setHasDrawnPolygon(hasFeatures);
            if (!hasFeatures) {
              setPolygonCoordinates([]);
            }
          } else if (mode === 'direct_select') {
            // Direct select is allowed in both modes for editing
            setIsDrawingActive(false);
            setHasDrawnPolygon(hasFeatures);
            if (!hasFeatures) {
              setPolygonCoordinates([]);
            }
          } else {
            setIsDrawingActive(false);
            if (!hasFeatures) {
              setPolygonCoordinates([]);
            }
          }
        }
      };

      // Store handlers for cleanup
      drawHandlersRef.current = {
        create: handleDrawCreate,
        update: handleDrawUpdate,
        delete: handleDrawDelete,
        modechange: handleDrawModeChange,
        render: handleDrawRender,
      };

      map.on('draw.create', handleDrawCreate);
      map.on('draw.update', handleDrawUpdate);
      map.on('draw.delete', handleDrawDelete);
      map.on('draw.modechange', handleDrawModeChange);
      map.on('draw.render', handleDrawRender);

      // Load existing polygons if available
      const currentValue = formData[questionId];
      if (currentValue) {
        // Handle both single polygon (legacy) and array of polygons
        let polygons: any[] = [];
        if (Array.isArray(currentValue)) {
          polygons = currentValue;
        } else if (currentValue && typeof currentValue === 'object') {
          // Legacy single polygon format
          if (currentValue.type === 'Polygon') {
            polygons = [{ geometry: currentValue, name: 'Area 1', id: `legacy-${Date.now()}` }];
          } else if (currentValue.geometry) {
            // Already in new format
            polygons = [currentValue];
          }
        }
        
        const validPolygons = polygons.filter((p: any) => {
          const geometry = p.geometry || p;
          return p && typeof p === 'object' && geometry && geometry.type === 'Polygon';
        });
        
        if (validPolygons.length > 0) {
          const normalizedPolygons = validPolygons.map((p: any, idx: number) => {
            const geometry = p.geometry || p;
            return {
              id: p.id || `polygon-${Date.now()}-${idx}`,
              name: p.name || `Area ${idx + 1}`,
              geometry: geometry
            };
          });
          
          setSavedPolygons(normalizedPolygons);
          
          // Add all polygons to map
          normalizedPolygons.forEach((p) => {
            try {
              draw.add({
                type: 'Feature',
                geometry: p.geometry,
                properties: { id: p.id, name: p.name, saved: true }
              });
            } catch (e) {
              console.error('Error adding polygon to map:', e);
            }
          });
        }
      } else {
        setSavedPolygons([]);
      }
    }

    return () => {
      // Cleanup when question changes or component unmounts
      if (drawRef.current && map && drawHandlersRef.current) {
        try {
          map.off('draw.create', drawHandlersRef.current.create);
          map.off('draw.update', drawHandlersRef.current.update);
          map.off('draw.delete', drawHandlersRef.current.delete);
          map.off('draw.modechange', drawHandlersRef.current.modechange);
          map.off('draw.render', drawHandlersRef.current.render);
          map.removeControl(drawRef.current);
          // Re-enable all map interactions on cleanup
          map.dragPan.enable();
          map.scrollZoom.enable();
          map.boxZoom.enable();
          map.doubleClickZoom.enable();
          map.keyboard.enable();
          map.touchZoomRotate.enable();
          map.getCanvas().style.cursor = '';
        } catch (e) {
          // Control might already be removed
        }
        drawRef.current = null;
        drawHandlersRef.current = null;
        setIsDrawingActive(false);
        setPolygonCoordinates([]);
        setHasDrawnPolygon(false);
        setDrawMode('draw');
      }
    };
  }, [map, openQuestionId, questions, formData]);

  // Update drawModeRef when drawMode changes
  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  // Handle draw/pan mode switching, cursor management, and map locking
  // This effect strictly enforces mode separation - no panning in draw, no drawing in pan
  useEffect(() => {
    if (!map || !drawRef.current) return;
    
    const currentQuestion = openQuestionId ? questions.find(q => q.id === openQuestionId) : null;
    if (!currentQuestion || currentQuestion.field_type !== 'map_area') {
      // Re-enable all interactions when not in map_area question
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoomRotate.enable();
      map.getCanvas().style.cursor = '';
      return;
    }

    // Strict mode enforcement
    if (drawMode === 'draw') {
      // DRAW MODE: Completely lock all map interactions, only allow drawing
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      map.touchZoomRotate.disable();
      map.getCanvas().style.cursor = 'crosshair';
      
      // Ensure we're in draw_polygon mode
      const currentMode = drawRef.current.getMode();
      if (currentMode !== 'draw_polygon' && currentMode !== 'direct_select') {
        drawRef.current.changeMode('draw_polygon');
      }
      setIsDrawingActive(true);
    } else if (drawMode === 'pan') {
      // PAN MODE: Enable all map interactions, disable drawing
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoomRotate.enable();
      map.getCanvas().style.cursor = 'grab';
      
      // Switch to simple_select to prevent drawing, but preserve existing features
      const currentMode = drawRef.current.getMode();
      if (currentMode === 'draw_polygon') {
        // Get all features before changing mode to preserve them
        const allFeatures = drawRef.current.getAll();
        if (allFeatures.features.length > 0) {
          // Select the first feature to keep it visible
          const firstFeature = allFeatures.features[0];
          drawRef.current.changeMode('simple_select', { featureIds: [firstFeature.id] });
        } else {
          drawRef.current.changeMode('simple_select');
        }
      }
      setIsDrawingActive(false);
    }
  }, [map, drawMode, openQuestionId, questions]);


  // Keyboard shortcuts - Enhanced for web with better focus handling
  useEffect(() => {
    const currentQuestion = openQuestionId ? questions.find(q => q.id === openQuestionId) : null;
    if (!currentQuestion || currentQuestion.field_type !== 'map_area') return;
    if (!drawRef.current || !map) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable ||
                      target.closest('input, textarea, [contenteditable]');
      
      if (isInput) return;

      const currentMode = drawRef.current?.getMode();
      
      // Enter key: Complete polygon drawing, add to saved polygons array, keep visible
      if (e.key === 'Enter' && drawMode === 'draw' && currentMode === 'draw_polygon') {
        e.preventDefault();
        e.stopPropagation();
        if (drawRef.current) {
          const allFeatures = drawRef.current.getAll();
          // Find the polygon being drawn (not yet saved)
          const newPolygon = allFeatures.features.find((f: any) => 
            f.geometry.type === 'Polygon' && !f.properties?.saved
          );
          
          if (newPolygon && newPolygon.geometry.type === 'Polygon') {
            const polygonId = `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const geometry = newPolygon.geometry;
            const featureId = newPolygon.id;
            
            // First, switch to simple_select mode to finalize the polygon
            // This ensures MapboxDraw properly completes and keeps the polygon
            drawRef.current.changeMode('simple_select', { featureIds: [featureId] });
            
            // Use requestAnimationFrame to ensure mode change completes before updating properties
            requestAnimationFrame(() => {
              if (drawRef.current && featureId) {
                try {
                  // Mark as saved and add ID to feature properties
                  drawRef.current.setFeatureProperty(featureId, 'id', polygonId);
                  drawRef.current.setFeatureProperty(featureId, 'saved', true);
                  drawRef.current.setFeatureProperty(featureId, 'name', `Area ${savedPolygons.length + 1}`);
                  
                  // Verify the feature still exists and keep it selected
                  const updatedFeatures = drawRef.current.getAll();
                  const savedFeature = updatedFeatures.features.find((f: any) => f.id === featureId);
                  if (savedFeature) {
                    // Ensure it stays selected and visible
                    drawRef.current.changeMode('simple_select', { featureIds: [featureId] });
                  }
                } catch (err) {
                  console.error('Error setting polygon properties:', err);
                }
              }
            });
            
            // Add to saved polygons array
            const newPolygonData = {
              id: polygonId,
              name: `Area ${savedPolygons.length + 1}`,
              geometry: geometry
            };
            
            setSavedPolygons((prev) => {
              const updated = [...prev, newPolygonData];
              // Update formData with all polygons
              setFormData((formPrev) => ({ ...formPrev, [currentQuestion.id]: updated }));
              return updated;
            });
            
            setIsDrawingActive(false);
            setHasDrawnPolygon(true);
            setPolygonCoordinates([]);
            
            // Switch to pan mode so user can navigate (but don't do it immediately to avoid race condition)
            setTimeout(() => {
              setDrawMode('pan');
            }, 100);
            
            setSuccess(`Area ${savedPolygons.length + 1} completed. Add a name or draw another area.`);
          }
        }
        return;
      }
      
      // Escape key: Cancel current drawing or clear polygon
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (drawRef.current) {
          const allFeatures = drawRef.current.getAll();
          if (allFeatures.features.length > 0) {
            // Clear the polygon from map
            allFeatures.features.forEach((feature) => {
              if (feature.id) {
                drawRef.current?.delete(feature.id as string);
              }
            });
          }
          // Clear from formData
          setFormData((prev) => {
            const updated = { ...prev };
            delete updated[currentQuestion.id];
            return updated;
          });
          drawRef.current.changeMode('simple_select');
          setIsDrawingActive(false);
          setHasDrawnPolygon(false);
          setPolygonCoordinates([]);
          // Switch to pan mode after clearing
          setDrawMode('pan');
          setSuccess('Polygon cleared. Switch to Draw to start again.');
        }
        return;
      }
    };

    // Use capture phase to catch events before they bubble
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [drawMode, openQuestionId, questions, map]);


  // Handle map click when drop pin is pending
  useEffect(() => {
    if (pendingDropPinIndex !== null && onSetMapClickHandler) {
      const handleMapClick = async (coordinates: { lat: number; lng: number }) => {
        const currentQuestion = openQuestionId ? questions.find(q => q.id === openQuestionId) : null;
        if (!currentQuestion || currentQuestion.field_type !== 'map_point') {
          setPendingDropPinIndex(null);
          onSetMapClickHandler?.(null);
          return;
        }

        try {
          // Reverse geocode to get address
          const result = await ReverseGeocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
          const address = result.address;

          const allowMultiple = currentQuestion.key === 'my-homes' || currentQuestion.options?.allowMultiple === true;
          const currentValue = formData[currentQuestion.id];
          const isMultiple = Array.isArray(currentValue);
          const locations = isMultiple ? currentValue : (currentValue ? [currentValue] : []);

          // Create new location object in JSONB format
          const newLocation = {
            address,
            lat: coordinates.lat,
            lng: coordinates.lng,
          };

          // Update the specific location index
          if (pendingDropPinIndex >= 0 && pendingDropPinIndex < locations.length) {
            // Update existing location
            const updated = [...locations];
            updated[pendingDropPinIndex] = newLocation;
            if (allowMultiple) {
              handleInputChange(currentQuestion.id, updated);
            } else {
              handleInputChange(currentQuestion.id, updated[0]);
            }
          } else {
            // Add new location
            if (allowMultiple) {
              const updated = [...locations, newLocation];
              handleInputChange(currentQuestion.id, updated);
            } else {
              handleInputChange(currentQuestion.id, newLocation);
            }
          }

          // Add temporary marker
          const markerId = `onboarding-temp-${currentQuestion.id}-${pendingDropPinIndex}`;
          // Remove old marker for this location
          tempMarkerIds.forEach((id) => {
            if (id.startsWith(`onboarding-temp-${currentQuestion.id}-${pendingDropPinIndex}`)) {
              removeMarker?.(id);
            }
          });
          setTempMarkerIds((prev) => {
            const updated = new Set(prev);
            updated.add(markerId);
            return updated;
          });
          addMarker?.(markerId, coordinates, {
            color: '#C2B289',
            popupContent: address,
          });

          // Track location in all locations map
          setAllOnboardingLocations((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(currentQuestion.id) || [];
            const newLocations = [...existing];
            if (pendingDropPinIndex >= 0 && pendingDropPinIndex < newLocations.length) {
              newLocations[pendingDropPinIndex] = { address, lat: coordinates.lat, lng: coordinates.lng };
            } else {
              newLocations.push({ address, lat: coordinates.lat, lng: coordinates.lng });
            }
            updated.set(currentQuestion.id, newLocations);
            return updated;
          });

          // Fly to location
          onFlyTo?.(coordinates, 16);

          // Clear pending state
          setPendingDropPinIndex(null);
          onSetMapClickHandler?.(null);
          setSuccess('Location saved!');
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          setError('Failed to get address for location');
          setPendingDropPinIndex(null);
          onSetMapClickHandler?.(null);
        }
      };

      onSetMapClickHandler(handleMapClick);
    } else {
      onSetMapClickHandler?.(null);
    }

    return () => {
      onSetMapClickHandler?.(null);
    };
  }, [pendingDropPinIndex, onSetMapClickHandler, questions, openQuestionId, formData, addMarker, removeMarker, onFlyTo, tempMarkerIds]);

  // Handle drop pin button click - use current map center or enable click
  const handleDropPin = async (locationIndex: number, questionId: number) => {
    // Ensure question is open
    if (openQuestionId !== questionId) {
      setOpenQuestionId(questionId);
    }
    
    const currentQuestion = questions.find(q => q.id === questionId);
    if (!currentQuestion || currentQuestion.field_type !== 'map_point') return;

    // Try to get current map center first
    if (getMapCenter) {
      const center = getMapCenter();
      if (center) {
        // Use current map center immediately
        try {
          const result = await ReverseGeocodingService.reverseGeocode(center.lat, center.lng);
          const address = result.address;

          const allowMultiple = currentQuestion.key === 'my-homes' || currentQuestion.options?.allowMultiple === true;
          const currentValue = formData[currentQuestion.id];
          const isMultiple = Array.isArray(currentValue);
          const locations = isMultiple ? currentValue : (currentValue ? [currentValue] : []);

          // Create location object in JSONB format
          const newLocation = {
            address,
            lat: center.lat,
            lng: center.lng,
          };

          if (locationIndex >= 0 && locationIndex < locations.length) {
            const updated = [...locations];
            updated[locationIndex] = newLocation;
            if (allowMultiple) {
              handleInputChange(currentQuestion.id, updated);
            } else {
              handleInputChange(currentQuestion.id, updated[0]);
            }
          } else {
            if (allowMultiple) {
              const updated = [...locations, newLocation];
              handleInputChange(currentQuestion.id, updated);
            } else {
              handleInputChange(currentQuestion.id, newLocation);
            }
          }

          const markerId = `onboarding-temp-${currentQuestion.id}-${locationIndex}`;
          tempMarkerIds.forEach((id) => {
            if (id.startsWith(`onboarding-temp-${currentQuestion.id}-${locationIndex}`)) {
              removeMarker?.(id);
            }
          });
          setTempMarkerIds((prev) => {
            const updated = new Set(prev);
            updated.add(markerId);
            return updated;
          });
          addMarker?.(markerId, center, {
            color: '#C2B289',
            popupContent: address,
          });

          onFlyTo?.(center, 16);
          setSuccess('Location set from map center');
          return;
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          setError('Failed to get address for location');
        }
      }
    }

    // If no center available, enable map click mode
    setPendingDropPinIndex(locationIndex);
    setSuccess('Click on the map to drop a pin');
  };

  const handleInputChange = (questionId: number, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async (questionId?: number) => {
    if (!selectedProfile) return;

    const questionIdToSave = questionId ?? openQuestionId;
    if (!questionIdToSave) return;

    const currentQuestion = questions.find(q => q.id === questionIdToSave);
    if (!currentQuestion) return;

    // Validate required fields
    if (currentQuestion.required && (!formData[currentQuestion.id] || formData[currentQuestion.id] === '')) {
      setError('This field is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const answerValue = formData[currentQuestion.id];
      
      // Validate map_area answer - handle both single polygon (legacy) and array format
      if (currentQuestion.field_type === 'map_area') {
        if (currentQuestion.required) {
          const isValid = answerValue && (
            (Array.isArray(answerValue) && answerValue.length > 0) ||
            (typeof answerValue === 'object' && answerValue.type === 'Polygon')
          );
          if (!isValid) {
            setError('Please draw at least one area on the map');
            setSaving(false);
            return;
          }
        }
      }
      
      // If it's a map_point question with 'my-homes' key, sync homes in my_homes table
      if (currentQuestion.field_type === 'map_point' && currentQuestion.key === 'my-homes' && answerValue) {
        try {
          // Get existing answer and homes to compare
          const existingAnswer = answers.find(a => a.question_id === currentQuestion.id);
          const existingHomes = await MyHomesService.getHomesByProfile(selectedProfile.id);

          // For my-homes, always treat as single location (not array)
          const location = typeof answerValue === 'object' && answerValue !== null 
            ? answerValue 
            : typeof answerValue === 'string' 
              ? { address: answerValue }
              : null;
          
          // Check if location is valid
          const isValidLocation = location && (
            (typeof location === 'object' && location.address?.trim()) ||
            (typeof location === 'string' && location.trim())
          );
          
          if (!isValidLocation) {
            // No valid location, skip home creation
            return;
          }

          // Process single location to get home data
          let address: string;
          let coordinates: { lat: number; lng: number } | null = null;

          if (typeof location === 'string') {
            address = location;
            // Geocode to get coordinates
            const geocodeResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
              `access_token=${MAP_CONFIG.MAPBOX_TOKEN}&` +
              `limit=1`
            );
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.features && geocodeData.features.length > 0) {
              const feature = geocodeData.features[0];
              coordinates = { lat: feature.center[1], lng: feature.center[0] };
            }
          } else {
            address = location.address;
            if (location.lat && location.lng) {
              coordinates = { lat: location.lat, lng: location.lng };
            } else {
              // Geocode if coordinates missing
              const geocodeResponse = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
                `access_token=${MAP_CONFIG.MAPBOX_TOKEN}&` +
                `limit=1`
              );
              const geocodeData = await geocodeResponse.json();
              if (geocodeData.features && geocodeData.features.length > 0) {
                const feature = geocodeData.features[0];
                coordinates = { lat: feature.center[1], lng: feature.center[0] };
              }
            }
          }

          if (!address || !coordinates) {
            return;
          }

          const newHomeData = { address, lat: coordinates.lat, lng: coordinates.lng };

          // Normalize addresses for comparison
          const normalizeAddress = (addr: string) => addr.toLowerCase().trim();
          
          // Get addresses from existing answer (if any)
          const existingAnswerAddresses = new Set<string>();
          if (existingAnswer?.value) {
            const oldLocations = Array.isArray(existingAnswer.value) 
              ? existingAnswer.value 
              : [existingAnswer.value];
            oldLocations.forEach((loc: any) => {
              const addr = typeof loc === 'string' ? loc : loc?.address;
              if (addr) {
                existingAnswerAddresses.add(normalizeAddress(addr));
              }
            });
          }

          // Get address from new answer (single location for my-homes)
          const newAnswerAddress = normalizeAddress(newHomeData.address);

          // Find home to delete: home that was in the old answer but not matching new answer
          // Only delete home that came from onboarding (match address from old answer)
          const homeToDelete = existingHomes.find(home => {
            const normalizedHomeAddress = normalizeAddress(home.address);
            // Delete if this home was in the old answer but address changed
            return existingAnswerAddresses.has(normalizedHomeAddress) && 
                   normalizedHomeAddress !== newAnswerAddress;
          });

          // Delete old home if address changed
          if (homeToDelete) {
            try {
              await MyHomesService.deleteHome(homeToDelete.id);
            } catch (err) {
              console.error('Error deleting home:', err);
            }
          }

          // Check if home already exists
          const existingHomeAddresses = new Set(existingHomes.map(h => normalizeAddress(h.address)));
          const homeExists = existingHomeAddresses.has(newAnswerAddress);

          // Create new home if it doesn't exist
          if (!homeExists) {
            await MyHomesService.createHome(newHomeData, selectedProfile.id);
            setSuccess('Home saved!');
          } else {
            setSuccess('Home updated!');
          }
        } catch (homeErr) {
          console.error('Error syncing homes:', homeErr);
          // Continue even if home sync fails
        }
      }

      // Save current answer
      await OnboardingService.saveAnswers(selectedProfile.id, [
        {
          question_id: currentQuestion.id,
          value: answerValue,
        },
      ]);

      // Remove temporary markers
      tempMarkerIds.forEach((id) => {
        removeMarker?.(id);
      });
      setTempMarkerIds(new Set());

      // Reload answers
      const updatedAnswers = await OnboardingService.getAnswersByProfile(selectedProfile.id);
      setAnswers(updatedAnswers);

      // Check if all questions are answered
      const allAnswered = questions.every((q) => {
        if (!q.required) return true;
        return updatedAnswers.some((a) => a.question_id === q.id);
      });

      if (allAnswered) {
        // Mark profile as onboarded
        await ProfileService.updateProfile(selectedProfile.id, { onboarded: true });
        await refreshProfiles();
        setSuccess('Onboarding complete!');
        setTimeout(() => {
          setIsOpen(false);
          // Redirect to main map page after onboarding is complete
          router.push('/map');
        }, 2000);
        return;
      }

      setSuccess('Saved!');
    } catch (err) {
      console.error('Error saving answers:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (questionId: number) => {
    setOpenQuestionId(openQuestionId === questionId ? null : questionId);
    setError('');
    setSuccess('');
  };

  // Helper to safely get options values array
  const getOptionsValues = (question: OnboardingQuestion): string[] => {
    if (!question.options) return [];
    if (typeof question.options === 'string') {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed.values) ? parsed.values : [];
      } catch {
        return [];
      }
    }
    if (typeof question.options === 'object' && question.options !== null) {
      return Array.isArray(question.options.values) ? question.options.values : [];
    }
    return [];
  };

  const renderInput = (question: OnboardingQuestion) => {
    const currentValue = formData[question.id];
    const inputBaseClasses = "w-full px-2 py-1.5 text-xs bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 placeholder:text-white/50 text-white";

    switch (question.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={inputBaseClasses}
            placeholder={question.description || 'Enter text'}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={inputBaseClasses}
            placeholder={question.description || 'Enter text'}
            rows={4}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value ? Number(e.target.value) : null)}
            className={inputBaseClasses}
            placeholder={question.description || 'Enter number'}
          />
        );

      case 'currency':
        return (
          <input
            type="number"
            step="0.01"
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value ? Number(e.target.value) : null)}
            className={inputBaseClasses}
            placeholder={question.description || 'Enter amount'}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue === true}
              onChange={(e) => handleInputChange(question.id, e.target.checked)}
              className="w-3.5 h-3.5 text-white border-white/30 rounded focus:ring-1 focus:ring-white/50 bg-white/20"
            />
            <span className="text-xs text-white/90">
              {currentValue === true ? 'Yes' : 'No'}
            </span>
          </label>
        );

      case 'select': {
        const values = getOptionsValues(question);
        if (values.length === 0) {
          return (
            <div className="text-xs text-white/70 p-2 bg-white/5 rounded">
              No options available
            </div>
          );
        }
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value || null)}
            className={`${inputBaseClasses} bg-white/20`}
          >
            <option value="" className="bg-gray-800 text-white">Select...</option>
            {values.map((option) => (
              <option key={option} value={option} className="bg-gray-800 text-white">
                {option}
              </option>
            ))}
          </select>
        );
      }

      case 'multiselect': {
        const values = getOptionsValues(question);
        if (values.length === 0) {
          return (
            <div className="text-xs text-white/70 p-2 bg-white/5 rounded">
              No options available
            </div>
          );
        }
        return (
          <div className="space-y-1.5">
            {values.map((option) => {
              const selectedValues = Array.isArray(currentValue) ? currentValue : [];
              const isSelected = selectedValues.includes(option);
              return (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option]
                        : selectedValues.filter((v) => v !== option);
                      handleInputChange(question.id, newValues);
                    }}
                    className="w-3.5 h-3.5 text-white border-white/30 rounded focus:ring-1 focus:ring-white/50 bg-white/20"
                  />
                  <span className="text-xs text-white/90">{option}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'map_point': {
        // For my-homes key, treat as single location (not multiple)
        const isMyHomes = question.key === 'my-homes';
        const allowMultiple = !isMyHomes && (question.options?.allowMultiple === true);
        const isMultiple = Array.isArray(currentValue);
        // Handle empty/null values
        let locations: any[] = [];
        if (currentValue) {
          if (isMultiple) {
            locations = Array.isArray(currentValue) ? currentValue : [];
          } else if (typeof currentValue === 'object') {
            locations = [currentValue];
          } else if (typeof currentValue === 'string') {
            locations = [{ address: currentValue }];
          }
        }
        
        // Helper to parse location (handle both string and object formats)
        const parseLocation = (loc: any): { address: string; lat?: number; lng?: number } => {
          if (typeof loc === 'string') {
            return { address: loc };
          }
          if (typeof loc === 'object' && loc !== null) {
            return {
              address: loc.address || '',
              lat: loc.lat,
              lng: loc.lng,
            };
          }
          return { address: '' };
        };

        // Helper to update locations
        const updateLocation = (index: number, location: { address: string; lat?: number; lng?: number }) => {
          // For my-homes, always save as single object (not array)
          if (isMyHomes) {
            handleInputChange(question.id, location);
          } else {
            const updated = [...locations];
            updated[index] = location;
            if (allowMultiple) {
              handleInputChange(question.id, updated);
            } else {
              handleInputChange(question.id, updated[0] || null);
            }
          }
        };

        const addLocation = () => {
          const newLocations = [...locations, { address: '', lat: undefined, lng: undefined }];
          handleInputChange(question.id, newLocations);
        };

        const removeLocation = (index: number) => {
          const updated = locations.filter((_, i) => i !== index);
          if (allowMultiple) {
            handleInputChange(question.id, updated.length > 0 ? updated : null);
          } else {
            handleInputChange(question.id, null);
          }
        };

        return (
          <div className="space-y-2">
            {/* Privacy message for my-homes */}
            {question.key === 'my-homes' && (
              <p className="text-[10px] text-white/60 italic">
                This information is not shared with anyone
              </p>
            )}
            {locations.map((location, index) => {
              const parsed = parseLocation(location);
              return (
                <div key={index} className="space-y-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  {allowMultiple && locations.length > 1 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/70">Location {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeLocation(index)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-300"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <MinnesotaAddressSearch
                    value={parsed.address}
                    onChange={(address, coordinates) => {
                      const updatedLocation = {
                        address,
                        lat: coordinates?.lat,
                        lng: coordinates?.lng,
                      };
                      updateLocation(index, updatedLocation);
                      if (coordinates && onFlyTo) {
                        onFlyTo(coordinates, 16);
                        // Add temporary marker (persists across questions)
                        const markerId = `onboarding-temp-${question.id}-${index}`;
                        // Remove old marker for this location
                        tempMarkerIds.forEach((id) => {
                          if (id === markerId || id.startsWith(`onboarding-temp-${question.id}-${index}`)) {
                            removeMarker?.(id);
                          }
                        });
                        setTempMarkerIds((prev) => {
                          const updated = new Set(prev);
                          updated.add(markerId);
                          return updated;
                        });
                        addMarker?.(markerId, coordinates, {
                          color: '#C2B289',
                          popupContent: address,
                        });
                        // Update all locations tracking
                        setAllOnboardingLocations((prev) => {
                          const updated = new Map(prev);
                          const existing = updated.get(question.id) || [];
                          const newLocations = [...existing];
                          if (index < newLocations.length) {
                            newLocations[index] = { address, lat: coordinates.lat, lng: coordinates.lng };
                          } else {
                            newLocations.push({ address, lat: coordinates.lat, lng: coordinates.lng });
                          }
                          updated.set(question.id, newLocations);
                          return updated;
                        });
                      }
                    }}
                    onFlyTo={onFlyTo}
                    placeholder="Search Minnesota address..."
                    className={inputBaseClasses}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDropPin(index, question.id)}
                      disabled={pendingDropPinIndex === index}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MapPinIcon className="w-3 h-3 inline mr-1" />
                      {pendingDropPinIndex === index ? 'Click Map...' : 'Drop Pin'}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {allowMultiple && !isMyHomes && (
              <button
                type="button"
                onClick={addLocation}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
              >
                <PlusIcon className="w-3 h-3" />
                Add Another Location
              </button>
            )}
            
            {locations.length === 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={addLocation}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                >
                  <PlusIcon className="w-3 h-3" />
                  Add Location
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDropPin(0, question.id)}
                    disabled={pendingDropPinIndex === 0}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MapPinIcon className="w-3 h-3" />
                    {pendingDropPinIndex === 0 ? 'Click Map...' : 'Drop Pin'}
                  </button>
                </div>
              </div>
            )}
            
            {pendingDropPinIndex !== null && (
              <p className="text-[10px] text-white/70">
                {getMapCenter ? 'Click to use map center location' : 'Click anywhere on the map to set location'}
              </p>
            )}
          </div>
        );
      }

      case 'map_area': {
        // Handle both legacy single polygon and new array format
        const polygonsArray = currentValue 
          ? (Array.isArray(currentValue) ? currentValue : [{ geometry: currentValue, name: 'Area 1', id: 'legacy-1' }])
          : [];
        const hasPolygons = savedPolygons.length > 0 || polygonsArray.length > 0;

        // Helper to calculate polygon center for fly-to
        const getPolygonCenter = (geometry: any) => {
          if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
            const coords = geometry.coordinates[0];
            let sumLat = 0, sumLng = 0;
            coords.forEach((coord: [number, number]) => {
              sumLng += coord[0];
              sumLat += coord[1];
            });
            return {
              lat: sumLat / coords.length,
              lng: sumLng / coords.length
            };
          }
          return null;
        };

        // Helper to delete a polygon
        const handleDeletePolygon = (polygonId: string) => {
          // Remove from map
          if (drawRef.current) {
            const allFeatures = drawRef.current.getAll();
            const feature = allFeatures.features.find((f: any) => f.properties?.id === polygonId);
            if (feature?.id) {
              drawRef.current.delete(feature.id as string);
            }
          }
          
          // Remove from saved polygons
          const updated = savedPolygons.filter(p => p.id !== polygonId);
          setSavedPolygons(updated);
          
          // Update formData
          setFormData((prev) => ({
            ...prev,
            [question.id]: updated.length > 0 ? updated : null
          }));
          
          setSuccess('Area deleted.');
        };

        // Helper to fly to polygon
        const handleFlyToPolygon = (polygon: {id: string; name: string; geometry: any}) => {
          const center = getPolygonCenter(polygon.geometry);
          if (center && onFlyTo) {
            onFlyTo(center, 14);
            // Highlight the polygon on map
            if (drawRef.current) {
              const allFeatures = drawRef.current.getAll();
              const feature = allFeatures.features.find((f: any) => f.properties?.id === polygon.id);
              if (feature?.id) {
                drawRef.current.changeMode('simple_select', { featureIds: [feature.id] });
              }
            }
          }
        };

        // Helper to save polygon name
        const handleSavePolygonName = (polygonId: string) => {
          const updated = savedPolygons.map(p => 
            p.id === polygonId 
              ? { ...p, name: polygonNameInput.trim() || p.name }
              : p
          );
          setSavedPolygons(updated);
          setFormData((prev) => ({
            ...prev,
            [question.id]: updated
          }));
          setEditingPolygonName(null);
          setPolygonNameInput('');
        };

        return (
          <div className="space-y-2.5">
            {/* Mode Toggle - Compact mobile-friendly buttons */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-white/90 font-medium">Drawing Area</p>
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode('draw');
                    if (drawRef.current) {
                      const allFeatures = drawRef.current.getAll();
                      if (allFeatures.features.length === 0) {
                        // No polygon exists, start new drawing
                        drawRef.current.changeMode('draw_polygon');
                        setIsDrawingActive(true);
                      } else {
                        // Polygon exists - allow continuing to add points or start fresh
                        // User can clear first if they want to start over
                        drawRef.current.changeMode('draw_polygon');
                        setIsDrawingActive(true);
                      }
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] md:text-[11px] transition-all flex items-center gap-1 min-w-[60px] justify-center ${
                    drawMode === 'draw'
                      ? 'bg-white/25 text-white shadow-sm'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                  title="Draw polygon - Map locked"
                  aria-label="Draw mode"
                >
                  <PencilIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode('pan');
                  }}
                  className={`px-2 py-1 rounded text-[10px] md:text-[11px] transition-all flex items-center gap-1 min-w-[60px] justify-center ${
                    drawMode === 'pan'
                      ? 'bg-white/25 text-white shadow-sm'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                  title="Pan map - Drawing disabled"
                  aria-label="Pan mode"
                >
                  <HandRaisedIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">Pan</span>
                </button>
              </div>
            </div>

            {/* Status Messages - Compact */}
            {drawMode === 'draw' && (
              <div className="p-1.5 bg-gold-500/20 rounded border border-gold-500/30">
                <p className="text-white/90 text-[10px] md:text-[11px] font-medium">
                  <span className="inline-block w-1.5 h-1.5 bg-gold-400 rounded-full mr-1.5"></span>
                  Draw mode: Map locked. Tap map to add points. Press Enter to finish, Esc to cancel.
                </p>
              </div>
            )}

            {drawMode === 'pan' && (
              <div className="p-1.5 bg-white/10 rounded border border-white/20">
                <p className="text-white/80 text-[10px] md:text-[11px]">
                  <span className="inline-block w-1.5 h-1.5 bg-white/40 rounded-full mr-1.5"></span>
                  {hasPolygons 
                    ? `Pan mode: ${savedPolygons.length} area${savedPolygons.length !== 1 ? 's' : ''} saved. Draw to add more.`
                    : 'Pan mode: Drag to move map. Switch to Draw to add points.'}
                </p>
              </div>
            )}

            {question.description && (
              <p className="text-xs text-white/70">{question.description}</p>
            )}

            {/* Current Drawing Info */}
            {polygonCoordinates.length > 0 && isDrawingActive && (
              <div className="p-1.5 bg-gold-500/10 rounded border border-gold-500/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white/90 text-[10px] md:text-[11px] font-medium">
                    Drawing: <span className="font-semibold">{polygonCoordinates.length}</span> points
                    <span className="text-gold-300 ml-1">(drawing...)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Polygons List */}
            {savedPolygons.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/90 font-medium">
                    Saved Areas ({savedPolygons.length})
                  </p>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {savedPolygons.map((polygon, index) => (
                    <div
                      key={polygon.id}
                      className="p-1.5 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          {editingPolygonName === polygon.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={polygonNameInput}
                                onChange={(e) => setPolygonNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSavePolygonName(polygon.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingPolygonName(null);
                                    setPolygonNameInput('');
                                  }
                                }}
                                className="flex-1 px-1.5 py-0.5 text-[10px] bg-white/20 border border-white/30 rounded text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder="Area name"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePolygonName(polygon.id)}
                                className="p-0.5 text-white/80 hover:text-white"
                                title="Save name"
                              >
                                <CheckIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-white/90 text-[10px] md:text-[11px] font-medium cursor-pointer hover:text-white"
                              onClick={() => {
                                setEditingPolygonName(polygon.id);
                                setPolygonNameInput(polygon.name);
                              }}
                              title="Click to edit name"
                            >
                              {polygon.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleFlyToPolygon(polygon)}
                            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Fly to area"
                          >
                            <PaperAirplaneIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (drawRef.current) {
                                const allFeatures = drawRef.current.getAll();
                                const feature = allFeatures.features.find((f: any) => f.properties?.id === polygon.id);
                                if (feature?.id) {
                                  drawRef.current.changeMode('direct_select', { featureId: feature.id });
                                  setDrawMode('draw');
                                  setIsDrawingActive(false);
                                }
                              }
                            }}
                            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Edit vertices"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePolygon(polygon.id)}
                            className="p-1 text-red-300/70 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete area"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No polygons message */}
            {!hasPolygons && polygonCoordinates.length === 0 && (
              <p className="text-white/70 text-[10px] md:text-xs text-center py-2">
                No areas saved yet. Switch to Draw mode and tap the map to add points.
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              {savedPolygons.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (drawRef.current) {
                      // Clear all polygons from map
                      const allFeatures = drawRef.current.getAll();
                      allFeatures.features.forEach((feature) => {
                        if (feature.id) {
                          drawRef.current?.delete(feature.id as string);
                        }
                      });
                    }
                    // Clear all saved polygons
                    setSavedPolygons([]);
                    setFormData((prev) => ({
                      ...prev,
                      [question.id]: null
                    }));
                    setDrawMode('pan');
                    setSuccess('All areas cleared.');
                  }}
                  className="flex-1 px-2 py-1.5 text-[10px] md:text-xs rounded-lg border border-red-500/50 text-red-300 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                >
                  Clear All Areas
                </button>
              )}
            </div>

            {/* Keyboard hints - Desktop only */}
            <div className="text-[9px] md:text-[10px] text-white/50 space-y-0.5 hidden md:block pt-1 border-t border-white/10">
              <p>• <kbd className="px-1 py-0.5 bg-white/10 rounded text-[8px]">Enter</kbd> to finish polygon (keeps it visible for editing)</p>
              <p>• <kbd className="px-1 py-0.5 bg-white/10 rounded text-[8px]">Esc</kbd> to clear polygon</p>
              <p>• Click <strong>Complete</strong> button to save your area</p>
            </div>
          </div>
        );
      }

      case 'address':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={inputBaseClasses}
            placeholder={question.description || 'Enter address'}
          />
        );

      case 'range':
        const min = question.options?.min ?? 0;
        const max = question.options?.max ?? 100;
        const step = question.options?.step ?? 1;
        return (
          <div className="space-y-1">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={currentValue ?? min}
              onChange={(e) => handleInputChange(question.id, Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-white/80 text-center">
              <strong>{currentValue ?? min}</strong> ({min}-{max})
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={inputBaseClasses}
            placeholder="Enter value"
          />
        );
    }
  };

  if (!selectedProfile || selectedProfile.onboarded) {
    return null;
  }

  if (questions.length === 0 && !loading) {
    return null;
  }

  const answeredCount = questions.filter(q => answers.some(a => a.question_id === q.id)).length;
  const requiredCount = questions.filter(q => q.required).length;
  const requiredAnsweredCount = questions.filter(q => q.required && answers.some(a => a.question_id === q.id)).length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:absolute md:inset-x-auto md:top-4 md:right-4 md:bottom-auto">
      <div 
        className={`
          bg-black/30 backdrop-blur-md shadow-2xl w-full flex flex-col border border-white/30
          rounded-t-3xl md:rounded-xl
          max-h-[90vh] md:max-h-[85vh]
          md:w-[90vw] md:max-w-lg
        `}
        style={{
          transform: isOpen 
            ? `translateY(${Math.max(0, dragY)}px)` 
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          paddingBottom: 'clamp(0.5rem, env(safe-area-inset-bottom), 2rem)',
        }}
      >
        {/* Drag Handle - Mobile Only */}
        <div 
          className="flex justify-center pt-3 pb-2 md:hidden touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-2.5 border-b border-white/20">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-white truncate">Onboarding</h2>
            <p className="text-xs text-white/70 truncate">
              {selectedProfile.username} • {selectedProfile.profile_type.replace(/_/g, ' ')} • {answeredCount}/{questions.length} answered
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors ml-2 flex-shrink-0"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`p-2 mx-2.5 mt-2 rounded text-xs ${
            error ? 'bg-red-500/20 border border-red-400/30 text-red-100' : 'bg-green-500/20 border border-green-400/30 text-green-100'
          }`}>
            {error || success}
          </div>
        )}

        {/* Content - Accordion */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {loading && (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-white/70">Loading...</p>
            </div>
          )}

          {!loading && questions.map((question) => {
            const isOpen = openQuestionId === question.id;
            const hasAnswer = answers.some((a) => a.question_id === question.id);
            
            return (
              <div
                key={question.id}
                className={`rounded-lg border transition-all ${
                  hasAnswer 
                    ? 'bg-green-500/10 border-green-400/30' 
                    : 'bg-white/5 border-white/20'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full p-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-white text-xs truncate">
                          {question.label}
                        </h3>
                        {question.required && (
                          <span className="text-[10px] text-red-300 flex-shrink-0">*</span>
                        )}
                        {hasAnswer && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-200 rounded flex-shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      {question.description && !isOpen && (
                        <p className="text-[10px] text-white/60 line-clamp-1">{question.description}</p>
                      )}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUpIcon className="w-4 h-4 text-white/70 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-white/70 flex-shrink-0" />
                  )}
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="px-2.5 pb-2.5 space-y-2">
                    {question.description && (
                      <p className="text-[10px] text-white/60">{question.description}</p>
                    )}
                    <div>
                      {renderInput(question)}
                    </div>
                    <button
                      onClick={() => handleSave(question.id)}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 active:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs border border-white/30"
                    >
                      {saving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
