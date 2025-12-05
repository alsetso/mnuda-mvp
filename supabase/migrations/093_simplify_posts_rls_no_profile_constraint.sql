-- Simplify posts RLS - remove profile ownership requirement
-- Allow any authenticated user to insert posts with any profile_id
-- Remove foreign key constraint so posts aren't tied to profiles table

-- ============================================================================
-- STEP 1: Drop foreign key constraint (keep profile_id column for reference)
-- ============================================================================

ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_profile_id_fkey;

-- ============================================================================
-- STEP 2: Simplify INSERT policy - only require authentication
-- ============================================================================

DROP POLICY IF EXISTS "posts_insert" ON public.posts;

CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only require authentication - no profile ownership check
    auth.uid() IS NOT NULL
    AND
    -- Visibility must be valid
    posts.visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );

COMMENT ON POLICY "posts_insert" ON public.posts IS 
  'Allows any authenticated user to insert posts with any profile_id. No profile ownership check required.';

-- ============================================================================
-- STEP 3: Update SELECT policy to allow viewing posts by any profile_id
-- ============================================================================

DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;

CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    -- Public or members_only posts (visible to all authenticated users)
    visibility IN ('public'::public.post_visibility, 'members_only'::public.post_visibility)
    -- OR any draft posts (users can see all drafts - no ownership check)
    OR visibility = 'draft'::public.post_visibility
  );

COMMENT ON POLICY "posts_select_authenticated" ON public.posts IS 
  'Authenticated users can see public, members_only, and all draft posts. No profile ownership check.';

-- ============================================================================
-- STEP 4: Simplify UPDATE policy
-- ============================================================================

DROP POLICY IF EXISTS "posts_update" ON public.posts;

CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- Any authenticated user can update any post
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- After update, must still be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Visibility must still be valid
    posts.visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );

COMMENT ON POLICY "posts_update" ON public.posts IS 
  'Allows any authenticated user to update any post. No ownership check.';

-- ============================================================================
-- STEP 5: Simplify DELETE policy
-- ============================================================================

DROP POLICY IF EXISTS "posts_delete" ON public.posts;

CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    -- Any authenticated user can delete any post
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "posts_delete" ON public.posts IS 
  'Allows any authenticated user to delete any post. No ownership check.';







