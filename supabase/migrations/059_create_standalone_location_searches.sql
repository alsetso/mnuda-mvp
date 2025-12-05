-- Create standalone location_searches table with working RLS
-- This is a completely independent table for tracking location searches

-- ============================================================================
-- STEP 1: Drop existing table if it exists (clean slate)
-- ============================================================================

DROP TABLE IF EXISTS public.location_searches CASCADE;

-- ============================================================================
-- STEP 2: Create standalone location_searches table
-- ============================================================================

CREATE TABLE public.location_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (required) - references auth.users(id) but no FK constraint
  user_id UUID NOT NULL,
  
  -- Profile reference (optional) - references profiles(id) but no FK constraint
  profile_id UUID,
  
  -- Location data
  place_name TEXT NOT NULL,
  lat NUMERIC(10, 8) NOT NULL,
  lng NUMERIC(11, 8) NOT NULL,
  
  -- Full Mapbox feature data
  mapbox_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Search context
  search_query TEXT,
  page_source TEXT DEFAULT 'map',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_location_searches_user_id ON public.location_searches(user_id);
CREATE INDEX idx_location_searches_profile_id ON public.location_searches(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_location_searches_created_at ON public.location_searches(created_at DESC);
CREATE INDEX idx_location_searches_user_created ON public.location_searches(user_id, created_at DESC);

-- ============================================================================
-- STEP 4: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.location_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own searches
-- Simple check: user_id must match auth.uid()
CREATE POLICY "authenticated_users_insert_own_searches"
  ON public.location_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Authenticated users can view their own searches
CREATE POLICY "authenticated_users_view_own_searches"
  ON public.location_searches
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

-- Grant table-level permissions to authenticated role
GRANT SELECT, INSERT ON public.location_searches TO authenticated;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON TABLE public.location_searches IS 
  'Standalone table for tracking location searches on map and my-homes pages. Stores place name, coordinates, and full Mapbox feature data.';

COMMENT ON COLUMN public.location_searches.user_id IS 
  'References auth.users(id). Required for all searches.';

COMMENT ON COLUMN public.location_searches.profile_id IS 
  'References profiles(id). Optional - can be null if user has no active profile.';

COMMENT ON COLUMN public.location_searches.mapbox_data IS 
  'Complete Mapbox geocoding feature object with all address components, context, and metadata stored as JSONB.';

COMMENT ON COLUMN public.location_searches.page_source IS 
  'Page where search originated: "map" or "my-homes".';

COMMENT ON POLICY "authenticated_users_insert_own_searches" ON public.location_searches IS 
  'Allows any authenticated user to insert location searches. Only requirement is user_id matches auth.uid(). Profile_id is optional.';

COMMENT ON POLICY "authenticated_users_view_own_searches" ON public.location_searches IS 
  'Allows authenticated users to view only their own location searches.';

