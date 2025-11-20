-- Fix profile INSERT RLS policy
-- The issue is that the WITH CHECK clause needs to properly reference the NEW row values
-- and the accounts table check might be blocked by RLS

-- ============================================================================
-- STEP 1: Ensure user_owns_account function has proper permissions
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS public.user_owns_account(UUID);

CREATE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER allows this function to bypass RLS on accounts table
  -- This function runs with the privileges of the function owner (postgres)
  -- so it can read from accounts table even if RLS would normally block it
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = account_id
    AND accounts.user_id = auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_owns_account(UUID) TO authenticated;

-- Ensure function is owned by postgres (superuser) for SECURITY DEFINER to work properly
ALTER FUNCTION public.user_owns_account(UUID) OWNER TO postgres;

-- ============================================================================
-- STEP 2: Update profile INSERT policy
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;

-- Use SECURITY DEFINER function - this bypasses RLS on accounts table
-- The function runs with postgres privileges, so it can check account ownership
-- even if the accounts table RLS would normally block the check
CREATE POLICY "Users can insert own profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_owns_account(profiles.account_id)
  );

-- ============================================================================
-- STEP 3: Ensure admin policy exists
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================

COMMENT ON POLICY "Users can insert own profiles" ON public.profiles IS 
  'Users can create profiles for their own account. Uses user_owns_account() SECURITY DEFINER function which bypasses RLS on accounts table.';

COMMENT ON POLICY "Admins can insert profiles" ON public.profiles IS 
  'Admins can create profiles for any account.';

