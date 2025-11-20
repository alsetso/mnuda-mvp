-- Optimize RLS policies for all tables
-- Simplifies and improves performance of row-level security

-- ============================================================================
-- STEP 1: Create helper function for checking profile ownership
-- ============================================================================

-- This function is more efficient than repeated EXISTS subqueries
CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    INNER JOIN public.accounts ON accounts.id = profiles.account_id
    WHERE profiles.id = profile_id
    AND accounts.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 2: Create helper function for checking account ownership
-- ============================================================================

-- More efficient than direct comparison in policies
-- SECURITY DEFINER allows function to bypass RLS on accounts table
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
-- STEP 3: Optimize accounts table RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own account record" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.accounts;

-- Users can view their own account (direct user_id check - most efficient)
CREATE POLICY "Users can view own account"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own account
CREATE POLICY "Users can update own account"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own account (via trigger, but allow explicit inserts)
CREATE POLICY "Users can insert own account"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all accounts
CREATE POLICY "Admins can update all accounts"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert accounts
CREATE POLICY "Admins can insert accounts"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 4: Optimize profiles table RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profiles (optimized with helper function)
CREATE POLICY "Users can view own profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.user_owns_profile(profiles.id));

-- Users can insert profiles for their own account
-- Use direct check as primary, function as fallback for efficiency
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

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_profile(profiles.id))
  WITH CHECK (public.user_owns_profile(profiles.id));

-- Users can delete their own profiles (but not the last one - enforced by trigger)
CREATE POLICY "Users can delete own profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.user_owns_profile(profiles.id));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 5: Optimize onboarding_answers table RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can insert own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can update own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can delete own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Admins can view all onboarding answers" ON public.onboarding_answers;

-- Users can view answers for their own profiles
CREATE POLICY "Users can view own onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (public.user_owns_profile(onboarding_answers.profile_id));

-- Users can insert answers for their own profiles
CREATE POLICY "Users can insert own onboarding answers"
  ON public.onboarding_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_profile(onboarding_answers.profile_id));

-- Users can update answers for their own profiles
CREATE POLICY "Users can update own onboarding answers"
  ON public.onboarding_answers
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_profile(onboarding_answers.profile_id))
  WITH CHECK (public.user_owns_profile(onboarding_answers.profile_id));

-- Users can delete answers for their own profiles
CREATE POLICY "Users can delete own onboarding answers"
  ON public.onboarding_answers
  FOR DELETE
  TO authenticated
  USING (public.user_owns_profile(onboarding_answers.profile_id));

-- Admins can view all onboarding answers
CREATE POLICY "Admins can view all onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all onboarding answers
CREATE POLICY "Admins can update all onboarding answers"
  ON public.onboarding_answers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete onboarding answers
CREATE POLICY "Admins can delete onboarding answers"
  ON public.onboarding_answers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Review and optimize onboarding_questions table RLS policies
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone authenticated can view onboarding questions" ON public.onboarding_questions;

-- Onboarding questions are reference data - all authenticated users can view
-- No need for ownership checks since these are not user-specific
CREATE POLICY "Authenticated users can view onboarding questions"
  ON public.onboarding_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify questions (they're reference data)
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
-- STEP 7: Review and optimize pins table RLS policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view pins" ON public.pins;

-- Pins are reference data - public read access
-- Note: The created_by column was removed in migration 009, so pins are now
-- purely reference data managed by admins only
CREATE POLICY "Anyone can view pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can modify pins (they're reference data)
CREATE POLICY "Admins can insert pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update pins"
  ON public.pins
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete pins"
  ON public.pins
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.user_owns_profile(UUID) IS 
  'Helper function to check if the current user owns a profile. More efficient than inline EXISTS subqueries.';

COMMENT ON FUNCTION public.user_owns_account(UUID) IS 
  'Helper function to check if the current user owns an account. More efficient than inline EXISTS subqueries.';

-- ============================================================================
-- STEP 9: Create indexes to support RLS policy performance
-- ============================================================================

-- Ensure indexes exist for efficient RLS checks
-- Note: Some indexes may already exist from previous migrations
-- Using IF NOT EXISTS to avoid conflicts

-- Accounts: user_id index (critical for RLS)
-- This index likely already exists, but ensure it's optimized
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_rls 
  ON public.accounts(user_id);

-- Profiles: account_id index (critical for ownership checks)
-- This index likely already exists via foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_account_id_rls 
  ON public.profiles(account_id);

-- Onboarding answers: profile_id index (critical for ownership checks)
-- This index should exist from migration 011
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_profile_id_rls 
  ON public.onboarding_answers(profile_id);

-- Note: created_by column was removed from pins table in migration 009
-- Pins are now reference data only, managed by admins
-- No ownership index needed

-- ============================================================================
-- STEP 10: Grant necessary permissions
-- ============================================================================

-- Ensure all tables have proper grants
GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;
GRANT SELECT ON public.onboarding_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;

-- Admins need full access
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.onboarding_answers TO authenticated;
GRANT ALL ON public.onboarding_questions TO authenticated;
GRANT ALL ON public.pins TO authenticated;

