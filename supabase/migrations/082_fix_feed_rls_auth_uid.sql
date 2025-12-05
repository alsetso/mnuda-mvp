-- Fix RLS policies - ensure auth.uid() is available
-- The issue: user_owns_profile() might not see auth.uid() correctly
-- Solution: Make the function more explicit and add fallback checks

-- ============================================================================
-- STEP 1: Fix user_owns_profile function to be more explicit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID explicitly
  current_user_id := auth.uid();
  
  -- If no user, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if profile belongs to user's account
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    INNER JOIN public.accounts ON accounts.id = profiles.account_id
    WHERE profiles.id = profile_id
    AND accounts.user_id = current_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: Add a test function to verify RLS is working
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_feed_insert_permission(test_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  current_user_id UUID;
  owns_profile BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  owns_profile := public.user_owns_profile(test_profile_id);
  
  RETURN jsonb_build_object(
    'user_id', current_user_id,
    'profile_id', test_profile_id,
    'owns_profile', owns_profile,
    'auth_role', auth.role()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Ensure feed INSERT policy allows the insert
-- ============================================================================

-- Drop and recreate with DIRECT check (no helper function for INSERT)
-- Helper functions can have issues with auth.uid() in INSERT policies
DROP POLICY IF EXISTS "feed_insert" ON public.feed;

CREATE POLICY "feed_insert"
  ON public.feed FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated (auth.uid() should not be null for authenticated role)
    auth.uid() IS NOT NULL
    AND
    -- Direct check: profile must belong to user's account
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
-- STEP 4: Add comment
-- ============================================================================

COMMENT ON FUNCTION public.user_owns_profile(UUID) IS 'Checks if current authenticated user owns the profile. Returns false if auth.uid() is null.';

