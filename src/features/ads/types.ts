export type AdStatus = 'draft' | 'active' | 'paused' | 'expired';
export type AdPlacement = 'article_left' | 'article_right' | 'article_both';

export interface Ad {
  id: string;
  created_by: string;
  business_id: string | null;
  image_url: string;
  link_url: string;
  headline: string;
  description: string | null;
  placement: AdPlacement;
  target_article_slug: string | null;
  status: AdStatus;
  start_date: string | null;
  end_date: string | null;
  impression_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
  current_user_is_owner?: boolean;
}

export interface CreateAdData {
  business_id?: string | null;
  image_url: string;
  link_url: string;
  headline: string;
  description?: string | null;
  placement: AdPlacement;
  target_article_slug?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: AdStatus;
}

export interface UpdateAdData {
  image_url?: string;
  link_url?: string;
  headline?: string;
  description?: string | null;
  placement?: AdPlacement;
  target_article_slug?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: AdStatus;
}

export interface AdAnalytics {
  impression_count: number;
  click_count: number;
  click_through_rate: number;
}

