-- Add slug column to cities table for SEO-friendly URLs
-- Generate slugs from city names (e.g., "Saint Paul" -> "saint-paul")

-- ============================================================================
-- STEP 1: Add slug column
-- ============================================================================

ALTER TABLE public.cities 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ============================================================================
-- STEP 2: Create function to generate slug from city name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_city_slug(city_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Convert to lowercase and normalize
  base_slug := lower(trim(city_name));
  
  -- Remove special characters like †
  base_slug := regexp_replace(base_slug, '[†]', '', 'g');
  
  -- Replace spaces and special characters with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Handle special cases
  -- "Saint Paul" -> "saint-paul"
  -- "St. Cloud" -> "st-cloud"
  -- "St. Louis Park" -> "st-louis-park"
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Generate slugs for existing cities (handle duplicates)
-- ============================================================================

DO $$
DECLARE
  city_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  slug_counter INTEGER;
BEGIN
  FOR city_record IN 
    SELECT id, name FROM public.cities WHERE slug IS NULL OR slug = ''
    ORDER BY name
  LOOP
    base_slug := public.generate_city_slug(city_record.name);
    final_slug := base_slug;
    slug_counter := 0;
    
    -- Check if slug already exists, if so append number
    WHILE EXISTS (
      SELECT 1 FROM public.cities 
      WHERE slug = final_slug 
      AND id != city_record.id
    ) LOOP
      slug_counter := slug_counter + 1;
      final_slug := base_slug || '-' || slug_counter;
    END LOOP;
    
    UPDATE public.cities
    SET slug = final_slug
    WHERE id = city_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Create unique index on slug
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS cities_slug_unique_idx
  ON public.cities (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 5: Create index for slug lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS cities_slug_idx
  ON public.cities (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN public.cities.slug IS 'SEO-friendly URL slug for /city/:slug pages. Generated from city name (e.g., "saint-paul" from "Saint Paul").';

