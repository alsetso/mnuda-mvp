-- Create ads system for article page placements
-- MVP: All ads are free. Billing can be added later via migration if needed.

CREATE TYPE public.ad_status AS ENUM ('draft', 'active', 'paused', 'expired');
CREATE TYPE public.ad_placement AS ENUM ('article_left', 'article_right', 'article_both');

CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ad content
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL CHECK (link_url ~ '^https?://'),
  headline TEXT NOT NULL CHECK (char_length(headline) >= 3 AND char_length(headline) <= 100),
  description TEXT CHECK (char_length(description) <= 300),
  
  -- Placement and targeting
  placement public.ad_placement NOT NULL DEFAULT 'article_right'::public.ad_placement,
  target_article_slug TEXT, -- NULL means all articles, specific slug targets one article
  
  -- Status and scheduling
  status public.ad_status NOT NULL DEFAULT 'draft'::public.ad_status,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  impression_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to members table for PostgREST joins
ALTER TABLE public.ads
ADD CONSTRAINT ads_created_by_members_fk 
FOREIGN KEY (created_by) REFERENCES public.members(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ads_created_by ON public.ads(created_by);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_placement ON public.ads(placement);
CREATE INDEX IF NOT EXISTS idx_ads_target_article_slug ON public.ads(target_article_slug) WHERE target_article_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ads_start_date ON public.ads(start_date);
CREATE INDEX IF NOT EXISTS idx_ads_end_date ON public.ads(end_date);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.ads(created_at DESC);

-- Composite index for active ads query
CREATE INDEX IF NOT EXISTS idx_ads_active_placement ON public.ads(status, placement, start_date, end_date) 
WHERE status = 'active'::public.ad_status;

-- Trigger to update updated_at
CREATE TRIGGER update_ads_updated_at 
    BEFORE UPDATE ON public.ads 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Ads
-- Users can view their own ads
CREATE POLICY "Users can view their own ads"
  ON public.ads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Public can view active ads (for carousel display)
CREATE POLICY "Public can view active ads"
  ON public.ads
  FOR SELECT
  TO anon
  USING (
    status = 'active'::public.ad_status 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Authenticated users can view active ads
CREATE POLICY "Authenticated users can view active ads"
  ON public.ads
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'::public.ad_status 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Users can create their own ads
CREATE POLICY "Users can create their own ads"
  ON public.ads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own ads
CREATE POLICY "Users can update their own ads"
  ON public.ads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own ads
CREATE POLICY "Users can delete their own ads"
  ON public.ads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Grant SELECT to anon for public viewing
GRANT SELECT ON public.ads TO anon;

-- Function to increment impression count
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.ads
  SET impression_count = impression_count + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment click count
CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.ads
  SET click_count = click_count + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

