-- Restructure onboarding to be profile-based instead of account-based
-- Phase 1: Database migration to move onboarding_answers from account_id to profile_id
-- This enables multiple profiles per account with independent onboarding experiences

-- ============================================================================
-- STEP 1: Add profile_type to onboarding_questions
-- ============================================================================

-- Add profile_type column (optional - allows questions to be profile-specific)
ALTER TABLE public.onboarding_questions
  ADD COLUMN IF NOT EXISTS profile_type TEXT;

-- Update comment
COMMENT ON COLUMN public.onboarding_questions.profile_type IS 
  'Profile type this question applies to (overrides account_type if set). If NULL, question applies to account_type.';

-- Create index for profile_type queries
CREATE INDEX IF NOT EXISTS onboarding_questions_profile_type_idx
  ON public.onboarding_questions (profile_type, sort_order)
  WHERE profile_type IS NOT NULL;

-- Update existing comment to reflect new structure
COMMENT ON TABLE public.onboarding_questions IS 
  'Questions for onboarding flow. Can be tied to account_type (default) or profile_type (profile-specific).';

-- ============================================================================
-- STEP 2: Add profile_id column to onboarding_answers
-- ============================================================================

-- Add profile_id column (nullable initially for migration)
ALTER TABLE public.onboarding_answers
  ADD COLUMN IF NOT EXISTS profile_id UUID;

-- Create temporary index for migration
CREATE INDEX IF NOT EXISTS onboarding_answers_profile_id_temp_idx
  ON public.onboarding_answers (profile_id)
  WHERE profile_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Create default profiles for accounts with answers but no profiles
-- ============================================================================

-- For accounts that have onboarding answers but no profiles, create a default primary profile
INSERT INTO public.profiles (account_id, display_name, is_primary, profile_type, created_at, updated_at)
SELECT DISTINCT
  a.id as account_id,
  COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, ''))), ''),
    a.username,
    SPLIT_PART(a.email, '@', 1),
    'Default Profile'
  ) as display_name,
  true as is_primary,
  COALESCE(a.account_type::TEXT, 'homeowner') as profile_type,
  NOW() as created_at,
  NOW() as updated_at
FROM public.accounts a
INNER JOIN public.onboarding_answers oa ON oa.account_id = a.id
LEFT JOIN public.profiles p ON p.account_id = a.id
WHERE p.id IS NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Migrate existing answers from account_id to profile_id
-- ============================================================================

-- Migrate answers to the primary profile for each account
UPDATE public.onboarding_answers oa
SET profile_id = p.id
FROM public.profiles p
WHERE p.account_id = oa.account_id
  AND p.is_primary = true
  AND oa.profile_id IS NULL;

-- Verify migration: Check for any orphaned answers (should be 0)
-- If there are any, they'll be handled by setting profile_id to NULL temporarily
-- but we expect all accounts with answers to now have profiles

-- ============================================================================
-- STEP 5: Update constraints and indexes
-- ============================================================================

-- Drop old foreign key constraint on account_id
ALTER TABLE public.onboarding_answers
  DROP CONSTRAINT IF EXISTS onboarding_answers_account_id_fkey;

-- Drop old unique constraint
ALTER TABLE public.onboarding_answers
  DROP CONSTRAINT IF EXISTS onboarding_answers_account_id_question_id_key;

-- Drop old composite index (from migration 008)
DROP INDEX IF EXISTS public.onboarding_answers_account_question_idx;

-- Drop old account_id index
DROP INDEX IF EXISTS public.onboarding_answers_account_idx;

-- Add new foreign key constraint for profile_id
ALTER TABLE public.onboarding_answers
  ADD CONSTRAINT onboarding_answers_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Add new unique constraint (profile_id, question_id)
ALTER TABLE public.onboarding_answers
  ADD CONSTRAINT onboarding_answers_profile_id_question_id_key
  UNIQUE (profile_id, question_id);

-- Drop temporary index and create proper index
DROP INDEX IF EXISTS public.onboarding_answers_profile_id_temp_idx;

CREATE INDEX onboarding_answers_profile_idx
  ON public.onboarding_answers (profile_id);

-- Create composite index for common query pattern
CREATE INDEX onboarding_answers_profile_question_idx
  ON public.onboarding_answers (profile_id, question_id);

-- Keep question_id index for reverse lookups
-- (onboarding_answers_question_idx should already exist from migration 007)

-- ============================================================================
-- STEP 6: Drop old RLS policies that depend on account_id
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can insert own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can update own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Users can delete own onboarding answers" ON public.onboarding_answers;
DROP POLICY IF EXISTS "Admins can view all onboarding answers" ON public.onboarding_answers;

-- ============================================================================
-- STEP 7: Make profile_id NOT NULL and drop account_id column
-- ============================================================================

-- First, ensure all answers have a profile_id (set any remaining NULLs to a default profile)
-- This should not happen if migration worked correctly, but safety check
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.onboarding_answers
  WHERE profile_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned onboarding answers without profile_id. Creating default profiles.', orphaned_count;
    
    -- Create profiles for any accounts with orphaned answers
    INSERT INTO public.profiles (account_id, display_name, is_primary, profile_type)
    SELECT DISTINCT
      a.id,
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, ''))), ''),
        a.username,
        'Default Profile'
      ),
      true,
      COALESCE(a.account_type::TEXT, 'homeowner')
    FROM public.accounts a
    INNER JOIN public.onboarding_answers oa ON oa.account_id = a.id
    WHERE oa.profile_id IS NULL
    ON CONFLICT DO NOTHING;
    
    -- Update orphaned answers
    UPDATE public.onboarding_answers oa
    SET profile_id = p.id
    FROM public.profiles p
    WHERE p.account_id = oa.account_id
      AND p.is_primary = true
      AND oa.profile_id IS NULL;
  END IF;
END $$;

-- Now make profile_id NOT NULL
ALTER TABLE public.onboarding_answers
  ALTER COLUMN profile_id SET NOT NULL;

-- Drop account_id column (policies already dropped in Step 6)
ALTER TABLE public.onboarding_answers
  DROP COLUMN IF EXISTS account_id;

-- ============================================================================
-- STEP 8: Create new RLS policies for onboarding_answers
-- ============================================================================

-- Create new policies that check via profile -> account -> user
CREATE POLICY "Users can view own onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = onboarding_answers.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own onboarding answers"
  ON public.onboarding_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = onboarding_answers.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own onboarding answers"
  ON public.onboarding_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = onboarding_answers.profile_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = onboarding_answers.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own onboarding answers"
  ON public.onboarding_answers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      INNER JOIN public.accounts ON accounts.id = profiles.account_id
      WHERE profiles.id = onboarding_answers.profile_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 9: Update table and column comments
-- ============================================================================

COMMENT ON TABLE public.onboarding_answers IS 
  'Answers to onboarding questions for each profile. Each profile can have independent onboarding data.';

COMMENT ON COLUMN public.onboarding_answers.profile_id IS 
  'References profiles.id - the profile this answer belongs to';

COMMENT ON COLUMN public.onboarding_answers.value IS 
  'JSONB value storing the answer (format depends on question field_type)';

COMMENT ON INDEX onboarding_answers_profile_idx IS 
  'Index for efficient lookups of all answers for a profile';

COMMENT ON INDEX onboarding_answers_profile_question_idx IS 
  'Composite index for efficient lookups of specific answer by profile and question';

-- ============================================================================
-- STEP 10: Add helpful function to get questions for a profile type
-- ============================================================================

-- Function to get questions for a profile type (checks profile_type first, then account_type)
CREATE OR REPLACE FUNCTION public.get_questions_for_profile_type(
  p_profile_type TEXT,
  p_account_type public.account_type DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  account_type public.account_type,
  profile_type TEXT,
  key TEXT,
  label TEXT,
  description TEXT,
  field_type TEXT,
  options JSONB,
  required BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.account_type,
    q.profile_type,
    q.key,
    q.label,
    q.description,
    q.field_type,
    q.options,
    q.required,
    q.sort_order,
    q.created_at,
    q.updated_at
  FROM public.onboarding_questions q
  WHERE (
    -- Profile-specific questions take precedence
    (q.profile_type = p_profile_type)
    OR
    -- Fall back to account-type questions if no profile-specific question exists
    (q.profile_type IS NULL AND q.account_type = p_account_type)
  )
  ORDER BY q.sort_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_questions_for_profile_type IS 
  'Returns onboarding questions for a profile type. Checks profile_type first, then falls back to account_type.';

-- ============================================================================
-- STEP 11: Grant permissions (should already exist, but ensure)
-- ============================================================================

GRANT SELECT ON public.onboarding_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;

