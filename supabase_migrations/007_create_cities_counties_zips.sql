-- Core normalized tables for Minnesota cities, counties, and ZIPs
-- These tables form the foundation for SEO indexing and property search

-- Counties table
CREATE TABLE IF NOT EXISTS public.counties (
  id BIGSERIAL PRIMARY KEY,
  state_code TEXT NOT NULL DEFAULT 'MN',
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(state_code, slug)
);

CREATE INDEX IF NOT EXISTS counties_state_slug_idx ON public.counties(state_code, slug);
CREATE INDEX IF NOT EXISTS counties_name_idx ON public.counties(name);

ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read counties" ON public.counties FOR SELECT USING (true);

COMMENT ON TABLE public.counties IS 'Minnesota counties for geographic organization and SEO routing';

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id BIGSERIAL PRIMARY KEY,
  county_id BIGINT NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL DEFAULT 'MN',
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  population INTEGER,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  aliases TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cities_slug_idx ON public.cities(slug);
CREATE INDEX IF NOT EXISTS cities_county_idx ON public.cities(county_id);
CREATE INDEX IF NOT EXISTS cities_status_idx ON public.cities(status);
CREATE INDEX IF NOT EXISTS cities_priority_idx ON public.cities(priority DESC, slug);
CREATE INDEX IF NOT EXISTS cities_aliases_idx ON public.cities USING GIN(aliases);
CREATE INDEX IF NOT EXISTS cities_state_slug_idx ON public.cities(state_code, slug);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cities" ON public.cities FOR SELECT USING (true);

COMMENT ON TABLE public.cities IS 'Minnesota cities/places for local real estate search and SEO';
COMMENT ON COLUMN public.cities.priority IS 'Higher priority cities are pre-rendered in SSG; 0=on-demand ISR';
COMMENT ON COLUMN public.cities.aliases IS 'Alternate spellings and abbreviations for 301 redirects';

-- ZIPs table
CREATE TABLE IF NOT EXISTS public.zips (
  id BIGSERIAL PRIMARY KEY,
  zip_code TEXT NOT NULL UNIQUE,
  state_code TEXT NOT NULL DEFAULT 'MN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zips_code_idx ON public.zips(zip_code);
CREATE INDEX IF NOT EXISTS zips_state_idx ON public.zips(state_code);

ALTER TABLE public.zips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read zips" ON public.zips FOR SELECT USING (true);

COMMENT ON TABLE public.zips IS 'Minnesota ZIP codes for property search filtering';

-- City-ZIP junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.city_zips (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  zip_id BIGINT NOT NULL REFERENCES public.zips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city_id, zip_id)
);

CREATE INDEX IF NOT EXISTS city_zips_city_idx ON public.city_zips(city_id);
CREATE INDEX IF NOT EXISTS city_zips_zip_idx ON public.city_zips(zip_id);

ALTER TABLE public.city_zips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read city_zips" ON public.city_zips FOR SELECT USING (true);

COMMENT ON TABLE public.city_zips IS 'Maps cities to their ZIP codes for property search and display';

