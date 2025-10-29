// Map configuration and environment settings
export const MAP_CONFIG = {
  // Geocoding cache settings
  GEOCODE_CACHE_TTL: parseInt(process.env.NEXT_PUBLIC_GEOCODE_CACHE_TTL || '86400000'), // 24 hours default
  
  // Mapbox settings
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
  MAPBOX_STYLE: process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12',
  
  // Strategic map styles for different use cases
  STRATEGIC_STYLES: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  },
  
  // Map defaults - Start with reasonable view
  DEFAULT_CENTER: [-93.2650, 44.9778] as [number, number], // Minneapolis, MN
  DEFAULT_ZOOM: 10, // Start at zoom 10 for city view
  GLOBE_ZOOM: 0, // Globe view zoom level
  MAX_ZOOM: 22, // Maximum zoom level (Mapbox default)
  ADDRESS_ZOOM: 16,
  USER_LOCATION_ZOOM: 15,
  
  // Minnesota bounds for validation
  MINNESOTA_BOUNDS: {
    north: 49.5,
    south: 43.5,
    east: -89.5,
    west: -97.5
  },
  
  // User location tracking
  TRACKING_INTERVAL_MS: parseInt(process.env.NEXT_PUBLIC_TRACKING_INTERVAL_MS || '1000'),
  GEOLOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0, // Don't cache location for real-time updates
  },
  
  // Geocoding API settings
  GEOCODING_BASE_URL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  GEOCODING_LIMIT: 1,
  GEOCODING_COUNTRY: 'US',
  
  // Marker colors
  MARKER_COLORS: {
    ADDRESS_PIN: '#1dd1f5',
    USER_MARKER: '#3b82f6',
    ADDRESS_SEARCH: '#3B82F6',
    ADDRESS_CURRENT: '#10B981',
    ADDRESS_PREVIOUS: '#F59E0B',
    SKIP_TRACE: '#014463', // Dark MNUDA blue for skip trace pins
  },
  
  // Animation settings
  FLY_TO_DURATION: 1000,
  PULSE_ANIMATION_DURATION: 2000,
  
  // Performance optimizations
  PERFORMANCE: {
    // Reduce tile cache for faster loading
    MAX_TILE_CACHE_SIZE: 50,
    // Disable unnecessary features
    RENDER_WORLD_COPIES: false,
    // Optimize rendering
    PRESERVE_DRAWING_BUFFER: true,
    ANTIALIAS: false,
    // Faster text rendering
    LOCAL_IDEOGRAPH_FONT_FAMILY: false,
  },
} as const;

// Type for map configuration
export type MapConfig = typeof MAP_CONFIG;
