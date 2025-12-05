-- Drop posts and post_comments tables and all related objects
-- This will remove all posts, comments, and related triggers/functions

-- ============================================================================
-- STEP 1: Drop triggers first (they depend on tables)
-- ============================================================================

DROP TRIGGER IF EXISTS update_posts_comments_count_on_insert ON public.post_comments;
DROP TRIGGER IF EXISTS update_posts_comments_count_on_delete ON public.post_comments;
DROP TRIGGER IF EXISTS update_post_media_type ON public.posts;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;

-- ============================================================================
-- STEP 2: Drop functions (they may be used by triggers or policies)
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_posts_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.determine_post_media_type(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.update_post_media_type() CASCADE;
DROP FUNCTION IF EXISTS public.validate_post_media(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_post_media_summary(uuid) CASCADE;

-- ============================================================================
-- STEP 3: Drop views that depend on posts
-- ============================================================================

DROP VIEW IF EXISTS public.post_media_stats CASCADE;

-- ============================================================================
-- STEP 4: Drop RLS policies (they depend on tables)
-- ============================================================================

-- Drop post_comments policies (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_comments') THEN
    DROP POLICY IF EXISTS "post_comments_select_anon" ON public.post_comments;
    DROP POLICY IF EXISTS "post_comments_select_authenticated" ON public.post_comments;
    DROP POLICY IF EXISTS "post_comments_insert" ON public.post_comments;
    DROP POLICY IF EXISTS "post_comments_update" ON public.post_comments;
    DROP POLICY IF EXISTS "post_comments_delete" ON public.post_comments;
  END IF;
END $$;

-- Drop posts policies (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
    DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
    DROP POLICY IF EXISTS "posts_insert" ON public.posts;
    DROP POLICY IF EXISTS "posts_update" ON public.posts;
    DROP POLICY IF EXISTS "posts_delete" ON public.posts;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Drop helper functions used by RLS policies
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_owns_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.post_is_visible(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_parent_comment_exists(uuid, uuid) CASCADE;

-- ============================================================================
-- STEP 6: Drop tables (CASCADE will handle remaining dependencies)
-- ============================================================================

DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- ============================================================================
-- STEP 7: Drop types/enums if they're not used elsewhere
-- ============================================================================

-- Only drop if not used by other tables
-- Check first: SELECT * FROM pg_type WHERE typname IN ('post_visibility', 'post_media_type');
-- If not used elsewhere, uncomment:
-- DROP TYPE IF EXISTS public.post_media_type CASCADE;
-- DROP TYPE IF EXISTS public.post_visibility CASCADE;

-- ============================================================================
-- STEP 8: Revoke grants
-- ============================================================================

-- Grants are automatically dropped with tables, but we can be explicit:
-- REVOKE ALL ON public.posts FROM anon, authenticated;
-- REVOKE ALL ON public.post_comments FROM anon, authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- This migration will:
-- 1. Remove all posts and comments
-- 2. Drop all related triggers and functions
-- 3. Drop all RLS policies
-- 4. Drop the tables themselves
--
-- Storage files in feed-images bucket will NOT be deleted by this migration.
-- To clean up storage, manually delete files via Dashboard or use storage API.
--
-- To recreate tables, run the original migrations that created them.

