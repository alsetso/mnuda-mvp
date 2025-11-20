-- Simplify onboarding_questions RLS - already simple, just ensure it's correct
-- Questions are reference data: all authenticated users can read
-- Only admins can modify

-- ============================================================================
-- STEP 1: Ensure is_admin() function is correct
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

-- ============================================================================
-- STEP 2: Simple RLS policies for onboarding_questions
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can insert onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can update onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Admins can delete onboarding questions" ON public.onboarding_questions;
DROP POLICY IF EXISTS "Anyone authenticated can view onboarding questions" ON public.onboarding_questions;

-- All authenticated users can view (they're reference data, server filters by profile_type)
CREATE POLICY "Authenticated users can view onboarding questions"
  ON public.onboarding_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert onboarding questions"
  ON public.onboarding_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update onboarding questions"
  ON public.onboarding_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete onboarding questions"
  ON public.onboarding_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

-- Grant to authenticated role (for RLS-protected access)
GRANT SELECT ON public.onboarding_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.onboarding_questions TO authenticated;

-- Grant to service_role (for admin operations that bypass RLS)
-- Service role needs full access since it bypasses RLS
GRANT ALL ON public.onboarding_questions TO service_role;

