-- Fix infinite recursion in feed_comments RLS policies
-- Update policies to use visibility instead of status
-- Ensure users can comment on their own posts

-- ============================================================================
-- STEP 1: Drop existing feed_comments policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view comments on published posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can comment on published posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can insert comments on visible posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Anonymous can view comments on public posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Authenticated users can view comments on visible posts" ON public.feed_comments;
DROP POLICY IF EXISTS "Users can comment on visible posts with profile" ON public.feed_comments;

-- ============================================================================
-- STEP 2: Create helper function to check parent comment (bypasses RLS)
-- ============================================================================

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
  -- This function bypasses RLS to check if parent comment exists
  -- Only checks existence, doesn't expose data
  RETURN EXISTS (
    SELECT 1 FROM public.feed_comments
    WHERE id = parent_id
    AND feed_id = feed_id_param
  );
END;
$$;

-- ============================================================================
-- STEP 3: Create new SELECT policies for feed_comments
-- ============================================================================

-- Anonymous users can view comments on public posts
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

-- Authenticated users can view comments on visible posts (public or members_only)
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

-- Users can view comments on their own posts (even if draft/private)
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

-- ============================================================================
-- STEP 4: Create new INSERT policy for feed_comments (fixes recursion)
-- ============================================================================

CREATE POLICY "Users can insert comments on visible posts"
  ON public.feed_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the feed post is visible (public or members_only, not draft)
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR feed.visibility = 'members_only'::public.feed_visibility
      )
    )
    AND
    -- Verify the profile belongs to the authenticated user
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
    -- If replying to a comment, verify parent comment exists (using function to avoid recursion)
    (
      feed_comments.parent_comment_id IS NULL
      OR public.check_parent_comment_exists(feed_comments.parent_comment_id, feed_comments.feed_id)
    )
  );

-- ============================================================================
-- STEP 5: Keep existing UPDATE and DELETE policies (they're fine)
-- ============================================================================

-- These policies don't have recursion issues, so we keep them
-- "Users can update own comments" - already exists
-- "Users can delete own comments" - already exists
-- Admin policies - already exist

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON FUNCTION public.check_parent_comment_exists IS 'Helper function to check parent comment existence without triggering RLS recursion. Uses SECURITY DEFINER to bypass RLS for the check.';

