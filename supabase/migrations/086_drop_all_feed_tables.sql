-- Drop all feed-related tables and objects
-- Simple cleanup script

-- ============================================================================
-- STEP 1: Drop triggers (only if tables exist)
-- ============================================================================

-- Drop triggers for feed_comments (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_comments') THEN
    DROP TRIGGER IF EXISTS update_feed_comments_count_on_insert ON public.feed_comments;
    DROP TRIGGER IF EXISTS update_feed_comments_count_on_delete ON public.feed_comments;
  END IF;
END $$;

-- Drop triggers for feed_views (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_views') THEN
    DROP TRIGGER IF EXISTS increment_feed_view_on_view ON public.feed_views;
  END IF;
END $$;

-- Drop triggers for feed (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed') THEN
    DROP TRIGGER IF EXISTS update_feed_updated_at ON public.feed;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop all policies (comprehensive drop, only if tables exist)
-- Must be done BEFORE dropping functions since policies depend on them
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop feed policies (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed') THEN
    FOR r IN (
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'feed'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed', r.policyname);
    END LOOP;
  END IF;

  -- Drop feed_comments policies (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_comments') THEN
    FOR r IN (
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'feed_comments'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_comments', r.policyname);
    END LOOP;
  END IF;

  -- Drop feed_views policies (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_views') THEN
    FOR r IN (
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'feed_views'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_views', r.policyname);
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop functions (after policies are dropped)
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_feed_comments_count();
DROP FUNCTION IF EXISTS public.update_feed_likes_count();
DROP FUNCTION IF EXISTS public.increment_feed_view_count();
DROP FUNCTION IF EXISTS public.check_parent_comment_exists(UUID, UUID);
DROP FUNCTION IF EXISTS public.feed_post_is_visible(UUID);
DROP FUNCTION IF EXISTS public.generate_feed_slug();

-- Note: feed_likes table was already dropped in migration 083, so we skip it here

-- ============================================================================
-- STEP 4: Drop storage policies for feed-images
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

-- ============================================================================
-- STEP 5: Drop tables (CASCADE handles foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS public.feed_views CASCADE;
DROP TABLE IF EXISTS public.feed_comments CASCADE;
DROP TABLE IF EXISTS public.feed_likes CASCADE;
DROP TABLE IF EXISTS public.feed CASCADE;

-- ============================================================================
-- STEP 6: Drop enums
-- ============================================================================

DROP TYPE IF EXISTS public.feed_status CASCADE;
DROP TYPE IF EXISTS public.feed_visibility CASCADE;

-- ============================================================================
-- STEP 7: Revoke grants (only if tables exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed') THEN
    REVOKE ALL ON public.feed FROM anon;
    REVOKE ALL ON public.feed FROM authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_comments') THEN
    REVOKE ALL ON public.feed_comments FROM anon;
    REVOKE ALL ON public.feed_comments FROM authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_views') THEN
    REVOKE ALL ON public.feed_views FROM anon;
    REVOKE ALL ON public.feed_views FROM authenticated;
  END IF;
END $$;

