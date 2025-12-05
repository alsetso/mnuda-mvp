-- Comprehensive RLS fix for all feed tables
-- Fixes: conflicting policies, missing policies, visibility vs status issues, anonymous access
-- Strategy: Drop all policies, recreate cleanly with proper ordering

-- ============================================================================
-- STEP 1: Drop ALL existing feed table policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view published feed posts" ON public.feed;
DROP POLICY IF EXISTS "Users can view own feed posts" ON public.feed;
DROP POLICY IF EXISTS "Users can insert own feed posts" ON public.feed;
DROP POLICY IF EXISTS "Users can update own feed posts" ON public.feed;
DROP POLICY IF EXISTS "Users can delete own feed posts" ON public.feed;
DROP POLICY IF EXISTS "Admins can view all feed posts" ON public.feed;
DROP POLICY IF EXISTS "Admins can update all feed posts" ON public.feed;
DROP POLICY IF EXISTS "Admins can delete all feed posts" ON public.feed;
DROP POLICY IF EXISTS "Anonymous can view public feed posts" ON public.feed;
DROP POLICY IF EXISTS "Authenticated users can view public and members_only posts" ON public.feed;

-- ============================================================================
-- STEP 2: Recreate feed table policies (clean, ordered, non-conflicting)
-- ============================================================================

-- Policy 1: Anonymous users can view public posts (MUST be first for anon)
CREATE POLICY "feed_anon_view_public"
  ON public.feed
  FOR SELECT
  TO anon
  USING (visibility = 'public'::public.feed_visibility);

-- Policy 2: Authenticated users can view public and members_only posts
CREATE POLICY "feed_authenticated_view_visible"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.feed_visibility
    OR visibility = 'members_only'::public.feed_visibility
  );

-- Policy 3: Users can view their own posts (including drafts/private)
CREATE POLICY "feed_users_view_own"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Policy 4: Admins can view all posts
CREATE POLICY "feed_admins_view_all"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy 5: Users can insert their own posts
CREATE POLICY "feed_users_insert_own"
  ON public.feed
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
    AND visibility IN ('public', 'members_only', 'draft')
  );

-- Policy 6: Users can update their own posts
CREATE POLICY "feed_users_update_own"
  ON public.feed
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Policy 7: Users can delete their own posts
CREATE POLICY "feed_users_delete_own"
  ON public.feed
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Policy 8: Admins can update all posts
CREATE POLICY "feed_admins_update_all"
  ON public.feed
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy 9: Admins can delete all posts
CREATE POLICY "feed_admins_delete_all"
  ON public.feed
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: Drop ALL existing feed_likes policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view likes on published posts" ON public.feed_likes;
DROP POLICY IF EXISTS "Users can like published posts" ON public.feed_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON public.feed_likes;
DROP POLICY IF EXISTS "Admins can view all likes" ON public.feed_likes;
DROP POLICY IF EXISTS "Admins can delete any like" ON public.feed_likes;
DROP POLICY IF EXISTS "Users can view likes on visible posts" ON public.feed_likes;
DROP POLICY IF EXISTS "Users can like visible posts" ON public.feed_likes;
DROP POLICY IF EXISTS "Anonymous can view likes on public posts" ON public.feed_likes;
DROP POLICY IF EXISTS "Authenticated users can view likes on visible posts" ON public.feed_likes;

-- ============================================================================
-- STEP 4: Recreate feed_likes policies (using visibility)
-- ============================================================================

-- Policy 1: Anonymous users can view likes on public posts
CREATE POLICY "feed_likes_anon_view_public"
  ON public.feed_likes
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND feed.visibility = 'public'::public.feed_visibility
    )
  );

-- Policy 2: Authenticated users can view likes on visible posts
CREATE POLICY "feed_likes_authenticated_view_visible"
  ON public.feed_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR feed.visibility = 'members_only'::public.feed_visibility
      )
    )
  );

-- Policy 3: Users can like visible posts (public or members_only)
CREATE POLICY "feed_likes_users_insert_visible"
  ON public.feed_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR feed.visibility = 'members_only'::public.feed_visibility
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_likes.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Policy 4: Users can unlike their own likes
CREATE POLICY "feed_likes_users_delete_own"
  ON public.feed_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_likes.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Policy 5: Admins can view all likes
CREATE POLICY "feed_likes_admins_view_all"
  ON public.feed_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy 6: Admins can delete any like
CREATE POLICY "feed_likes_admins_delete_all"
  ON public.feed_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 5: Ensure feed_comments policies are correct (verify migration 079 applied)
-- ============================================================================

-- Drop any remaining old policies
DROP POLICY IF EXISTS "Users can view comments on published posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can comment on published posts" ON public.feed_comments;

-- Ensure the helper function exists (from migration 079)
CREATE OR REPLACE FUNCTION public.check_parent_comment_exists(
  parent_id UUID,
  feed_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.feed_comments
    WHERE id = parent_id
    AND feed_id = feed_id_param
  );
END;
$$;

-- Ensure feed_comments policies are correct (recreate if needed)
-- These should exist from migration 079, but ensure they're correct by dropping and recreating
DROP POLICY IF EXISTS "Anonymous can view comments on public posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Authenticated users can view comments on visible posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can view comments on own posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can insert comments on visible posts" ON public.feed_comments;

CREATE POLICY "Anonymous can view comments on public posts"
  ON public.feed_comments
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND feed.visibility = 'public'::public.feed_visibility
    )
  );

CREATE POLICY "Authenticated users can view comments on visible posts"
  ON public.feed_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR feed.visibility = 'members_only'::public.feed_visibility
      )
    )
  );

CREATE POLICY "Users can view comments on own posts"
  ON public.feed_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = feed.profile_id
        AND EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.id = profiles.account_id
          AND accounts.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert comments on visible posts"
  ON public.feed_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR feed.visibility = 'members_only'::public.feed_visibility
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_comments.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
    AND
    (
      feed_comments.parent_comment_id IS NULL
      OR public.check_parent_comment_exists(feed_comments.parent_comment_id, feed_comments.feed_id)
    )
  );

-- ============================================================================
-- STEP 6: Grant necessary permissions
-- ============================================================================

-- Ensure anon can SELECT from feed (for public posts)
GRANT SELECT ON public.feed TO anon;
GRANT SELECT ON public.feed_likes TO anon;
GRANT SELECT ON public.feed_comments TO anon;

-- Authenticated users already have permissions from previous migrations
-- But ensure they're correct
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.feed_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_comments TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON POLICY "feed_anon_view_public" ON public.feed IS 'Allows anonymous users to view public feed posts';
COMMENT ON POLICY "feed_authenticated_view_visible" ON public.feed IS 'Allows authenticated users to view public and members_only posts';
COMMENT ON POLICY "feed_users_view_own" ON public.feed IS 'Allows users to view their own posts including drafts';
COMMENT ON POLICY "feed_likes_anon_view_public" ON public.feed_likes IS 'Allows anonymous users to view likes on public posts';
COMMENT ON POLICY "feed_likes_authenticated_view_visible" ON public.feed_likes IS 'Allows authenticated users to view likes on visible posts';

