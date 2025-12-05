-- Create businesses table for storing business information at the account level
-- Businesses can be created and managed by accounts

-- ============================================================================
-- STEP 1: Create businesses table
-- ============================================================================

CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Business information
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  email TEXT,
  phone TEXT,
  industry TEXT,
  hours TEXT,
  service_areas UUID[] DEFAULT '{}', -- Array of city IDs referencing cities table
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX businesses_account_id_idx
  ON public.businesses (account_id);

CREATE INDEX businesses_name_idx
  ON public.businesses (name) WHERE name IS NOT NULL;

CREATE INDEX businesses_industry_idx
  ON public.businesses (industry) WHERE industry IS NOT NULL;

CREATE INDEX businesses_lat_lng_idx
  ON public.businesses (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX businesses_service_areas_idx
  ON public.businesses USING GIN (service_areas)
  WHERE service_areas IS NOT NULL AND array_length(service_areas, 1) > 0;

-- ============================================================================
-- STEP 3: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable RLS
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Users can view their own businesses (via account ownership)
CREATE POLICY "Users can view own businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can insert their own businesses
CREATE POLICY "Users can insert own businesses"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can update their own businesses
CREATE POLICY "Users can update own businesses"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can delete their own businesses
CREATE POLICY "Users can delete own businesses"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Public can view all businesses (for public directory)
CREATE POLICY "Public can view all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admins can view all businesses
CREATE POLICY "Admins can view all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all businesses
CREATE POLICY "Admins can update all businesses"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert businesses
CREATE POLICY "Admins can insert businesses"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete all businesses
CREATE POLICY "Admins can delete all businesses"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.businesses TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.businesses IS 'Businesses managed at the account level - can be created and managed by accounts';
COMMENT ON COLUMN public.businesses.account_id IS 'References accounts.id - the account that owns this business';
COMMENT ON COLUMN public.businesses.name IS 'Business name';
COMMENT ON COLUMN public.businesses.type IS 'Type of business';
COMMENT ON COLUMN public.businesses.address IS 'Full business address';
COMMENT ON COLUMN public.businesses.lat IS 'Business latitude coordinate';
COMMENT ON COLUMN public.businesses.lng IS 'Business longitude coordinate';
COMMENT ON COLUMN public.businesses.email IS 'Business email address';
COMMENT ON COLUMN public.businesses.phone IS 'Business phone number';
COMMENT ON COLUMN public.businesses.industry IS 'Business industry';
COMMENT ON COLUMN public.businesses.hours IS 'Business hours (stored as text)';
COMMENT ON COLUMN public.businesses.service_areas IS 'Array of city UUIDs (references cities.id) where the business provides services';

