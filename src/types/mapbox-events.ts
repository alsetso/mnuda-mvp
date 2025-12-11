/**
 * Type definitions for Mapbox event handlers
 */

export interface MapboxMapInstance {
  _pinDragHandler?: {
    mousedown: (e: MapboxMouseEvent) => void;
    mousemove: (e: MapboxMouseEvent) => void;
    mouseup: (e: MapboxMouseEvent) => void;
  };
  removed?: boolean;
  _removed?: boolean;
  _drawObserver?: MutationObserver;
  _keyboardHandler?: (e: KeyboardEvent) => void;
  getSource: (sourceId: string) => { setData: (data: unknown) => void } | null;
  on: (event: string, handler: (e: unknown) => void) => void;
  once: (event: string, handler: (e: unknown) => void) => void;
  off: (event: string, handler?: unknown) => void;
  getCenter: () => { lng: number; lat: number };
  getZoom: () => number;
  setStyle: (style: string) => void;
  setCenter: (center: [number, number] | { lng: number; lat: number }) => void;
  setZoom: (zoom: number) => void;
  flyTo: (options: {
    center: [number, number];
    zoom: number;
    duration?: number;
  }) => void;
  easeTo: (options: {
    pitch: number;
    duration?: number;
  }) => void;
  remove: () => void;
}

export interface MapboxMouseEvent {
  lngLat: { lng: number; lat: number };
  point: { x: number; y: number };
  originalEvent: MouseEvent;
  target: unknown;
  [key: string]: unknown;
}

export interface MapboxDrawEvent {
  mode: string;
  [key: string]: unknown;
}

export interface MapboxSuggestion {
  center: [number, number];
  place_name: string;
  context?: Array<{
    id: string;
    text: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface MapboxFeature {
  id?: string | number;
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  context?: Array<{
    id: string;
    text: string;
    [key: string]: unknown;
  }>;
}


