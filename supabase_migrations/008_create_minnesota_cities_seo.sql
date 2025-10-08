-- SEO-optimized denormalized table for Minnesota city pages
-- Contains editorial content, metadata, and performance fields for fast rendering

CREATE TABLE IF NOT EXISTS public.minnesota_cities (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE UNIQUE,
  city_slug TEXT NOT NULL UNIQUE,
  state_code TEXT NOT NULL DEFAULT 'MN',
  
  -- SEO metadata
  seo_title TEXT,
  seo_description TEXT,
  hero_h1 TEXT,
  intro_md TEXT,
  
  -- Structured content
  faq JSONB DEFAULT '[]'::JSONB,
  market_stats JSONB DEFAULT '{}'::JSONB,
  
  -- Internal linking
  nearby_city_slugs TEXT[] DEFAULT '{}',
  
  -- Indexation control
  is_indexable BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS minnesota_cities_city_slug_idx ON public.minnesota_cities(city_slug);
CREATE INDEX IF NOT EXISTS minnesota_cities_city_id_idx ON public.minnesota_cities(city_id);
CREATE INDEX IF NOT EXISTS minnesota_cities_indexable_idx ON public.minnesota_cities(is_indexable);
CREATE INDEX IF NOT EXISTS minnesota_cities_nearby_idx ON public.minnesota_cities USING GIN(nearby_city_slugs);

ALTER TABLE public.minnesota_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read minnesota_cities" ON public.minnesota_cities FOR SELECT USING (true);

COMMENT ON TABLE public.minnesota_cities IS 'SEO and editorial content for Minnesota city landing pages';
COMMENT ON COLUMN public.minnesota_cities.intro_md IS 'Markdown intro paragraph with city context, 300-800 words unique';
COMMENT ON COLUMN public.minnesota_cities.faq IS 'Array of {question, answer} objects for FAQPage schema';
COMMENT ON COLUMN public.minnesota_cities.market_stats IS 'Object with median_price, dom, inventory_count, trend_delta_30d';
COMMENT ON COLUMN public.minnesota_cities.nearby_city_slugs IS 'Array of adjacent city slugs for internal linking';
COMMENT ON COLUMN public.minnesota_cities.is_indexable IS 'False = noindex until content ready';

