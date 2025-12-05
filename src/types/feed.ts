/**
 * Type definitions for feed API
 */

export interface FeedPost {
  id: string;
  account_id: string;
  title: string | null;
  content: string;
  visibility: string;
  type: string;
  map_geometry?: unknown;
  map_type?: string | null;
  map_data?: unknown;
  account?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
}

export interface Account {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

export interface MapInsertData {
  map_type?: string | null;
  map_geometry?: unknown;
  map_hide_pin?: boolean;
  map_screenshot?: string | null;
  map_center?: string;
  map_data?: unknown;
}

export interface PostInsertData {
  account_id: string;
  title?: string | null;
  content: string;
  visibility: 'public' | 'draft';
  type: 'simple';
  media?: unknown;
  map_type?: string | null;
  map_geometry?: unknown;
  map_hide_pin?: boolean;
  map_screenshot?: string | null;
  map_center?: string;
  map_data?: unknown;
}

export interface PostUpdateData {
  title?: string | null;
  content?: string;
  visibility?: 'public' | 'draft';
  media?: unknown;
  map_type?: string | null;
  map_geometry?: unknown;
  map_hide_pin?: boolean;
  map_screenshot?: string | null;
  map_center?: string;
  map_data?: unknown;
}

export interface MapUpdateData {
  map_type?: string | null;
  map_geometry?: unknown;
  map_center?: string | null;
  map_hide_pin?: boolean;
  map_screenshot?: string | null;
  map_data?: unknown;
}

export interface ViewData {
  post_id: string;
  ip_address: string;
}
