-- Add skip_trace JSONB field to my_homes table
-- This field stores the raw response from Skip Trace API

-- ============================================================================
-- STEP 1: Add skip_trace column
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS skip_trace JSONB;

-- ============================================================================
-- STEP 2: Add comment
-- ============================================================================

COMMENT ON COLUMN public.my_homes.skip_trace IS 'Raw JSON response from Skip Trace API search/byaddress endpoint';

