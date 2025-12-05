-- Fix posts RLS policies to properly handle visibility: public, members_only, and draft
-- Users should be able to see their own drafts

-- ============================================================================
-- STEP 1: Ensure user_owns_profile function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated;

-- ============================================================================
-- STEP 2: Update SELECT policies to allow users to see their own drafts
-- ============================================================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;

-- Anonymous: Can only view public posts
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public'::public.post_visibility);

-- Authenticated: Can view public and members_only posts, OR their own posts (including drafts)
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    -- Public or members_only posts (visible to all authenticated users)
    visibility IN ('public'::public.post_visibility, 'members_only'::public.post_visibility)
    OR
    -- OR posts from profiles they own (including drafts)
    public.user_owns_profile(profile_id)
  );

-- ============================================================================
-- STEP 3: Ensure UPDATE policy allows visibility changes to all three values
-- ============================================================================

DROP POLICY IF EXISTS "posts_update" ON public.posts;

CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- User must own the profile
    public.user_owns_profile(profile_id)
  )
  WITH CHECK (
    -- User must own the profile
    public.user_owns_profile(profile_id)
    AND
    -- Visibility must be one of the allowed values
    visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );

-- ============================================================================
-- STEP 4: Ensure INSERT policy allows all three visibility values
-- ============================================================================

DROP POLICY IF EXISTS "posts_insert" ON public.posts;

CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must own the profile
    public.user_owns_profile(profile_id)
    AND
    -- Visibility must be one of the allowed values
    visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );







