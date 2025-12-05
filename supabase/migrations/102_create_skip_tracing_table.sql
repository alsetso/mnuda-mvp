-- Create skip_tracing table extending from profile_id
-- Stores skip trace API results associated with user profiles

-- ============================================================================
-- STEP 1: Create skip_tracing table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.skip_tracing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and profile references
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- API search details
  api_type TEXT NOT NULL CHECK (api_type IN ('name', 'address', 'phone', 'email')),
  search_query TEXT NOT NULL,
  call_type TEXT,  -- Type of call: 'pinDrop', 'manual', 'api', etc.
  source TEXT,  -- Source of the API call: 'skip-trace-page', 'map-page', 'api', etc.
  
  -- Location data (for pin drops)
  latitude NUMERIC(10, 8),  -- Latitude of pin drop location
  longitude NUMERIC(11, 8),  -- Longitude of pin drop location
  address_street TEXT,  -- Street address
  address_city TEXT,  -- City
  address_state TEXT,  -- State
  address_zip TEXT,  -- ZIP code
  address_full TEXT,  -- Full formatted address
  
  -- Response data
  developer_data JSONB,  -- Parsed structured data from response
  raw_response JSONB NOT NULL,  -- Full raw API response
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_skip_tracing_user_id ON public.skip_tracing(user_id);
CREATE INDEX idx_skip_tracing_profile_id ON public.skip_tracing(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_skip_tracing_api_type ON public.skip_tracing(api_type);
CREATE INDEX idx_skip_tracing_call_type ON public.skip_tracing(call_type) WHERE call_type IS NOT NULL;
CREATE INDEX idx_skip_tracing_source ON public.skip_tracing(source) WHERE source IS NOT NULL;
CREATE INDEX idx_skip_tracing_created_at ON public.skip_tracing(created_at DESC);
CREATE INDEX idx_skip_tracing_user_profile_created ON public.skip_tracing(user_id, profile_id, created_at DESC);
CREATE INDEX idx_skip_tracing_location ON public.skip_tracing(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_skip_tracing_updated_at
  BEFORE UPDATE ON public.skip_tracing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.skip_tracing ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Users can view their own skip trace results
CREATE POLICY "Users can view own skip trace results"
  ON public.skip_tracing
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own skip trace results
CREATE POLICY "Users can insert own skip trace results"
  ON public.skip_tracing
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own skip trace results
CREATE POLICY "Users can update own skip trace results"
  ON public.skip_tracing
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own skip trace results
CREATE POLICY "Users can delete own skip trace results"
  ON public.skip_tracing
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all skip trace results
CREATE POLICY "Admins can view all skip trace results"
  ON public.skip_tracing
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skip_tracing TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.skip_tracing IS 'Skip trace API results stored per user and profile';
COMMENT ON COLUMN public.skip_tracing.id IS 'Unique skip trace result ID';
COMMENT ON COLUMN public.skip_tracing.user_id IS 'References auth.users.id - the user who performed the search';
COMMENT ON COLUMN public.skip_tracing.profile_id IS 'References profiles.id - the profile associated with this search (optional)';
COMMENT ON COLUMN public.skip_tracing.api_type IS 'Type of skip trace search: name, address, phone, or email';
COMMENT ON COLUMN public.skip_tracing.search_query IS 'The search query used (address string, name, phone, email)';
COMMENT ON COLUMN public.skip_tracing.call_type IS 'Type of call: pinDrop, manual, api, etc.';
COMMENT ON COLUMN public.skip_tracing.source IS 'Source of the API call: skip-trace-page, map-page, api, etc.';
COMMENT ON COLUMN public.skip_tracing.latitude IS 'Latitude of pin drop location (if applicable)';
COMMENT ON COLUMN public.skip_tracing.longitude IS 'Longitude of pin drop location (if applicable)';
COMMENT ON COLUMN public.skip_tracing.address_street IS 'Street address from pin drop';
COMMENT ON COLUMN public.skip_tracing.address_city IS 'City from pin drop';
COMMENT ON COLUMN public.skip_tracing.address_state IS 'State from pin drop';
COMMENT ON COLUMN public.skip_tracing.address_zip IS 'ZIP code from pin drop';
COMMENT ON COLUMN public.skip_tracing.address_full IS 'Full formatted address from pin drop';
COMMENT ON COLUMN public.skip_tracing.developer_data IS 'Parsed structured data extracted from the raw response';
COMMENT ON COLUMN public.skip_tracing.raw_response IS 'Full raw JSON response from the skip trace API';
COMMENT ON COLUMN public.skip_tracing.created_at IS 'When the skip trace search was performed';
COMMENT ON COLUMN public.skip_tracing.updated_at IS 'Last update timestamp (auto-updated)';

