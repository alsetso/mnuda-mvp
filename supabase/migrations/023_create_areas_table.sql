-- Create areas table for storing user-drawn geographic areas
-- Areas can be polygons or multipolygons with visibility settings

-- ============================================================================
-- STEP 1: Create areas table
-- ============================================================================

CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  category TEXT NOT NULL CHECK (category IN ('custom', 'county', 'city', 'state', 'region', 'zipcode')) DEFAULT 'custom',
  geometry JSONB NOT NULL, -- GeoJSON Polygon or MultiPolygon
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_areas_profile_id ON public.areas(profile_id);
CREATE INDEX idx_areas_visibility ON public.areas(visibility);
CREATE INDEX idx_areas_category ON public.areas(category);
CREATE INDEX idx_areas_created_at ON public.areas(created_at);

-- Create GIN index for geometry queries
CREATE INDEX idx_areas_geometry ON public.areas USING GIN (geometry);

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_areas_updated_at 
  BEFORE UPDATE ON public.areas 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Users can view public areas or their own areas (via profile ownership)
CREATE POLICY "Users can view public areas or own areas"
  ON public.areas
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Anonymous users can view public areas
CREATE POLICY "Anonymous can view public areas"
  ON public.areas
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Users can insert their own areas (via profile ownership)
CREATE POLICY "Users can insert own areas"
  ON public.areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can update their own areas (via profile ownership)
CREATE POLICY "Users can update own areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own areas (via profile ownership)
CREATE POLICY "Users can delete own areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all areas
CREATE POLICY "Admins can view all areas"
  ON public.areas
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all areas
CREATE POLICY "Admins can update all areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete all areas
CREATE POLICY "Admins can delete all areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT SELECT ON public.areas TO anon;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.areas IS 'User-drawn geographic areas (polygons/multipolygons) for map visualization';
COMMENT ON COLUMN public.areas.id IS 'Unique area ID (UUID)';
COMMENT ON COLUMN public.areas.profile_id IS 'References profiles.id - the profile that created this area';
COMMENT ON COLUMN public.areas.name IS 'Name of the area';
COMMENT ON COLUMN public.areas.description IS 'Optional description of the area';
COMMENT ON COLUMN public.areas.visibility IS 'Visibility setting: public (visible to all) or private (only creator)';
COMMENT ON COLUMN public.areas.category IS 'Category: custom, county, city, state, region, or zipcode';
COMMENT ON COLUMN public.areas.geometry IS 'GeoJSON geometry (Polygon or MultiPolygon)';
COMMENT ON COLUMN public.areas.created_at IS 'Area creation timestamp';
COMMENT ON COLUMN public.areas.updated_at IS 'Last update timestamp (auto-updated)';
