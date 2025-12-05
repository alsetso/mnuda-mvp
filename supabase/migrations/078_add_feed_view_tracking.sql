-- Add view count tracking to feed table
-- Track unique views per profile/user

-- ============================================================================
-- STEP 1: Add view_count column to feed table
-- ============================================================================

ALTER TABLE public.feed
  ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- STEP 2: Create feed_views table for unique view tracking
-- ============================================================================

CREATE TABLE public.feed_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.feed(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one view per profile/user per post (for authenticated users)
  -- Allow multiple views from same IP for anonymous users (but still track)
  CONSTRAINT feed_views_profile_unique UNIQUE (feed_id, profile_id),
  CONSTRAINT feed_views_user_unique UNIQUE (feed_id, user_id)
);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX feed_views_feed_id_idx ON public.feed_views(feed_id);
CREATE INDEX feed_views_profile_id_idx ON public.feed_views(profile_id);
CREATE INDEX feed_views_user_id_idx ON public.feed_views(user_id);
CREATE INDEX feed_views_viewed_at_idx ON public.feed_views(viewed_at);

-- ============================================================================
-- STEP 4: Create function to increment view count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_feed_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.feed
  SET view_count = view_count + 1
  WHERE id = NEW.feed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create trigger to auto-increment view count
-- ============================================================================

CREATE TRIGGER increment_feed_view_on_view
  AFTER INSERT ON public.feed_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_feed_view_count();

-- ============================================================================
-- STEP 6: Enable RLS on feed_views
-- ============================================================================

ALTER TABLE public.feed_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own views
CREATE POLICY "Users can view own feed views"
  ON public.feed_views
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

-- Users can insert views for visible posts
CREATE POLICY "Users can track views on visible posts"
  ON public.feed_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_views.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR (
          feed.visibility = 'members_only'::public.feed_visibility
          AND auth.role() = 'authenticated'
        )
      )
    )
    AND (
      -- If profile_id is provided, verify it belongs to the user
      feed_views.profile_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = feed_views.profile_id
        AND EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.id = profiles.account_id
          AND accounts.user_id = auth.uid()
        )
      )
    )
    AND (
      -- If user_id is provided, verify it's the current user
      feed_views.user_id IS NULL
      OR feed_views.user_id = auth.uid()
    )
  );

-- Admins can view all views
CREATE POLICY "Admins can view all feed views"
  ON public.feed_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON COLUMN public.feed.view_count IS 'Total number of unique views for this post';
COMMENT ON TABLE public.feed_views IS 'Tracks unique views per profile/user per feed post';
COMMENT ON FUNCTION public.increment_feed_view_count IS 'Automatically increments feed.view_count when a new view is recorded';

