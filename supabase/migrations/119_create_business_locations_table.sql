-- Create business_locations table for storing multiple locations per business
-- Businesses can have multiple locations, each with coordinates, address, and city reference

-- ============================================================================
-- STEP 1: Create business_locations table
-- ============================================================================

CREATE TABLE public.business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  
  -- Location data
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  
  -- Optional metadata
  name TEXT, -- e.g., "Downtown Location", "Main Office"
  phone TEXT, -- Location-specific phone if different from business
  hours TEXT, -- Location-specific hours if different from business
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX business_locations_business_id_idx
  ON public.business_locations (business_id);

CREATE INDEX business_locations_city_id_idx
  ON public.business_locations (city_id) WHERE city_id IS NOT NULL;

CREATE INDEX business_locations_lat_lng_idx
  ON public.business_locations (lat, lng);

-- ============================================================================
-- STEP 3: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_business_locations_updated_at
  BEFORE UPDATE ON public.business_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable RLS
-- ============================================================================

ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Users can view locations for their own businesses (via account ownership)
CREATE POLICY "Users can view own business locations"
  ON public.business_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_locations.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Public can view all business locations (for public directory)
CREATE POLICY "Public can view all business locations"
  ON public.business_locations
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can insert locations for their own businesses
CREATE POLICY "Users can insert own business locations"
  ON public.business_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_locations.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can update locations for their own businesses
CREATE POLICY "Users can update own business locations"
  ON public.business_locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_locations.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_locations.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can delete locations for their own businesses
CREATE POLICY "Users can delete own business locations"
  ON public.business_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_locations.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all locations
CREATE POLICY "Admins can view all business locations"
  ON public.business_locations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all locations
CREATE POLICY "Admins can update all business locations"
  ON public.business_locations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert locations
CREATE POLICY "Admins can insert business locations"
  ON public.business_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete all locations
CREATE POLICY "Admins can delete all business locations"
  ON public.business_locations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.business_locations TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.business_locations TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.business_locations IS 'Multiple locations per business - allows businesses to have locations in different cities';
COMMENT ON COLUMN public.business_locations.business_id IS 'References businesses.id - the business this location belongs to';
COMMENT ON COLUMN public.business_locations.city_id IS 'References cities.id - the city where this location is';
COMMENT ON COLUMN public.business_locations.address IS 'Full address of this location';
COMMENT ON COLUMN public.business_locations.lat IS 'Latitude coordinate of this location';
COMMENT ON COLUMN public.business_locations.lng IS 'Longitude coordinate of this location';
COMMENT ON COLUMN public.business_locations.name IS 'Optional location name (e.g., "Downtown Location", "Main Office")';
COMMENT ON COLUMN public.business_locations.phone IS 'Optional location-specific phone number';
COMMENT ON COLUMN public.business_locations.hours IS 'Optional location-specific business hours';



