-- Fix user_owns_profile function to use SECURITY DEFINER
-- Migration 091 removed SECURITY DEFINER, which is required for the function
-- to bypass RLS when checking profile ownership in INSERT policies
--
-- The issue: Without SECURITY DEFINER, the function is subject to RLS on
-- accounts/profiles tables, which can prevent it from checking ownership
-- during INSERT operations, causing "unauthorized" errors even for valid users.

-- ============================================================================
-- STEP 1: Recreate user_owns_profile with SECURITY DEFINER
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
  -- This is critical for INSERT policies where RLS might block the ownership check
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  );
END;
$$;

-- ============================================================================
-- STEP 2: Ensure function is owned by postgres for SECURITY DEFINER to work
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Grant execute permission
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 4: Add comment explaining why SECURITY DEFINER is needed
-- ============================================================================

COMMENT ON FUNCTION public.user_owns_profile(UUID) IS 
  'Checks if the current authenticated user owns the specified profile. Uses SECURITY DEFINER to bypass RLS on accounts/profiles tables, which is required for INSERT policies to work correctly.';







