-- Add map_data column to posts table for storing map pins and areas
-- map_data structure: { type: 'pin' | 'area', geometry: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon }

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS map_data JSONB;

-- Create index for map_data queries
CREATE INDEX IF NOT EXISTS posts_map_data_idx ON public.posts USING GIN (map_data) WHERE map_data IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.posts.map_data IS 'Map data for posts: { type: "pin" | "area", geometry: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon }';


