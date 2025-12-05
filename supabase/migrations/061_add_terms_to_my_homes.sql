-- Add signing_name and tos_agreement to my_homes table
-- These fields track who signed the terms and when

-- ============================================================================
-- STEP 1: Add signing_name column
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS signing_name TEXT;

-- ============================================================================
-- STEP 2: Add tos_agreement column (timestamp when terms were agreed to)
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS tos_agreement TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON COLUMN public.my_homes.signing_name IS 'Name of the person who agreed to the terms of service for this property';
COMMENT ON COLUMN public.my_homes.tos_agreement IS 'Timestamp when the terms of service were agreed to for this property';


