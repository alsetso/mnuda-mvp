-- Add lat/lng coordinates to cities table for pin placement
-- Add polygon column to counties table for boundary visualization

-- ============================================================================
-- STEP 1: Add lat and lng columns to cities table
-- ============================================================================

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(11, 8);

-- Create indexes for lat/lng
CREATE INDEX IF NOT EXISTS idx_cities_lat_lng ON public.cities(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.cities.lat IS 'Latitude coordinate for city pin placement on map';
COMMENT ON COLUMN public.cities.lng IS 'Longitude coordinate for city pin placement on map';

-- ============================================================================
-- STEP 2: Add polygon column to counties table
-- ============================================================================

ALTER TABLE public.counties
  ADD COLUMN IF NOT EXISTS polygon JSONB;

-- Create GIN index for polygon JSONB queries
CREATE INDEX IF NOT EXISTS idx_counties_polygon ON public.counties USING GIN (polygon) WHERE polygon IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.counties.polygon IS 'GeoJSON polygon or MultiPolygon geometry for county boundaries. Format: {"type": "Polygon", "coordinates": [[[lng, lat], ...]]}';

