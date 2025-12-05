-- Remove likes functionality and ensure post owners can edit
-- Drop feed_likes table, remove likes_count, fix UPDATE policy

-- ============================================================================
-- STEP 1: Drop feed_likes table and all related objects
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_feed_likes_count_on_insert ON public.feed_likes;
DROP TRIGGER IF EXISTS update_feed_likes_count_on_delete ON public.feed_likes;

-- Drop function
DROP FUNCTION IF EXISTS public.update_feed_likes_count();

-- Drop all policies
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

-- Drop table
DROP TABLE IF EXISTS public.feed_likes CASCADE;

-- ============================================================================
-- STEP 2: Remove likes_count from feed table
-- ============================================================================

ALTER TABLE public.feed
  DROP COLUMN IF EXISTS likes_count;

-- ============================================================================
-- STEP 3: Ensure UPDATE policy allows post owners to edit
-- ============================================================================

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "feed_update" ON public.feed;

-- Create explicit UPDATE policy - owners can edit their posts
CREATE POLICY "feed_update"
  ON public.feed FOR UPDATE
  TO authenticated
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Must own the profile that created the post
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = feed.profile_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- After update, must still own the profile
    auth.uid() IS NOT NULL
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = feed.profile_id
      AND accounts.user_id = auth.uid()
    )
    AND
    -- Visibility must be valid
    visibility IN ('public', 'members_only', 'draft')
  );

-- ============================================================================
-- STEP 4: Add index for performance on profile_id lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS feed_profile_id_idx ON public.feed(profile_id);

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON POLICY "feed_update" ON public.feed IS 'Allows post owners (users who own the profile_id) to update their own posts. Ensures auth.uid() is available and profile ownership is verified.';







