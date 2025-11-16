-- Add visit_count columns to groups and marketplace_listings tables
-- Tracks page views for analytics and popularity metrics

-- Add visit_count to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;

-- Add visit_count to marketplace_listings table
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;

-- Create index for sorting by visit count (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_groups_visit_count ON public.groups(visit_count DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_visit_count ON public.marketplace_listings(visit_count DESC);

-- Create RPC functions to increment visit counts atomically
CREATE OR REPLACE FUNCTION public.increment_group_visit_count(group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.groups
  SET visit_count = visit_count + 1
  WHERE id = group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_listing_visit_count(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.marketplace_listings
  SET visit_count = visit_count + 1
  WHERE id = listing_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_group_visit_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_group_visit_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_listing_visit_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_visit_count(UUID) TO anon;

