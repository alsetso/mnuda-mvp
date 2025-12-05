-- Create lakes table with name, coordinates (lat/lng), and polygon
-- Similar structure to cities (coordinates) and counties (polygon)

-- ============================================================================
-- STEP 1: Create lakes table
-- ============================================================================

CREATE TABLE public.lakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  polygon JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_lakes_name ON public.lakes(name);
CREATE INDEX idx_lakes_lat_lng ON public.lakes(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_lakes_polygon ON public.lakes USING GIN (polygon) WHERE polygon IS NOT NULL;

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_lakes_updated_at 
  BEFORE UPDATE ON public.lakes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.lakes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Everyone can view lakes (public reference data)
CREATE POLICY "Anyone can view lakes"
  ON public.lakes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can modify lakes
CREATE POLICY "Admins can insert lakes"
  ON public.lakes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lakes"
  ON public.lakes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete lakes"
  ON public.lakes
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.lakes TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.lakes TO authenticated;
GRANT ALL ON public.lakes TO service_role;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.lakes IS 'Standalone reference table for Minnesota lakes with coordinates and polygon boundaries';
COMMENT ON COLUMN public.lakes.id IS 'Unique lake ID (UUID)';
COMMENT ON COLUMN public.lakes.name IS 'Lake name';
COMMENT ON COLUMN public.lakes.lat IS 'Latitude coordinate for lake center point';
COMMENT ON COLUMN public.lakes.lng IS 'Longitude coordinate for lake center point';
COMMENT ON COLUMN public.lakes.polygon IS 'GeoJSON polygon or MultiPolygon geometry for lake boundaries. Format: {"type": "Polygon", "coordinates": [[[lng, lat], ...]]}';



