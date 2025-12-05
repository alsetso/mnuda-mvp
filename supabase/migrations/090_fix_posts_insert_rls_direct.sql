-- Fix posts INSERT RLS policy with SECURITY DEFINER function
-- The function must truly bypass RLS to work in WITH CHECK clauses

-- ============================================================================
-- STEP 1: Ensure user_owns_profile function is SECURITY DEFINER and bypasses RLS
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS public.user_owns_profile(UUID);

CREATE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  result BOOLEAN;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- SECURITY DEFINER runs with postgres privileges, bypassing RLS
  -- This allows us to read from accounts/profiles even if RLS would block it
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  ) INTO result;
  
  RETURN COALESCE(result, FALSE);
END;
$$;

-- Ensure function is owned by postgres (required for SECURITY DEFINER)
ALTER FUNCTION public.user_owns_profile(UUID) OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 2: Drop and recreate posts_insert policy using SECURITY DEFINER function
-- ============================================================================

DROP POLICY IF EXISTS "posts_insert" ON public.posts;

-- Use SECURITY DEFINER function - this bypasses RLS on accounts/profiles
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.user_owns_profile(posts.profile_id)
    AND posts.visibility IN ('public'::public.post_visibility, 'members_only'::public.post_visibility, 'draft'::public.post_visibility)
  );

-- ============================================================================
-- STEP 2: Verify accounts table allows SELECT for authenticated users
-- ============================================================================

-- Check if accounts table has SELECT policy for authenticated users
-- If not, we need to ensure the accounts table is readable for the RLS check
DO $$
BEGIN
  -- Check if there's a SELECT policy on accounts for authenticated
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'accounts'
    AND policyname LIKE '%select%'
    AND roles = ARRAY['authenticated']
  ) THEN
    -- Create a basic SELECT policy if it doesn't exist
    -- Users can see their own account
    CREATE POLICY "Users can view own account"
      ON public.accounts FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify profiles table allows SELECT for authenticated users
-- ============================================================================

-- Check if profiles table has SELECT policy for authenticated users
DO $$
BEGIN
  -- Check if there's a SELECT policy on profiles for authenticated
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname LIKE '%select%'
    AND roles = ARRAY['authenticated']
  ) THEN
    -- Create a basic SELECT policy if it doesn't exist
    -- Users can see profiles from their own account
    CREATE POLICY "Users can view own profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.id = profiles.account_id
          AND accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

