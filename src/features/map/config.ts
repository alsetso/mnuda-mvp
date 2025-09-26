// Map configuration and environment settings
export const MAP_CONFIG = {
  // Geocoding cache settings
  GEOCODE_CACHE_TTL: parseInt(process.env.NEXT_PUBLIC_GEOCODE_CACHE_TTL || '86400000'), // 24 hours default
  
  // Mapbox settings
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token_here',
  MAPBOX_STYLE: process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12',
  
  // Map defaults
  DEFAULT_CENTER: [-98.5795, 39.8283] as [number, number], // Center of US
  DEFAULT_ZOOM: 4,
  ADDRESS_ZOOM: 16,
  USER_LOCATION_ZOOM: 15,
  
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
  },
  
  // Animation settings
  FLY_TO_DURATION: 1000,
  PULSE_ANIMATION_DURATION: 2000,
} as const;

// Type for map configuration
export type MapConfig = typeof MAP_CONFIG;
