-- Create my_homes table for storing user's owned homes
-- Separate from pins table - this is specifically for homes owned by users

-- ============================================================================
-- STEP 1: Create my_homes table
-- ============================================================================

CREATE TABLE public.my_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Location data
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  
  -- Optional metadata
  nickname TEXT,  -- e.g., "Main House", "Rental Property 1"
  notes TEXT,      -- User notes about this home
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX my_homes_profile_id_idx
  ON public.my_homes (profile_id);

-- Note: If PostGIS is available, you can create a spatial index:
-- CREATE INDEX my_homes_location_idx
--   ON public.my_homes USING GIST (
--     ST_MakePoint(lng, lat)
--   );
-- For now, we'll use a regular index on lat/lng
CREATE INDEX my_homes_lat_lng_idx
  ON public.my_homes (lat, lng);

-- ============================================================================
-- STEP 3: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_my_homes_updated_at
  BEFORE UPDATE ON public.my_homes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable RLS
-- ============================================================================

ALTER TABLE public.my_homes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Users can view their own homes (via profile)
CREATE POLICY "Users can view own homes"
  ON public.my_homes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert their own homes
CREATE POLICY "Users can insert own homes"
  ON public.my_homes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own homes
CREATE POLICY "Users can update own homes"
  ON public.my_homes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete their own homes
CREATE POLICY "Users can delete own homes"
  ON public.my_homes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all homes
CREATE POLICY "Admins can view all homes"
  ON public.my_homes
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
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_homes TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.my_homes IS 'Homes owned by users - separate from pins table';
COMMENT ON COLUMN public.my_homes.profile_id IS 'References profiles.id - the profile that owns this home';
COMMENT ON COLUMN public.my_homes.address IS 'Full address of the home';
COMMENT ON COLUMN public.my_homes.lat IS 'Latitude coordinate';
COMMENT ON COLUMN public.my_homes.lng IS 'Longitude coordinate';
COMMENT ON COLUMN public.my_homes.nickname IS 'Optional nickname for the home (e.g., "Main House")';
COMMENT ON COLUMN public.my_homes.notes IS 'Optional notes about this home';

