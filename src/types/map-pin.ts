/**
 * TypeScript types for public map pins
 */

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string | null;
  description: string | null;
  type: string | null;
  color: string | null;
  icon: string | null;
  media_url: string | null;
  account_id: string | null;
  post_id: string | null;
  city_id: string | null;
  county_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMapPinData {
  lat: number;
  lng: number;
  label: string;
  color?: string | null;
  description?: string | null;
  icon?: string | null;
  media_url?: string | null;
  post_id?: string | null;
  city_id?: string | null;
  county_id?: string | null;
}

export interface UpdateMapPinData {
  lat?: number;
  lng?: number;
  label?: string | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  media_url?: string | null;
  post_id?: string | null;
  city_id?: string | null;
  county_id?: string | null;
}

export interface MapPinFilters {
  account_id?: string;
  bbox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

/**
 * GeoJSON Feature for a map pin
 */
export interface MapPinGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    label: string | null;
    description: string | null;
    color: string | null;
    icon: string | null;
    media_url: string | null;
    account_id: string | null;
    post_id: string | null;
    city_id: string | null;
    county_id: string | null;
  };
}

/**
 * GeoJSON FeatureCollection for map pins
 */
export interface MapPinGeoJSONCollection {
  type: 'FeatureCollection';
  features: MapPinGeoJSONFeature[];
}
