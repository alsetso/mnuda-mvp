-- Fix posts RLS policies to use SECURITY DEFINER function
-- This ensures posts INSERT/UPDATE/DELETE work even when accounts table has RLS
-- Works with the simple posts table schema (id, account_id, title, content, visibility, created_at, updated_at)

-- ============================================================================
-- STEP 1: Ensure user_owns_account helper function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER runs with postgres privileges, bypassing RLS
  -- This allows us to check account ownership even if accounts table has RLS
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = account_id
    AND accounts.user_id = auth.uid()
  );
END;
$$;

-- Ensure function is owned by postgres (required for SECURITY DEFINER)
ALTER FUNCTION public.user_owns_account(UUID) OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_account(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 2: Drop existing posts RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- ============================================================================
-- STEP 3: Create improved SELECT policies
-- ============================================================================

-- Anonymous: Can view public posts only
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public'::public.post_visibility);

-- Authenticated: Can view public posts and own posts (including drafts)
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.post_visibility OR
    public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 4: Create improved INSERT policy (fixes permission denied)
-- ============================================================================

-- Authenticated: Can insert posts for own account
-- Uses SECURITY DEFINER function to bypass accounts table RLS
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the account (uses SECURITY DEFINER function)
    AND public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 5: Create improved UPDATE policy
-- ============================================================================

-- Authenticated: Can update own posts
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  )
  WITH CHECK (
    -- Must still own the account after update
    public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 6: Create improved DELETE policy
-- ============================================================================

-- Authenticated: Can delete own posts
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON POLICY "posts_select_anon" ON public.posts IS 
  'Anonymous users can view public posts only';

COMMENT ON POLICY "posts_select_authenticated" ON public.posts IS 
  'Authenticated users can view public posts and own posts (including drafts)';

COMMENT ON POLICY "posts_insert" ON public.posts IS 
  'Authenticated users can create posts for their own account. Uses SECURITY DEFINER function to bypass accounts RLS.';

COMMENT ON POLICY "posts_update" ON public.posts IS 
  'Authenticated users can update their own posts';

COMMENT ON POLICY "posts_delete" ON public.posts IS 
  'Authenticated users can delete their own posts';

