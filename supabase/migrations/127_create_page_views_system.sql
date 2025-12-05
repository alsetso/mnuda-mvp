-- Create global page views/analytics system
-- Supports tracking views for posts, articles, cities, counties, profiles, accounts

-- ============================================================================
-- STEP 1: Create entity_type enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.page_entity_type AS ENUM (
    'post',
    'article',
    'city',
    'county',
    'profile',
    'account',
    'business',
    'page'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create page_views table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity identification (polymorphic)
  entity_type public.page_entity_type NOT NULL,
  entity_id UUID, -- For UUID-based entities (accounts, businesses, etc.)
  entity_slug TEXT, -- For slug-based entities (posts, articles, cities, counties, profiles)
  
  -- View tracking
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0, -- Count of unique visitors (optional, requires user tracking)
  
  -- Timestamps
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT page_views_entity_check CHECK (
    (entity_id IS NOT NULL) OR (entity_slug IS NOT NULL)
  ),
  CONSTRAINT page_views_view_count_non_negative CHECK (view_count >= 0),
  CONSTRAINT page_views_unique_views_non_negative CHECK (unique_views >= 0),
  CONSTRAINT page_views_unique_entity UNIQUE (entity_type, COALESCE(entity_id::text, ''), COALESCE(entity_slug, ''))
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS page_views_entity_type_id_idx
  ON public.page_views (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS page_views_entity_type_slug_idx
  ON public.page_views (entity_type, entity_slug)
  WHERE entity_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS page_views_view_count_idx
  ON public.page_views (view_count DESC)
  WHERE view_count > 0;

CREATE INDEX IF NOT EXISTS page_views_last_viewed_at_idx
  ON public.page_views (last_viewed_at DESC)
  WHERE last_viewed_at IS NOT NULL;

-- ============================================================================
-- STEP 4: Create function to increment page view atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_page_view(
  p_entity_type public.page_entity_type,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
BEGIN
  -- Insert or update page view record
  INSERT INTO public.page_views (
    entity_type,
    entity_id,
    entity_slug,
    view_count,
    first_viewed_at,
    last_viewed_at
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_entity_slug,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (entity_type, COALESCE(entity_id::text, ''), COALESCE(entity_slug, ''))
  DO UPDATE SET
    view_count = page_views.view_count + 1,
    last_viewed_at = NOW(),
    updated_at = NOW()
  RETURNING view_count INTO v_view_count;
  
  RETURN v_view_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create function to get or create page view record
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_page_view(
  p_entity_type public.page_entity_type,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  view_count INTEGER,
  unique_views INTEGER,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.view_count,
    pv.unique_views,
    pv.first_viewed_at,
    pv.last_viewed_at
  FROM public.page_views pv
  WHERE pv.entity_type = p_entity_type
    AND (
      (p_entity_id IS NOT NULL AND pv.entity_id = p_entity_id) OR
      (p_entity_slug IS NOT NULL AND pv.entity_slug = p_entity_slug)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_page_views_updated_at
  BEFORE UPDATE ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.page_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_page_view TO anon, authenticated;

-- ============================================================================
-- STEP 8: Add RLS policies
-- ============================================================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can read page views (public analytics)
CREATE POLICY "page_views_select"
  ON public.page_views FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert/update page views (for tracking)
CREATE POLICY "page_views_insert"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "page_views_update"
  ON public.page_views FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================

COMMENT ON TABLE public.page_views IS
  'Global page views/analytics system. Tracks views for posts, articles, cities, counties, profiles, accounts, and pages.';

COMMENT ON COLUMN public.page_views.entity_type IS
  'Type of entity being viewed: post, article, city, county, profile, account, business, or page';

COMMENT ON COLUMN public.page_views.entity_id IS
  'UUID of the entity (for accounts, businesses)';

COMMENT ON COLUMN public.page_views.entity_slug IS
  'Slug/identifier of the entity (for posts, articles, cities, counties, profiles)';

COMMENT ON COLUMN public.page_views.view_count IS
  'Total number of views for this entity';

COMMENT ON COLUMN public.page_views.unique_views IS
  'Number of unique visitors (optional, requires additional tracking)';

COMMENT ON FUNCTION public.increment_page_view IS
  'Atomically increments view count for an entity. Creates record if it does not exist. Returns new view count.';

COMMENT ON FUNCTION public.get_page_view IS
  'Gets view statistics for an entity. Returns view_count, unique_views, first_viewed_at, and last_viewed_at.';

-- ============================================================================
-- STEP 10: Create trigger to sync account view_count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_account_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a profile/account page view is updated, sync to accounts.view_count
  IF NEW.entity_type = 'account' AND NEW.entity_id IS NOT NULL THEN
    UPDATE public.accounts
    SET view_count = NEW.view_count
    WHERE id = NEW.entity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_account_view_count_trigger
  AFTER INSERT OR UPDATE ON public.page_views
  FOR EACH ROW
  WHEN (NEW.entity_type = 'account' AND NEW.entity_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_account_view_count();

