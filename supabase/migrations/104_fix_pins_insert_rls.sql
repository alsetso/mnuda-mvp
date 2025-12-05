-- Fix pins INSERT RLS policy
-- The issue: Nested EXISTS queries in WITH CHECK clause may not work correctly
-- Solution: Use user_owns_profile() helper function or direct check

-- ============================================================================
-- STEP 1: Ensure user_owns_profile function exists and is correct
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
-- STEP 2: Fix pins INSERT policy to use helper function
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own pins" ON public.pins;

-- Policy: Users can insert their own pins (must have tag_id and profile_id)
-- Use user_owns_profile() helper function which is SECURITY DEFINER and bypasses RLS
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IS NOT NULL AND
    tag_id IS NOT NULL AND
    public.user_owns_profile(profile_id)
  );

-- ============================================================================
-- STEP 3: Ensure admin policy still works
-- ============================================================================

-- Admin policy should already exist, but ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'pins'
    AND policyname = 'Admins can insert pins'
  ) THEN
    CREATE POLICY "Admins can insert pins"
      ON public.pins
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.user_id = auth.uid()
          AND accounts.role = 'admin'
        )
      );
  END IF;
END $$;







