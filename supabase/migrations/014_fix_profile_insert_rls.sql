-- Fix profile INSERT RLS policy to use direct check instead of function
-- This resolves 403 errors when creating profiles

-- ============================================================================
-- STEP 1: Update user_owns_account function to ensure proper search_path
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = account_id
    AND accounts.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================================
-- STEP 2: Update profile INSERT policy to use direct check
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;

-- Recreate with direct EXISTS check (more reliable than function in INSERT context)
CREATE POLICY "Users can insert own profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: Add missing admin INSERT policy for profiles
-- ============================================================================

-- Drop if exists
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create admin INSERT policy
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================

COMMENT ON POLICY "Users can insert own profiles" ON public.profiles IS 
  'Users can insert profiles for their own account. Uses direct EXISTS check for reliability.';

COMMENT ON POLICY "Admins can insert profiles" ON public.profiles IS 
  'Admins can insert profiles for any account.';

