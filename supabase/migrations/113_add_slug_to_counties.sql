-- Add slug column to counties table for SEO-friendly URLs
-- Generate slugs from county names (e.g., "Hennepin County" -> "hennepin")

-- ============================================================================
-- STEP 1: Add slug column
-- ============================================================================

ALTER TABLE public.counties 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ============================================================================
-- STEP 2: Create function to generate slug from county name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_county_slug(county_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Convert to lowercase and normalize
  base_slug := lower(trim(county_name));
  
  -- Remove " County" suffix
  base_slug := regexp_replace(base_slug, '\s+county$', '', 'g');
  
  -- Replace spaces and special characters with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Handle special cases
  -- "Lac qui Parle County" -> "lac-qui-parle"
  -- "Lake of the Woods County" -> "lake-of-the-woods"
  -- "Saint Louis County" -> "saint-louis"
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Generate slugs for existing counties
-- ============================================================================

UPDATE public.counties
SET slug = public.generate_county_slug(name)
WHERE slug IS NULL OR slug = '';

-- ============================================================================
-- STEP 4: Create unique index on slug
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS counties_slug_unique_idx
  ON public.counties (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 5: Create index for slug lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS counties_slug_idx
  ON public.counties (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON COLUMN public.counties.slug IS 'SEO-friendly URL slug for /county/:slug pages. Generated from county name (e.g., "hennepin" from "Hennepin County").';







