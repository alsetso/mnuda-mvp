export interface MarketplaceListing {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  listing_type: 'physical' | 'digital';
  price: number;
  is_free: boolean;
  status: 'active' | 'sold' | 'expired' | 'draft';
  image_urls: string[];
  pin_id: string | null;
  visit_count: number;
  created_at: string;
  updated_at: string;
  current_user_is_owner?: boolean;
  pin?: {
    id: string;
    name: string;
    address: string;
    lat: number;
    long: number;
  } | null;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateListingData {
  title: string;
  description?: string | null;
  listing_type: 'physical' | 'digital';
  price: number;
  is_free: boolean;
  image_urls?: string[];
  pin_id?: string | null;
  status?: 'active' | 'sold' | 'expired' | 'draft';
}

export interface UpdateListingData {
  title?: string;
  description?: string | null;
  listing_type?: 'physical' | 'digital';
  price?: number;
  is_free?: boolean;
  image_urls?: string[];
  pin_id?: string | null;
  status?: 'active' | 'sold' | 'expired' | 'draft';
}

