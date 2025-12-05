-- Drop all feed tables and rebuild with a simple single posts table
-- This simplifies the schema while maintaining the same functionality

-- ============================================================================
-- STEP 1: Drop all feed-related tables and objects
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_feed_comments_count_on_insert ON public.feed_comments;
DROP TRIGGER IF EXISTS update_feed_comments_count_on_delete ON public.feed_comments;
DROP TRIGGER IF EXISTS update_feed_updated_at ON public.feed;
DROP TRIGGER IF EXISTS increment_feed_view_on_view ON public.feed_views;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_feed_comments_count();
DROP FUNCTION IF EXISTS public.update_feed_likes_count();
DROP FUNCTION IF EXISTS public.increment_feed_view_count();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.check_parent_comment_exists(UUID, UUID);
DROP FUNCTION IF EXISTS public.feed_post_is_visible(UUID);
DROP FUNCTION IF EXISTS public.generate_feed_slug();

-- Drop all policies (comprehensive drop)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop feed policies
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed', r.policyname);
  END LOOP;

  -- Drop feed_comments policies
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed_comments'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_comments', r.policyname);
  END LOOP;

  -- Drop feed_views policies
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed_views'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_views', r.policyname);
  END LOOP;
END $$;

-- Drop storage policies for feed-images
DROP POLICY IF EXISTS "Users can upload own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

-- Drop tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS public.feed_views CASCADE;
DROP TABLE IF EXISTS public.feed_comments CASCADE;
DROP TABLE IF EXISTS public.feed_likes CASCADE;
DROP TABLE IF EXISTS public.feed CASCADE;

-- Drop enums (will recreate)
DROP TYPE IF EXISTS public.feed_status CASCADE;
DROP TYPE IF EXISTS public.feed_visibility CASCADE;

-- ============================================================================
-- STEP 2: Create simple posts table
-- ============================================================================

-- Create visibility enum
CREATE TYPE public.post_visibility AS ENUM (
  'public',
  'members_only',
  'draft'
);

-- Create posts table (simplified from feed)
CREATE TABLE public.posts (
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

-- Create indexes
CREATE INDEX posts_profile_id_idx ON public.posts(profile_id);
CREATE INDEX posts_visibility_idx ON public.posts(visibility);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX posts_visibility_created_at_idx ON public.posts(visibility, created_at DESC);

-- ============================================================================
-- STEP 3: Create updated_at trigger function and trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Create comments table
-- ============================================================================

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT post_comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

CREATE INDEX post_comments_post_id_idx ON public.post_comments(post_id);
CREATE INDEX post_comments_profile_id_idx ON public.post_comments(profile_id);
CREATE INDEX post_comments_parent_comment_id_idx ON public.post_comments(parent_comment_id);

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update posts.comments_count
CREATE OR REPLACE FUNCTION public.update_posts_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_posts_comments_count_on_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_comments_count();

CREATE TRIGGER update_posts_comments_count_on_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_comments_count();

-- ============================================================================
-- STEP 5: Create views table
-- ============================================================================

CREATE TABLE public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness for view tracking
  CONSTRAINT unique_post_view_per_profile UNIQUE (post_id, profile_id) WHERE profile_id IS NOT NULL,
  CONSTRAINT unique_post_view_per_user UNIQUE (post_id, user_id) WHERE user_id IS NOT NULL AND profile_id IS NULL
);

CREATE INDEX post_views_post_id_idx ON public.post_views(post_id);
CREATE INDEX post_views_profile_id_idx ON public.post_views(profile_id);
CREATE INDEX post_views_user_id_idx ON public.post_views(user_id);
CREATE INDEX post_views_viewed_at_idx ON public.post_views(viewed_at);

-- Function to update posts.view_count
CREATE OR REPLACE FUNCTION public.increment_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER increment_post_view_on_view
  AFTER INSERT ON public.post_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_post_view_count();

-- ============================================================================
-- STEP 6: Enable RLS
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create helper functions
-- ============================================================================

-- Helper function to check if user owns profile
CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    INNER JOIN public.accounts ON accounts.id = profiles.account_id
    WHERE profiles.id = profile_id
    AND accounts.user_id = current_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if post is visible
CREATE OR REPLACE FUNCTION public.post_is_visible(post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  post_visibility public.post_visibility;
  post_profile_id UUID;
BEGIN
  SELECT visibility, profile_id INTO post_visibility, post_profile_id
  FROM public.posts
  WHERE id = post_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF post_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  IF post_visibility = 'members_only' AND auth.role() = 'authenticated' THEN
    RETURN TRUE;
  END IF;
  
  IF public.user_owns_profile(post_profile_id) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check parent comment exists
CREATE OR REPLACE FUNCTION public.check_parent_comment_exists(
  parent_id UUID,
  post_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.post_comments
    WHERE id = parent_id
    AND post_id = post_id_param
  );
END;
$$;

-- ============================================================================
-- STEP 8: Create RLS policies for posts
-- ============================================================================

-- Anonymous: View public posts only
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public'::public.post_visibility);

-- Authenticated: View public + members_only posts OR own posts
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    visibility IN ('public', 'members_only')
    OR public.user_owns_profile(profile_id)
  );

-- Insert: Must own the profile
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = posts.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND visibility IN ('public', 'members_only', 'draft')
  );

-- Update: Must own the profile
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = posts.profile_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = posts.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND visibility IN ('public', 'members_only', 'draft')
  );

-- Delete: Must own the profile
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = posts.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 9: Create RLS policies for post_comments
-- ============================================================================

-- Anonymous: View comments on public posts
CREATE POLICY "post_comments_select_anon"
  ON public.post_comments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_comments.post_id
      AND posts.visibility = 'public'::public.post_visibility
    )
  );

-- Authenticated: View comments on visible posts
CREATE POLICY "post_comments_select_authenticated"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (public.post_is_visible(post_id));

-- Insert: Post must be visible AND user must own profile
CREATE POLICY "post_comments_insert"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.post_is_visible(post_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = post_comments.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND (
      parent_comment_id IS NULL
      OR public.check_parent_comment_exists(parent_comment_id, post_id)
    )
  );

-- Update: Must own the profile
CREATE POLICY "post_comments_update"
  ON public.post_comments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = post_comments.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Delete: Must own the profile
CREATE POLICY "post_comments_delete"
  ON public.post_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = post_comments.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 10: Create RLS policies for post_views
-- ============================================================================

-- Insert: Post must be visible
CREATE POLICY "post_views_insert"
  ON public.post_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_views.post_id
      AND (
        posts.visibility = 'public'::public.post_visibility
        OR (
          posts.visibility = 'members_only'::public.post_visibility
          AND auth.role() = 'authenticated'
        )
      )
    )
    AND (
      (
        auth.role() = 'authenticated'
        AND (
          post_views.profile_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = post_views.profile_id
            AND EXISTS (
              SELECT 1 FROM public.accounts
              WHERE accounts.id = profiles.account_id
              AND accounts.user_id = auth.uid()
            )
          )
        )
        AND (
          post_views.user_id IS NULL
          OR post_views.user_id = auth.uid()
        )
      )
      OR
      (
        auth.role() = 'anon'
        AND post_views.profile_id IS NULL
        AND post_views.user_id IS NULL
      )
    )
  );

-- ============================================================================
-- STEP 11: Create storage policies for feed-images bucket (now used for posts)
-- ============================================================================

-- Public read access
CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- Users can upload their own post media
CREATE POLICY "Users can upload own feed images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id::text = (storage.foldername(name))[3]
      AND posts.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can update their own post media
CREATE POLICY "Users can update own feed images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id::text = (storage.foldername(name))[3]
      AND posts.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id::text = (storage.foldername(name))[3]
      AND posts.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can delete their own post media
CREATE POLICY "Users can delete own feed images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id::text = (storage.foldername(name))[3]
      AND posts.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- STEP 12: Grant permissions
-- ============================================================================

GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.post_comments TO anon;
GRANT INSERT ON public.post_views TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT INSERT ON public.post_views TO authenticated;

-- ============================================================================
-- STEP 13: Add comments
-- ============================================================================

COMMENT ON TABLE public.posts IS 'Simplified posts table replacing feed table';
COMMENT ON TABLE public.post_comments IS 'Comments on posts';
COMMENT ON TABLE public.post_views IS 'Unique view tracking for posts';
COMMENT ON COLUMN public.posts.images IS 'Array of media objects (images/videos) stored in feed-images bucket';







