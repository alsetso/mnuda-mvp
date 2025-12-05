-- Fix posts INSERT RLS policy
-- The issue: WITH CHECK clause in INSERT policies can have issues with auth.uid()
-- Solution: Use SECURITY DEFINER function to bypass RLS on accounts/profiles tables

-- ============================================================================
-- STEP 1: Create or update user_owns_profile function with SECURITY DEFINER
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
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- SECURITY DEFINER allows this function to bypass RLS on accounts/profiles tables
  -- This function runs with the privileges of the function owner (postgres)
  -- Use explicit schema qualification and bypass RLS by using SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  );
END;
$$;

-- Ensure function is owned by postgres for SECURITY DEFINER to work
DO $$
BEGIN
  -- Only change owner if not already postgres
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'user_owns_profile'
    AND p.proowner != (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  ) THEN
    ALTER FUNCTION public.user_owns_profile(UUID) OWNER TO postgres;
  END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 2: Fix posts INSERT policy - use direct check that bypasses RLS
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "posts_insert" ON public.posts;

-- Recreate with direct EXISTS check using SECURITY DEFINER pattern
-- The key is to check accounts.user_id directly, bypassing RLS via function
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.user_owns_profile(posts.profile_id)
    AND posts.visibility IN ('public'::public.post_visibility, 'members_only'::public.post_visibility, 'draft'::public.post_visibility)
  );

-- ============================================================================
-- STEP 3: Also fix UPDATE policy for consistency
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "posts_update" ON public.posts;

-- Recreate with SECURITY DEFINER function
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND public.user_owns_profile(posts.profile_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.user_owns_profile(posts.profile_id)
    AND posts.visibility IN ('public', 'members_only', 'draft')
  );

-- ============================================================================
-- STEP 4: Also fix DELETE policy for consistency
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- Recreate with SECURITY DEFINER function
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND public.user_owns_profile(posts.profile_id)
  );

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON POLICY "posts_insert" ON public.posts IS 
  'Allows authenticated users to insert posts for profiles they own. Uses SECURITY DEFINER function to bypass RLS on accounts/profiles tables.';

