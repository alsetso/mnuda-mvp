-- Materialized view for fast SSR rendering of city pages
-- Denormalizes city, county, and ZIP data into a single performant read layer

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mn_city_seo AS
SELECT
  c.id AS city_id,
  c.slug AS city_slug,
  c.name AS city_name,
  c.lat,
  c.lng,
  c.population,
  c.priority,
  c.status,
  k.name AS county_name,
  k.slug AS county_slug,
  STRING_AGG(z.zip_code, ', ' ORDER BY z.zip_code) AS zip_codes,
  COUNT(DISTINCT z.id) AS zip_count
FROM public.cities c
JOIN public.counties k ON k.id = c.county_id
LEFT JOIN public.city_zips cz ON cz.city_id = c.id
LEFT JOIN public.zips z ON z.id = cz.zip_id
WHERE c.state_code = 'MN' AND c.status = 'active'
GROUP BY c.id, c.slug, c.name, c.lat, c.lng, c.population, c.priority, c.status, k.name, k.slug;

CREATE UNIQUE INDEX IF NOT EXISTS mn_city_seo_city_slug_idx ON public.mn_city_seo(city_slug);
CREATE INDEX IF NOT EXISTS mn_city_seo_priority_idx ON public.mn_city_seo(priority DESC, city_slug);
CREATE INDEX IF NOT EXISTS mn_city_seo_county_idx ON public.mn_city_seo(county_slug);

COMMENT ON MATERIALIZED VIEW public.mn_city_seo IS 'Fast read layer for SSR city pages; refresh after bulk loads';

-- Refresh function for convenience
CREATE OR REPLACE FUNCTION public.refresh_mn_city_seo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mn_city_seo;
END;
$$;

COMMENT ON FUNCTION public.refresh_mn_city_seo IS 'Refresh the mn_city_seo materialized view; call after bulk city/ZIP updates';

