-- Ideal, perfect, simplest but complete RLS for posts table
-- This is the cleanest approach that works WITH RLS, not bypassing it

-- ============================================================================
-- CORE PRINCIPLE
-- ============================================================================
-- RLS policies should be:
-- 1. Simple and readable
-- 2. Use helper functions for complex checks (reusability)
-- 3. Work WITH RLS, not against it
-- 4. Explicit about what they allow/deny

-- ============================================================================
-- STEP 1: Helper function to check profile ownership
-- ============================================================================
-- This function checks if the current user owns a profile
-- It reads from accounts/profiles tables, so it needs to work WITH their RLS
-- Since accounts RLS allows users to see their own account (user_id = auth.uid()),
-- and profiles RLS allows users to see profiles from their account,
-- we can use a direct check that respects those policies

CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- If no authenticated user, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if profile exists and belongs to user's account
  -- This works WITH RLS because:
  -- - accounts table RLS allows SELECT where user_id = auth.uid()
  -- - profiles table RLS allows SELECT where account belongs to user
  -- So this query will only return true if the profile actually belongs to the user
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated;

-- ============================================================================
-- STEP 2: SELECT Policies (Who can read posts)
-- ============================================================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;

-- Anonymous users: Can only see public posts
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public'::public.post_visibility);

-- Authenticated users: Can see public + members_only posts, OR their own posts (including drafts)
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
-- STEP 3: INSERT Policy (Who can create posts)
-- ============================================================================

DROP POLICY IF EXISTS "posts_insert" ON public.posts;

-- Authenticated users can insert posts for profiles they own
-- Must be authenticated, must own the profile, visibility must be valid
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Must own the profile
    public.user_owns_profile(posts.profile_id)
    AND
    -- Visibility must be one of the allowed values
    posts.visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );

-- ============================================================================
-- STEP 4: UPDATE Policy (Who can edit posts)
-- ============================================================================

DROP POLICY IF EXISTS "posts_update" ON public.posts;

-- Authenticated users can update posts from profiles they own
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- Can only update posts they own
    public.user_owns_profile(posts.profile_id)
  )
  WITH CHECK (
    -- After update, must still own the profile
    public.user_owns_profile(posts.profile_id)
    AND
    -- Visibility must still be valid
    posts.visibility IN (
      'public'::public.post_visibility,
      'members_only'::public.post_visibility,
      'draft'::public.post_visibility
    )
  );

-- ============================================================================
-- STEP 5: DELETE Policy (Who can delete posts)
-- ============================================================================

DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- Authenticated users can delete posts from profiles they own
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    -- Can only delete posts they own
    public.user_owns_profile(posts.profile_id)
  );

-- ============================================================================
-- SUMMARY: Why This Works
-- ============================================================================
-- 
-- 1. **SELECT**: 
--    - Anonymous: Only public posts (simple visibility check)
--    - Authenticated: Public/members_only OR own posts (uses helper function)
--
-- 2. **INSERT**:
--    - Must be authenticated
--    - Must own the profile (helper function checks this)
--    - Visibility must be valid
--    - The helper function works WITH accounts/profiles RLS:
--      * accounts RLS allows SELECT where user_id = auth.uid()
--      * profiles RLS allows SELECT where account belongs to user
--      * So the EXISTS check will only succeed if profile actually belongs to user
--
-- 3. **UPDATE/DELETE**:
--    - Must own the profile (same helper function)
--    - UPDATE also validates visibility after change
--
-- **Key Insight**: The helper function doesn't bypass RLS - it works WITH it.
-- When we query accounts/profiles in the function, RLS still applies.
-- But since accounts RLS allows users to see their own account, and profiles
-- RLS allows users to see profiles from their account, the EXISTS check will
-- only return true if the profile actually belongs to the user.
--
-- This is the simplest, cleanest approach that respects RLS throughout.







