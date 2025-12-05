-- Optimize posts table for perfect media support (images, videos, captions)
-- Supports multi-profile engagement and flexible media storage
-- Creates table if it doesn't exist, or alters if it does

-- ============================================================================
-- STEP 1: Create visibility enum (if not exists)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.post_visibility AS ENUM (
    'public',
    'members_only',
    'draft'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create media type enum for posts
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.post_media_type AS ENUM (
    'text',      -- Text-only post (no media)
    'image',     -- Single or multiple images
    'video',     -- Single or multiple videos
    'mixed'      -- Mix of images and videos
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Create posts table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  images JSONB DEFAULT '[]'::jsonb, -- Array of media objects: [{url, filename, type, uploaded_at, ...}]
  city TEXT,
  county TEXT,
  zip_code TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  visibility public.post_visibility NOT NULL DEFAULT 'members_only'::public.post_visibility,
  media_type public.post_media_type NOT NULL DEFAULT 'text'::public.post_media_type,
  comments_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT posts_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  CONSTRAINT posts_comments_count_non_negative CHECK (comments_count >= 0),
  CONSTRAINT posts_view_count_non_negative CHECK (view_count >= 0),
  CONSTRAINT posts_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT posts_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- ============================================================================
-- STEP 4: Add media_type column if table exists but column doesn't
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN media_type public.post_media_type NOT NULL DEFAULT 'text'::public.post_media_type;
  END IF;
END $$;

-- Improve images JSONB structure with better schema
-- Structure: [
--   {
--     "id": "uuid",
--     "type": "image" | "video",
--     "url": "storage path",
--     "filename": "original filename",
--     "mime_type": "image/jpeg" | "video/mp4",
--     "size": 1234567,
--     "width": 1920,
--     "height": 1080,
--     "duration": 30.5,  -- for videos (seconds)
--     "thumbnail_url": "optional thumbnail",
--     "order": 0,
--     "uploaded_at": "timestamp"
--   }
-- ]

-- Add index for media_type
CREATE INDEX IF NOT EXISTS posts_media_type_idx ON public.posts(media_type);

-- Add index for JSONB media queries (GIN index for efficient JSONB searches)
CREATE INDEX IF NOT EXISTS posts_images_gin_idx ON public.posts USING GIN (images);

-- ============================================================================
-- STEP 3: Create helper function to determine media_type from images array
-- ============================================================================

CREATE OR REPLACE FUNCTION public.determine_post_media_type(media_array JSONB)
RETURNS public.post_media_type AS $$
DECLARE
  has_image BOOLEAN := FALSE;
  has_video BOOLEAN := FALSE;
  media_item JSONB;
BEGIN
  -- If empty array, return text
  IF media_array IS NULL OR jsonb_array_length(media_array) = 0 THEN
    RETURN 'text';
  END IF;

  -- Check each media item
  FOR media_item IN SELECT * FROM jsonb_array_elements(media_array)
  LOOP
    IF (media_item->>'type') = 'image' THEN
      has_image := TRUE;
    ELSIF (media_item->>'type') = 'video' THEN
      has_video := TRUE;
    END IF;
  END LOOP;

  -- Determine type
  IF has_image AND has_video THEN
    RETURN 'mixed';
  ELSIF has_video THEN
    RETURN 'video';
  ELSIF has_image THEN
    RETURN 'image';
  ELSE
    RETURN 'text';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 4: Create trigger to auto-update media_type when images change
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_post_media_type()
RETURNS TRIGGER AS $$
BEGIN
  NEW.media_type := public.determine_post_media_type(NEW.images);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_media_type_trigger ON public.posts;
CREATE TRIGGER update_post_media_type_trigger
  BEFORE INSERT OR UPDATE OF images ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_media_type();

-- ============================================================================
-- STEP 5: Create indexes (if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS posts_profile_id_idx ON public.posts(profile_id);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_visibility_created_at_idx ON public.posts(visibility, created_at DESC);

-- ============================================================================
-- STEP 6: Update existing posts to set media_type
-- ============================================================================

UPDATE public.posts
SET media_type = public.determine_post_media_type(images)
WHERE media_type = 'text'::public.post_media_type OR images IS NOT NULL;

-- ============================================================================
-- STEP 7: Add validation function for media array structure
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_post_media(media_array JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  media_item JSONB;
  item_type TEXT;
BEGIN
  -- NULL or empty array is valid (text-only post)
  IF media_array IS NULL OR jsonb_array_length(media_array) = 0 THEN
    RETURN TRUE;
  END IF;

  -- Validate each media item
  FOR media_item IN SELECT * FROM jsonb_array_elements(media_array)
  LOOP
    -- Required fields
    IF NOT (media_item ? 'type' AND media_item ? 'url') THEN
      RETURN FALSE;
    END IF;

    item_type := media_item->>'type';
    
    -- Type must be 'image' or 'video'
    IF item_type NOT IN ('image', 'video') THEN
      RETURN FALSE;
    END IF;

    -- URL must be a string
    IF jsonb_typeof(media_item->'url') != 'string' THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 8: Add constraint to validate media structure
-- ============================================================================

DO $$ 
BEGIN
  -- Drop constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_media_valid'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_media_valid;
  END IF;
  
  -- Add constraint
  ALTER TABLE public.posts
    ADD CONSTRAINT posts_media_valid
    CHECK (public.validate_post_media(images));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint might already exist or function not ready, skip
    NULL;
END $$;

-- ============================================================================
-- STEP 9: Create function to get post media summary
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_post_media_summary(post_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  post_record RECORD;
  result JSONB;
BEGIN
  SELECT media_type, images INTO post_record
  FROM public.posts
  WHERE id = post_id_param;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  result := jsonb_build_object(
    'media_type', post_record.media_type,
    'count', jsonb_array_length(COALESCE(post_record.images, '[]'::jsonb)),
    'has_images', EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(post_record.images, '[]'::jsonb))
      WHERE value->>'type' = 'image'
    ),
    'has_videos', EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(post_record.images, '[]'::jsonb))
      WHERE value->>'type' = 'video'
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- STEP 10: Create updated_at trigger (if not exists)
-- ============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 11: Enable RLS if not already enabled
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 12: Update storage bucket name to be more generic (posts instead of feed)
-- ============================================================================

-- Note: We'll keep using 'feed-images' bucket for backward compatibility
-- But update comments to reflect it's for posts

COMMENT ON TABLE public.posts IS 
  'Posts table supporting multi-profile engagement with flexible media (images, videos, text)';

COMMENT ON COLUMN public.posts.media_type IS 
  'Type of media in the post: text (no media), image, video, or mixed';

COMMENT ON COLUMN public.posts.images IS 
  'JSONB array of media objects. Each object should have: type (image/video), url, filename, mime_type, size, width, height, duration (videos), thumbnail_url, order, uploaded_at';

COMMENT ON COLUMN public.posts.profile_id IS 
  'Profile that created the post - users can post from any profile they own';

-- ============================================================================
-- STEP 13: Create view for post media statistics
-- ============================================================================

CREATE OR REPLACE VIEW public.post_media_stats AS
SELECT 
  p.id AS post_id,
  p.media_type,
  jsonb_array_length(COALESCE(p.images, '[]'::jsonb)) AS media_count,
  COUNT(*) FILTER (WHERE jsonb_typeof(elem->'type') = 'text' AND elem->>'type' = 'image') AS image_count,
  COUNT(*) FILTER (WHERE jsonb_typeof(elem->'type') = 'text' AND elem->>'type' = 'video') AS video_count,
  SUM((elem->>'size')::BIGINT) FILTER (WHERE elem ? 'size') AS total_size_bytes
FROM public.posts p
LEFT JOIN LATERAL jsonb_array_elements(COALESCE(p.images, '[]'::jsonb)) AS elem ON TRUE
GROUP BY p.id, p.media_type, p.images;

-- ============================================================================
-- STEP 14: Grant permissions
-- ============================================================================

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.post_media_stats TO authenticated, anon;

-- ============================================================================
-- STEP 15: Example queries for common operations
-- ============================================================================

-- Get all posts with images
-- SELECT * FROM posts WHERE media_type IN ('image', 'mixed');

-- Get all video posts
-- SELECT * FROM posts WHERE media_type IN ('video', 'mixed');

-- Get posts with media count
-- SELECT p.*, pms.media_count, pms.image_count, pms.video_count
-- FROM posts p
-- LEFT JOIN post_media_stats pms ON p.id = pms.post_id;

-- Get first media item for each post
-- SELECT 
--   id,
--   title,
--   jsonb_array_elements(images)->>'url' AS first_media_url
-- FROM posts
-- WHERE jsonb_array_length(images) > 0
-- LIMIT 1;

