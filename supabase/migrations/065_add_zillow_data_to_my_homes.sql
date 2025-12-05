-- Add zillow_data JSONB field to my_homes table
-- This field stores the raw response from Zillow API

-- ============================================================================
-- STEP 1: Add zillow_data column
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS zillow_data JSONB;

-- ============================================================================
-- STEP 2: Add comment
-- ============================================================================

COMMENT ON COLUMN public.my_homes.zillow_data IS 'Raw JSON response from Zillow API propertyByCoordinates endpoint';


