-- Create ad_events table for tracking impressions and clicks
-- Tracks which members viewed/clicked ads for analytics

CREATE TYPE public.ad_event_type AS ENUM ('impression', 'click');

CREATE TABLE IF NOT EXISTS public.ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  
  -- Event details
  event_type public.ad_event_type NOT NULL,
  placement public.ad_placement NOT NULL, -- Which side the ad was shown on
  article_slug TEXT, -- Which article the ad was shown on (NULL = all articles)
  
  -- Member tracking
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL, -- NULL for anonymous users
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_events_ad_id ON public.ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_event_type ON public.ad_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_events_member_id ON public.ad_events(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_events_placement ON public.ad_events(placement);
CREATE INDEX IF NOT EXISTS idx_ad_events_article_slug ON public.ad_events(article_slug) WHERE article_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_events_created_at ON public.ad_events(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ad_events_ad_type_created ON public.ad_events(ad_id, event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Ad Events
-- Users can view events for their own ads
CREATE POLICY "Users can view events for their own ads"
  ON public.ad_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ads
      WHERE ads.id = ad_events.ad_id
      AND ads.created_by = auth.uid()
    )
  );

-- Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert ad events"
  ON public.ad_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can insert ad events"
  ON public.ad_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT INSERT ON public.ad_events TO anon;

-- Function to create ad event and update counters
CREATE OR REPLACE FUNCTION public.track_ad_event(
  p_ad_id UUID,
  p_event_type public.ad_event_type,
  p_placement public.ad_placement,
  p_article_slug TEXT,
  p_member_id UUID
)
RETURNS void AS $$
BEGIN
  -- Insert event
  INSERT INTO public.ad_events (
    ad_id,
    event_type,
    placement,
    article_slug,
    member_id
  ) VALUES (
    p_ad_id,
    p_event_type,
    p_placement,
    p_article_slug,
    p_member_id
  );
  
  -- Update counter on ads table
  IF p_event_type = 'impression' THEN
    UPDATE public.ads
    SET impression_count = impression_count + 1
    WHERE id = p_ad_id;
  ELSIF p_event_type = 'click' THEN
    UPDATE public.ads
    SET click_count = click_count + 1
    WHERE id = p_ad_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.track_ad_event(UUID, public.ad_event_type, public.ad_placement, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_ad_event(UUID, public.ad_event_type, public.ad_placement, TEXT, UUID) TO anon;

