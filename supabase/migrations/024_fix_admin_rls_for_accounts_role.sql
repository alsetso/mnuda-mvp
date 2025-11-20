-- Fix admin RLS policies to use accounts.role and accounts.user_id
-- Ensure is_admin() function uses the correct columns

-- ============================================================================
-- STEP 1: Update is_admin() function to use accounts.user_id and accounts.role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.user_id = auth.uid()
    AND accounts.role = 'admin'::public.account_role
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS 
  'Checks if the current authenticated user has admin role in accounts table. Uses accounts.user_id and accounts.role.';

-- ============================================================================
-- STEP 2: Ensure onboarding_questions RLS policies use is_admin()
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can insert onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can update onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can delete onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Anyone authenticated can view onboarding questions" ON public.onboarding_questions;

-- All authenticated users can view onboarding questions (they're reference data)
CREATE POLICY "Authenticated users can view onboarding questions"
  ON public.onboarding_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert onboarding questions
CREATE POLICY "Admins can insert onboarding questions"
  ON public.onboarding_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update onboarding questions
CREATE POLICY "Admins can update onboarding questions"
  ON public.onboarding_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete onboarding questions
CREATE POLICY "Admins can delete onboarding questions"
  ON public.onboarding_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 3: Grant necessary permissions
-- ============================================================================

-- Ensure authenticated users can select (should already exist)
GRANT SELECT ON public.onboarding_questions TO authenticated;

-- Grant admin-only permissions (INSERT, UPDATE, DELETE are controlled by RLS)
GRANT INSERT, UPDATE, DELETE ON public.onboarding_questions TO authenticated;

