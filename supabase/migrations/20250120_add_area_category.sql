-- Add category field to areas table for admin-managed geographic boundaries
-- Categories: county, city, state, region, custom, etc.

CREATE TYPE public.area_category AS ENUM ('custom', 'county', 'city', 'state', 'region', 'zipcode');

ALTER TABLE public.areas
ADD COLUMN IF NOT EXISTS category public.area_category NOT NULL DEFAULT 'custom'::public.area_category;

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_areas_category ON public.areas(category);

-- Add comment
COMMENT ON COLUMN public.areas.category IS 'Geographic category for the area. Admins can create county, city, state, etc. boundaries for view layers.';

