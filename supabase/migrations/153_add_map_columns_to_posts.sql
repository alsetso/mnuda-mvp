-- Add structured map columns to posts table for map pins, areas, and screenshots
-- This migration adds PostGIS support for spatial queries and proper indexing

-- ============================================================================
-- STEP 1: Enable PostGIS extension if not already enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- STEP 2: Add map-related columns to posts table
-- ============================================================================

-- Map type: 'pin', 'area', or 'both'
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_type VARCHAR(10) 
    CHECK (map_type IS NULL OR map_type IN ('pin', 'area', 'both'));

-- Map geometry: Full GeoJSON geometry (Point, Polygon, or MultiPolygon)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_geometry JSONB;

-- Map center: PostGIS POINT for pin location (for spatial queries)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_center GEOMETRY(POINT, 4326);

-- Map hide pin: Boolean to hide pin marker on map
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_hide_pin BOOLEAN DEFAULT false;

-- Map screenshot: Base64 PNG or URL to cloud storage
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_screenshot TEXT;

-- Map bounds: PostGIS POLYGON for area bounds (for spatial queries)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS map_bounds GEOMETRY(POLYGON, 4326);

-- ============================================================================
-- STEP 3: Create indexes for spatial queries
-- ============================================================================

-- GIST index for map_center (spatial queries for pins)
CREATE INDEX IF NOT EXISTS posts_map_center_idx 
  ON public.posts USING GIST (map_center) 
  WHERE map_center IS NOT NULL;

-- GIST index for map_bounds (spatial queries for areas)
CREATE INDEX IF NOT EXISTS posts_map_bounds_idx 
  ON public.posts USING GIST (map_bounds) 
  WHERE map_bounds IS NOT NULL;

-- Index for map_type (filtering by type)
CREATE INDEX IF NOT EXISTS posts_map_type_idx 
  ON public.posts (map_type) 
  WHERE map_type IS NOT NULL;

-- GIN index for map_geometry (JSONB queries)
CREATE INDEX IF NOT EXISTS posts_map_geometry_idx 
  ON public.posts USING GIN (map_geometry) 
  WHERE map_geometry IS NOT NULL;

-- ============================================================================
-- STEP 4: Create helper function to calculate bounds from geometry
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_map_bounds(geometry_data JSONB)
RETURNS GEOMETRY(POLYGON, 4326)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  geom_type TEXT;
  coords JSONB;
  min_lng NUMERIC := 180;
  max_lng NUMERIC := -180;
  min_lat NUMERIC := 90;
  max_lat NUMERIC := -90;
  coord JSONB;
BEGIN
  IF geometry_data IS NULL THEN
    RETURN NULL;
  END IF;

  geom_type := geometry_data->>'type';
  
  -- Handle Point
  IF geom_type = 'Point' THEN
    coords := geometry_data->'coordinates';
    RETURN ST_MakePoint(
      (coords->>0)::NUMERIC,
      (coords->>1)::NUMERIC
    )::GEOMETRY(POINT, 4326);
  END IF;

  -- Handle Polygon
  IF geom_type = 'Polygon' THEN
    coords := geometry_data->'coordinates'->0; -- First ring
    -- Extract bounding box
    FOR coord IN SELECT * FROM jsonb_array_elements(coords)
    LOOP
      min_lng := LEAST(min_lng, (coord->>0)::NUMERIC);
      max_lng := GREATEST(max_lng, (coord->>0)::NUMERIC);
      min_lat := LEAST(min_lat, (coord->>1)::NUMERIC);
      max_lat := GREATEST(max_lat, (coord->>1)::NUMERIC);
    END LOOP;
    
    -- Create bounding box polygon
    RETURN ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);
  END IF;

  -- Handle MultiPolygon
  IF geom_type = 'MultiPolygon' THEN
    -- For MultiPolygon, calculate bounds from all polygons
    FOR coord IN SELECT * FROM jsonb_array_elements(geometry_data->'coordinates')
    LOOP
      FOR coord IN SELECT * FROM jsonb_array_elements(coord->0) -- First ring of each polygon
      LOOP
        min_lng := LEAST(min_lng, (coord->>0)::NUMERIC);
        max_lng := GREATEST(max_lng, (coord->>0)::NUMERIC);
        min_lat := LEAST(min_lat, (coord->>1)::NUMERIC);
        max_lat := GREATEST(max_lat, (coord->>1)::NUMERIC);
      END LOOP;
    END LOOP;
    
    RETURN ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);
  END IF;

  RETURN NULL;
END;
$$;

-- ============================================================================
-- STEP 5: Create trigger function to auto-populate PostGIS columns from map_geometry
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_map_postgis_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  geom_type TEXT;
  coords JSONB;
  bounds_polygon GEOMETRY(POLYGON, 4326);
  center_coords JSONB;
BEGIN
  -- Only process map_geometry if it exists
  IF NEW.map_geometry IS NULL THEN
    NEW.map_center := NULL;
    NEW.map_bounds := NULL;
    RETURN NEW;
  END IF;

  geom_type := NEW.map_geometry->>'type';
  coords := NEW.map_geometry->'coordinates';

  -- Calculate map_center from geometry
  IF geom_type = 'Point' THEN
    -- Direct point
    NEW.map_center := ST_SetSRID(
      ST_MakePoint(
        (coords->>0)::NUMERIC,
        (coords->>1)::NUMERIC
      ),
      4326
    );
  ELSIF NEW.map_geometry->'center' IS NOT NULL THEN
    -- Use center from map_geometry if available (for 'both' type with pin)
    center_coords := NEW.map_geometry->'center';
    NEW.map_center := ST_SetSRID(
      ST_MakePoint(
        (center_coords->>0)::NUMERIC,
        (center_coords->>1)::NUMERIC
      ),
      4326
    );
  ELSIF geom_type IN ('Polygon', 'MultiPolygon') THEN
    -- Calculate centroid for polygons
    bounds_polygon := public.calculate_map_bounds(NEW.map_geometry);
    IF bounds_polygon IS NOT NULL THEN
      NEW.map_center := ST_Centroid(bounds_polygon);
    END IF;
  END IF;

  -- Calculate map_bounds for areas
  IF geom_type IN ('Polygon', 'MultiPolygon') THEN
    NEW.map_bounds := public.calculate_map_bounds(NEW.map_geometry);
  ELSIF geom_type = 'Point' THEN
    -- For points, create a small bounding box (500m buffer)
    IF NEW.map_center IS NOT NULL THEN
      NEW.map_bounds := ST_Buffer(NEW.map_center::geography, 500)::geometry;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_map_postgis_trigger ON public.posts;
CREATE TRIGGER sync_map_postgis_trigger
  BEFORE INSERT OR UPDATE OF map_geometry, map_center, map_type ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_map_postgis_columns();

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN public.posts.map_type IS 
  'Type of map data: pin (single point), area (polygon), or both (point + polygon)';

COMMENT ON COLUMN public.posts.map_geometry IS 
  'Full GeoJSON geometry: Point, Polygon, or MultiPolygon. Includes all coordinate data.';

COMMENT ON COLUMN public.posts.map_center IS 
  'PostGIS POINT for pin location. Used for spatial queries (radius searches, etc.)';

COMMENT ON COLUMN public.posts.map_hide_pin IS 
  'If true, hide the pin marker on the map (useful for area-only posts)';

COMMENT ON COLUMN public.posts.map_screenshot IS 
  'Base64 PNG data URL or cloud storage URL for map preview image';

COMMENT ON COLUMN public.posts.map_bounds IS 
  'PostGIS POLYGON representing the bounding box of the map area. Used for spatial queries (overlap, contains, etc.)';

COMMENT ON FUNCTION public.calculate_map_bounds IS 
  'Calculates PostGIS POLYGON bounds from GeoJSON geometry for spatial queries';

COMMENT ON FUNCTION public.sync_map_postgis_columns IS 
  'Trigger function that automatically populates map_center and map_bounds from map_geometry';

-- ============================================================================
-- STEP 7: Migrate existing map_data to new columns (if map_data exists)
-- ============================================================================

-- If posts have map_data in JSONB format, migrate to new columns
DO $$
DECLARE
  post_record RECORD;
  post_map_data JSONB;
  geom_data JSONB;
  center_data JSONB;
BEGIN
  FOR post_record IN 
    SELECT id, posts.map_data 
    FROM public.posts 
    WHERE posts.map_data IS NOT NULL 
    AND (posts.map_type IS NULL OR posts.map_geometry IS NULL)
  LOOP
    post_map_data := post_record.map_data;
    
    -- Extract map_type
    IF post_map_data->>'type' IS NOT NULL THEN
      UPDATE public.posts
      SET map_type = post_map_data->>'type'
      WHERE id = post_record.id;
    END IF;
    
    -- Extract geometry
    IF post_map_data->'geometry' IS NOT NULL THEN
      geom_data := post_map_data->'geometry';
      UPDATE public.posts
      SET map_geometry = geom_data
      WHERE id = post_record.id;
    END IF;
    
    -- Extract center
    IF post_map_data->'center' IS NOT NULL THEN
      center_data := post_map_data->'center';
      UPDATE public.posts
      SET map_center = ST_SetSRID(
        ST_MakePoint(
          (center_data->>0)::NUMERIC,
          (center_data->>1)::NUMERIC
        ),
        4326
      )
      WHERE id = post_record.id;
    END IF;
    
    -- Extract hidePin
    IF post_map_data->'hidePin' IS NOT NULL THEN
      UPDATE public.posts
      SET map_hide_pin = (post_map_data->>'hidePin')::BOOLEAN
      WHERE id = post_record.id;
    END IF;
    
    -- Extract screenshot
    IF post_map_data->'screenshot' IS NOT NULL THEN
      UPDATE public.posts
      SET map_screenshot = post_map_data->>'screenshot'
      WHERE id = post_record.id;
    END IF;
    
    -- Extract polygon (for 'both' type)
    IF post_map_data->'polygon' IS NOT NULL THEN
      -- For 'both' type, we store the full geometry in map_geometry
      -- The polygon is part of the geometry structure
      geom_data := post_map_data->'polygon';
      UPDATE public.posts
      SET map_geometry = jsonb_build_object(
        'type', 'Feature',
        'geometry', geom_data,
        'properties', jsonb_build_object('polygon', true)
      )
      WHERE id = post_record.id;
    END IF;
  END LOOP;
END $$;

