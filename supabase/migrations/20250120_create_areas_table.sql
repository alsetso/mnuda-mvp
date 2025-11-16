-- Create areas table for storing user-drawn polygons on the map
-- Areas are GeoJSON polygons that users can draw and save

CREATE TYPE public.area_visibility AS ENUM ('public', 'private');

CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility public.area_visibility NOT NULL DEFAULT 'public'::public.area_visibility,
  geometry JSONB NOT NULL, -- GeoJSON geometry (Polygon or MultiPolygon)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_areas_user_id ON public.areas(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_visibility ON public.areas(visibility);
-- Note: JSONB geometry column doesn't support spatial indexing without PostGIS
-- Consider using PostGIS geometry types if spatial queries are needed

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_areas_updated_at 
    BEFORE UPDATE ON public.areas 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Members can view public areas OR their own areas
CREATE POLICY "Members can view public areas or own areas"
  ON public.areas
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.area_visibility OR 
    auth.uid() = user_id
  );

-- Members can insert their own areas
CREATE POLICY "Members can insert own areas"
  ON public.areas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Members can update their own areas
CREATE POLICY "Members can update own areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Members can delete their own areas
CREATE POLICY "Members can delete own areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to view public areas
GRANT SELECT ON public.areas TO anon;

CREATE POLICY "Anonymous users can view public areas"
  ON public.areas
  FOR SELECT
  TO anon
  USING (visibility = 'public'::public.area_visibility);

