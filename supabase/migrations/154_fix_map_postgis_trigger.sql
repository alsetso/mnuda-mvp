-- Fix the sync_map_postgis_columns trigger function
-- This updates the trigger to properly handle map_geometry without requiring map_center input

-- ============================================================================
-- STEP 1: Update trigger function to handle geometry properly
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

-- ============================================================================
-- STEP 2: Update trigger to fire on map_type changes as well
-- ============================================================================

DROP TRIGGER IF EXISTS sync_map_postgis_trigger ON public.posts;
CREATE TRIGGER sync_map_postgis_trigger
  BEFORE INSERT OR UPDATE OF map_geometry, map_center, map_type ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_map_postgis_columns();

-- ============================================================================
-- STEP 3: Re-sync existing posts that have map_geometry but missing PostGIS columns
-- ============================================================================

-- Update existing posts to populate PostGIS columns from map_geometry
UPDATE public.posts
SET 
  map_center = CASE
    WHEN map_geometry->>'type' = 'Point' THEN
      ST_SetSRID(
        ST_MakePoint(
          ((map_geometry->'coordinates'->>0)::NUMERIC),
          ((map_geometry->'coordinates'->>1)::NUMERIC)
        ),
        4326
      )
    WHEN map_geometry->'center' IS NOT NULL THEN
      ST_SetSRID(
        ST_MakePoint(
          ((map_geometry->'center'->>0)::NUMERIC),
          ((map_geometry->'center'->>1)::NUMERIC)
        ),
        4326
      )
    WHEN map_geometry->>'type' IN ('Polygon', 'MultiPolygon') THEN
      ST_Centroid(public.calculate_map_bounds(map_geometry))
    ELSE NULL
  END,
  map_bounds = CASE
    WHEN map_geometry->>'type' IN ('Polygon', 'MultiPolygon') THEN
      public.calculate_map_bounds(map_geometry)
    WHEN map_geometry->>'type' = 'Point' AND map_center IS NOT NULL THEN
      ST_Buffer(map_center::geography, 500)::geometry
    ELSE NULL
  END
WHERE map_geometry IS NOT NULL 
  AND (map_center IS NULL OR map_bounds IS NULL);

