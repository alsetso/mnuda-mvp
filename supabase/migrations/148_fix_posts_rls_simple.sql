-- Simple RLS for posts table
-- Drop everything and start fresh with the simplest working solution

-- ============================================================================
-- STEP 1: Drop all existing policies
-- ============================================================================

DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- ============================================================================
-- STEP 2: Create simple SECURITY DEFINER function
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_owns_account(UUID);

CREATE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Return false if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user owns the account (bypasses RLS via SECURITY DEFINER)
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = account_id AND user_id = auth.uid()
  );
END;
$$;

ALTER FUNCTION public.user_owns_account(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.user_owns_account(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 3: Grant base permissions (required for RLS to work)
-- ============================================================================

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- ============================================================================
-- STEP 4: Create simple RLS policies
-- ============================================================================

-- Anonymous: only public posts
CREATE POLICY "posts_select_anon" ON public.posts
  FOR SELECT TO anon
  USING (visibility = 'public');

-- Authenticated: public posts or own posts
CREATE POLICY "posts_select_authenticated" ON public.posts
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR public.user_owns_account(account_id));

-- Authenticated: insert own posts
CREATE POLICY "posts_insert" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_account(account_id));

-- Authenticated: update own posts
CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated
  USING (public.user_owns_account(account_id))
  WITH CHECK (public.user_owns_account(account_id));

-- Authenticated: delete own posts
CREATE POLICY "posts_delete" ON public.posts
  FOR DELETE TO authenticated
  USING (public.user_owns_account(account_id));
