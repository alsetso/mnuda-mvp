-- Ensure pins table index uses lng column (migration 046 already added lng)
-- This migration updates the index to use lng instead of long

-- ============================================================================
-- STEP 1: Update index to use lng instead of long
-- ============================================================================

-- Drop old index if it exists on long
DROP INDEX IF EXISTS idx_pins_lat_long;

-- Create index on lat, lng if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pins_lat_lng ON public.pins(lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

