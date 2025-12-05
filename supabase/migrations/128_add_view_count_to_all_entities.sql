-- Add view_count to cities, counties, and businesses
-- Use direct columns instead of polymorphic table for better performance and integrity

-- ============================================================================
-- STEP 1: Add view_count to cities
-- ============================================================================

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.cities
  ADD CONSTRAINT cities_view_count_non_negative CHECK (view_count >= 0);

CREATE INDEX IF NOT EXISTS cities_view_count_idx
  ON public.cities (view_count DESC)
  WHERE view_count > 0;

-- ============================================================================
-- STEP 2: Add view_count to counties
-- ============================================================================

ALTER TABLE public.counties
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.counties
  ADD CONSTRAINT counties_view_count_non_negative CHECK (view_count >= 0);

CREATE INDEX IF NOT EXISTS counties_view_count_idx
  ON public.counties (view_count DESC)
  WHERE view_count > 0;

-- ============================================================================
-- STEP 3: Add view_count to businesses
-- ============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_view_count_non_negative CHECK (view_count >= 0);

CREATE INDEX IF NOT EXISTS businesses_view_count_idx
  ON public.businesses (view_count DESC)
  WHERE view_count > 0;

-- ============================================================================
-- STEP 4: Create generic increment function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_view_count(
  p_table_name TEXT,
  p_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
  v_sql TEXT;
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('posts', 'articles', 'cities', 'counties', 'accounts', 'businesses') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
  -- Build dynamic SQL
  v_sql := format(
    'UPDATE public.%I SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
    p_table_name
  );
  
  -- Execute and return new count
  EXECUTE v_sql USING p_id INTO v_view_count;
  
  RETURN v_view_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create function for slug-based entities
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_view_count_by_slug(
  p_table_name TEXT,
  p_slug TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
  v_sql TEXT;
BEGIN
  -- Validate table name
  IF p_table_name NOT IN ('posts', 'articles', 'cities', 'counties') THEN
    RAISE EXCEPTION 'Invalid table name for slug lookup: %', p_table_name;
  END IF;
  
  -- Build dynamic SQL (posts and articles use slug, cities/counties use slug if exists)
  IF p_table_name IN ('posts', 'articles') THEN
    v_sql := format(
      'UPDATE public.%I SET view_count = view_count + 1 WHERE slug = $1 RETURNING view_count',
      p_table_name
    );
  ELSIF p_table_name = 'cities' THEN
    -- Cities might use slug or name, check if slug column exists
    v_sql := format(
      'UPDATE public.%I SET view_count = view_count + 1 WHERE slug = $1 OR name = $1 RETURNING view_count',
      p_table_name
    );
  ELSIF p_table_name = 'counties' THEN
    v_sql := format(
      'UPDATE public.%I SET view_count = view_count + 1 WHERE slug = $1 OR name = $1 RETURNING view_count',
      p_table_name
    );
  END IF;
  
  EXECUTE v_sql USING p_slug INTO v_view_count;
  
  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN public.cities.view_count IS 'Total number of page views for this city';
COMMENT ON COLUMN public.counties.view_count IS 'Total number of page views for this county';
COMMENT ON COLUMN public.businesses.view_count IS 'Total number of page views for this business';

COMMENT ON FUNCTION public.increment_view_count IS
  'Atomically increments view_count for a table by UUID. Supports: posts, articles, cities, counties, accounts, businesses.';

COMMENT ON FUNCTION public.increment_view_count_by_slug IS
  'Atomically increments view_count for a table by slug/name. Supports: posts, articles, cities, counties.';



