-- Idempotent upsert functions for loading city-county-ZIP data
-- Used by the CSV loader script to safely insert or update records

-- Upsert county by state and slug
CREATE OR REPLACE FUNCTION public.upsert_county(
  p_state_code TEXT,
  p_name TEXT,
  p_slug TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_county_id BIGINT;
BEGIN
  INSERT INTO public.counties (state_code, name, slug)
  VALUES (p_state_code, p_name, p_slug)
  ON CONFLICT (state_code, slug) 
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_county_id;
  
  RETURN v_county_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_county IS 'Idempotent insert/update for counties; returns county_id';

-- Upsert city by slug
CREATE OR REPLACE FUNCTION public.upsert_city(
  p_county_id BIGINT,
  p_state_code TEXT,
  p_name TEXT,
  p_slug TEXT,
  p_population INTEGER DEFAULT NULL,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  p_priority INTEGER DEFAULT 0
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_city_id BIGINT;
BEGIN
  INSERT INTO public.cities (
    county_id, state_code, name, slug, population, lat, lng, priority, updated_at
  )
  VALUES (
    p_county_id, p_state_code, p_name, p_slug, p_population, p_lat, p_lng, p_priority, NOW()
  )
  ON CONFLICT (slug) 
  DO UPDATE SET
    county_id = EXCLUDED.county_id,
    name = EXCLUDED.name,
    population = COALESCE(EXCLUDED.population, cities.population),
    lat = COALESCE(EXCLUDED.lat, cities.lat),
    lng = COALESCE(EXCLUDED.lng, cities.lng),
    priority = EXCLUDED.priority,
    updated_at = NOW()
  RETURNING id INTO v_city_id;
  
  RETURN v_city_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_city IS 'Idempotent insert/update for cities; returns city_id';

-- Upsert ZIP and link to city
CREATE OR REPLACE FUNCTION public.link_zip(
  p_city_id BIGINT,
  p_zip_code TEXT,
  p_state_code TEXT DEFAULT 'MN'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_zip_id BIGINT;
BEGIN
  -- Upsert ZIP
  INSERT INTO public.zips (zip_code, state_code)
  VALUES (p_zip_code, p_state_code)
  ON CONFLICT (zip_code) DO NOTHING
  RETURNING id INTO v_zip_id;
  
  -- If conflict, fetch existing id
  IF v_zip_id IS NULL THEN
    SELECT id INTO v_zip_id FROM public.zips WHERE zip_code = p_zip_code;
  END IF;
  
  -- Link city to ZIP (idempotent)
  INSERT INTO public.city_zips (city_id, zip_id)
  VALUES (p_city_id, v_zip_id)
  ON CONFLICT (city_id, zip_id) DO NOTHING;
  
  RETURN v_zip_id;
END;
$$;

COMMENT ON FUNCTION public.link_zip IS 'Upsert ZIP and link to city; idempotent';

-- Utility: slugify text for consistent slug generation
CREATE OR REPLACE FUNCTION public.slugify(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(p_text, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$;

COMMENT ON FUNCTION public.slugify IS 'Convert text to URL-safe slug: lowercase, hyphens, no special chars';

