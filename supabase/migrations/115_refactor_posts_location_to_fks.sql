-- Refactor posts table to use city_id and county_id foreign keys
-- Remove old locational columns: city, county, zip_code, latitude, longitude

-- ============================================================================
-- STEP 1: Add new foreign key columns
-- ============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS county_id UUID REFERENCES public.counties(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Migrate existing data by matching city/county names to IDs
-- ============================================================================

-- Migrate city data
UPDATE public.posts p
SET city_id = (
  SELECT c.id 
  FROM public.cities c 
  WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p.city))
  LIMIT 1
)
WHERE p.city IS NOT NULL AND p.city_id IS NULL;

-- Migrate county data
-- Note: Counties table has format "Anoka County", posts may have "Anoka" or "Anoka County"
-- Try exact match first, then try appending " County" if post value doesn't already end with " County"
UPDATE public.posts p
SET county_id = (
  SELECT co.id 
  FROM public.counties co 
  WHERE LOWER(TRIM(co.name)) = LOWER(TRIM(p.county))
     OR (LOWER(TRIM(co.name)) = LOWER(TRIM(p.county) || ' County') 
         AND LOWER(TRIM(p.county)) NOT LIKE '% county')
  LIMIT 1
)
WHERE p.county IS NOT NULL AND p.county_id IS NULL;

-- ============================================================================
-- STEP 3: Create indexes for foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS posts_city_id_idx ON public.posts(city_id) WHERE city_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_county_id_idx ON public.posts(county_id) WHERE county_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Drop old locational columns
-- ============================================================================

ALTER TABLE public.posts
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS county,
  DROP COLUMN IF EXISTS zip_code,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;

-- ============================================================================
-- STEP 5: Drop old constraints that referenced removed columns
-- ============================================================================

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_latitude_range,
  DROP CONSTRAINT IF EXISTS posts_longitude_range;

-- ============================================================================
-- STEP 6: Add table comments
-- ============================================================================

COMMENT ON COLUMN public.posts.city_id IS 
  'Foreign key reference to cities table. Allows posts to be associated with a specific city.';

COMMENT ON COLUMN public.posts.county_id IS 
  'Foreign key reference to counties table. Allows posts to be associated with a specific county.';

