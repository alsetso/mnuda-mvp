-- Create simplified location_searches table
-- Simple, straightforward tracking of location searches on map/my-homes pages
-- Stores minimal essential data: user, profile, location name, coordinates, and full mapbox data

-- ============================================================================
-- STEP 1: Drop old search_history table if it exists
-- ============================================================================

DROP TABLE IF EXISTS public.search_history CASCADE;

-- ============================================================================
-- STEP 2: Create new simplified location_searches table
-- ============================================================================

CREATE TABLE public.location_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User/Profile references (profile is optional - can be null)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Location essentials
  place_name TEXT NOT NULL,
  lat NUMERIC(10, 8) NOT NULL,
  lng NUMERIC(11, 8) NOT NULL,
  
  -- Full Mapbox feature data (contains all address components, context, etc.)
  mapbox_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Search context
  search_query TEXT, -- Original search query text
  page_source TEXT, -- 'map' or 'my-homes'
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_location_searches_user_id ON public.location_searches(user_id);
CREATE INDEX idx_location_searches_profile_id ON public.location_searches(profile_id);
CREATE INDEX idx_location_searches_created_at ON public.location_searches(created_at DESC);
CREATE INDEX idx_location_searches_user_profile_created ON public.location_searches(user_id, profile_id, created_at DESC);

-- ============================================================================
-- STEP 4: Enable RLS
-- ============================================================================

ALTER TABLE public.location_searches ENABLE ROW LEVEL SECURITY;

-- Simple policy: Users can insert their own searches
CREATE POLICY "Users can insert own location searches"
  ON public.location_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Simple policy: Users can view their own searches
CREATE POLICY "Users can view own location searches"
  ON public.location_searches
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON TABLE public.location_searches IS 'Simple tracking of location searches on map and my-homes pages. Stores place name, coordinates, and full Mapbox feature data.';
COMMENT ON COLUMN public.location_searches.mapbox_data IS 'Complete Mapbox geocoding feature object with all address components, context, and metadata';
COMMENT ON COLUMN public.location_searches.page_source IS 'Page where search originated: map or my-homes';


