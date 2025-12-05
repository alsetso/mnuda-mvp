-- SIMPLIFIED Feed RLS - Use helper functions, remove nested EXISTS queries
-- The problem: We're overcomplicating with nested EXISTS queries
-- Solution: Use existing helper functions and simple checks

-- ============================================================================
-- STEP 1: Ensure helper function exists (from migration 013)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    INNER JOIN public.accounts ON accounts.id = profiles.account_id
    WHERE profiles.id = profile_id
    AND accounts.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: Drop ALL feed table policies (comprehensive drop)
-- ============================================================================

-- Drop all possible policy names
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed', r.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Create SIMPLE feed policies
-- ============================================================================

-- Anonymous: View public posts only
CREATE POLICY "feed_select_anon"
  ON public.feed FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Authenticated: View public + members_only posts OR own posts
CREATE POLICY "feed_select_authenticated"
  ON public.feed FOR SELECT
  TO authenticated
  USING (
    visibility IN ('public', 'members_only')
    OR public.user_owns_profile(profile_id)
  );

-- Insert: Must own the profile (direct check, no helper function)
CREATE POLICY "feed_insert"
  ON public.feed FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = feed.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND visibility IN ('public', 'members_only', 'draft')
  );

-- Update: Must own the profile
CREATE POLICY "feed_update"
  ON public.feed FOR UPDATE
  TO authenticated
  USING (public.user_owns_profile(profile_id))
  WITH CHECK (public.user_owns_profile(profile_id));

-- Delete: Must own the profile
CREATE POLICY "feed_delete"
  ON public.feed FOR DELETE
  TO authenticated
  USING (public.user_owns_profile(profile_id));

-- ============================================================================
-- STEP 4: Drop ALL feed_likes policies (comprehensive drop)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed_likes'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_likes', r.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Create SIMPLE feed_likes policies
-- ============================================================================

-- Helper function to check if feed post is visible (bypasses RLS for check)
CREATE OR REPLACE FUNCTION public.feed_post_is_visible(feed_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  post_visibility public.feed_visibility;
  post_profile_id UUID;
BEGIN
  SELECT visibility, profile_id INTO post_visibility, post_profile_id
  FROM public.feed
  WHERE id = feed_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Public posts are always visible
  IF post_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Members only posts are visible to authenticated users
  IF post_visibility = 'members_only' AND auth.role() = 'authenticated' THEN
    RETURN TRUE;
  END IF;
  
  -- Users can see their own posts regardless of visibility
  IF public.user_owns_profile(post_profile_id) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Anonymous: View likes on public posts
CREATE POLICY "feed_likes_select_anon"
  ON public.feed_likes FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND feed.visibility = 'public'
    )
  );

-- Authenticated: View likes on visible posts
CREATE POLICY "feed_likes_select_authenticated"
  ON public.feed_likes FOR SELECT
  TO authenticated
  USING (public.feed_post_is_visible(feed_id));

-- Insert: Post must be visible AND user must own profile (direct check)
CREATE POLICY "feed_likes_insert"
  ON public.feed_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    public.feed_post_is_visible(feed_id)
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = feed_likes.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Delete: Must own the profile
CREATE POLICY "feed_likes_delete"
  ON public.feed_likes FOR DELETE
  TO authenticated
  USING (public.user_owns_profile(profile_id));

-- ============================================================================
-- STEP 6: Ensure feed_comments policies are simple
-- ============================================================================

-- Drop all feed_comments policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'feed_comments'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.feed_comments', r.policyname);
  END LOOP;
END $$;

-- Simple comment policies
CREATE POLICY "feed_comments_select_anon"
  ON public.feed_comments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND feed.visibility = 'public'
    )
  );

CREATE POLICY "feed_comments_select_authenticated"
  ON public.feed_comments FOR SELECT
  TO authenticated
  USING (public.feed_post_is_visible(feed_id));

CREATE POLICY "feed_comments_insert"
  ON public.feed_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    public.feed_post_is_visible(feed_id)
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = feed_comments.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND (
      parent_comment_id IS NULL
      OR public.check_parent_comment_exists(parent_comment_id, feed_id)
    )
  );

-- Update/Delete policies already exist and are fine (they check profile ownership)

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT ON public.feed TO anon;
GRANT SELECT ON public.feed_likes TO anon;
GRANT SELECT ON public.feed_comments TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.feed_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_comments TO authenticated;

