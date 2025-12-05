-- Add polygon column to my_homes table for property boundary drawing
-- This allows users to draw the perimeter around each property they own

-- ============================================================================
-- STEP 1: Add polygon column
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS polygon JSONB;

-- ============================================================================
-- STEP 2: Create GIN index for polygon queries (if needed for spatial queries)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_my_homes_polygon 
ON public.my_homes USING GIN (polygon);

-- ============================================================================
-- STEP 3: Add comment
-- ============================================================================

COMMENT ON COLUMN public.my_homes.polygon IS 'GeoJSON Polygon or MultiPolygon representing the property boundary/perimeter drawn by the user';


