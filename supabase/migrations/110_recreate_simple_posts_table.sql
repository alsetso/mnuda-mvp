-- Recreate simplified posts table with only video and image storage
-- No comments functionality

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
-- STEP 3: Create posts table
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
  view_count INTEGER NOT NULL DEFAULT 0,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT posts_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  CONSTRAINT posts_view_count_non_negative CHECK (view_count >= 0),
  CONSTRAINT posts_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT posts_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- ============================================================================
-- STEP 4: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS posts_profile_id_idx ON public.posts(profile_id);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_visibility_created_at_idx ON public.posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 5: Create updated_at trigger function and trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 6: Create function to determine media type from images array
-- ============================================================================

CREATE OR REPLACE FUNCTION public.determine_post_media_type(images_jsonb JSONB)
RETURNS public.post_media_type AS $$
DECLARE
  has_image BOOLEAN := false;
  has_video BOOLEAN := false;
  elem JSONB;
BEGIN
  IF images_jsonb IS NULL OR jsonb_array_length(images_jsonb) = 0 THEN
    RETURN 'text';
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(images_jsonb)
  LOOP
    IF elem->>'type' = 'image' OR (elem->>'type' IS NULL AND elem->>'mime_type' LIKE 'image/%') THEN
      has_image := true;
    ELSIF elem->>'type' = 'video' OR (elem->>'type' IS NULL AND elem->>'mime_type' LIKE 'video/%') THEN
      has_video := true;
    END IF;
  END LOOP;

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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create trigger to auto-update media_type
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_post_media_type()
RETURNS TRIGGER AS $$
BEGIN
  NEW.media_type := public.determine_post_media_type(NEW.images);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_media_type ON public.posts;
CREATE TRIGGER update_post_media_type
  BEFORE INSERT OR UPDATE OF images ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_media_type();

-- ============================================================================
-- STEP 8: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS policies
-- ============================================================================

-- Anonymous: Can view public posts
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Authenticated: Can view public and members_only posts
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (visibility IN ('public', 'members_only'));

-- Authenticated: Can insert posts (must own the profile)
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Authenticated: Can update own posts
DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Authenticated: Can delete own posts
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 10: Grant permissions
-- ============================================================================

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- ============================================================================
-- STEP 11: Add table documentation
-- ============================================================================

COMMENT ON TABLE public.posts IS 
  'Posts table with video and image storage support. No comments functionality.';

COMMENT ON COLUMN public.posts.media_type IS 
  'Type of media in the post: text (no media), image, video, or mixed';

COMMENT ON COLUMN public.posts.images IS 
  'JSONB array of media objects. Each object should have: type (image/video), url, filename, mime_type, size, width, height, duration (videos), thumbnail_url, order, uploaded_at';

COMMENT ON COLUMN public.posts.profile_id IS 
  'Profile that created the post - users can post from any profile they own';

