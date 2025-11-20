-- Fix schema redundancies, relationships, and optimize indexes
-- Based on review of current schema vs. intended architecture

-- ============================================================================
-- STEP 1: Fix pins table - created_by should reference profiles, not accounts
-- ============================================================================

-- Drop the old created_by foreign key constraint (it references accounts.id)
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_created_by_fkey;

-- Drop the old index
DROP INDEX IF EXISTS idx_pins_created_by;

-- Update created_by to reference profiles.account_id instead of accounts.id
-- First, we need to handle any existing data - set to NULL if profile doesn't exist
UPDATE public.pins
SET created_by = NULL
WHERE created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.account_id = pins.created_by
);

-- Now alter the column to reference profiles
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_created_by_fkey;

ALTER TABLE public.pins
  ALTER COLUMN created_by TYPE UUID USING created_by;

-- Add new foreign key constraint to profiles
ALTER TABLE public.pins
  ADD CONSTRAINT pins_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(account_id)
  ON DELETE SET NULL;

-- Recreate index on created_by (now pointing to profiles)
CREATE INDEX idx_pins_created_by
  ON public.pins(created_by) WHERE created_by IS NOT NULL;

-- Update comment
COMMENT ON COLUMN public.pins.created_by IS 'References profiles.account_id - the profile that created this pin';

-- ============================================================================
-- STEP 2: Remove redundant composite index on accounts
-- ============================================================================

-- The idx_accounts_user_id_email index is redundant since we have:
-- - idx_accounts_user_id (for user lookups)
-- - idx_accounts_email (for email lookups)
-- - UNIQUE constraint on (user_id, email) which already creates an index
DROP INDEX IF EXISTS idx_accounts_user_id_email;

-- ============================================================================
-- STEP 3: Add unique constraint on onboarding_questions.key per account_type
-- ============================================================================

-- Ensure question keys are unique per account_type
ALTER TABLE public.onboarding_questions
  ADD CONSTRAINT onboarding_questions_account_type_key_unique
  UNIQUE (account_type, key);

-- ============================================================================
-- STEP 4: Optimize onboarding_answers indexes
-- ============================================================================

-- Add composite index for common query pattern: get all answers for an account
-- This is more efficient than separate indexes for queries that filter by account_id
CREATE INDEX IF NOT EXISTS onboarding_answers_account_question_idx
  ON public.onboarding_answers (account_id, question_id);

-- The existing separate indexes are still useful for:
-- - Finding all accounts that answered a specific question (question_idx)
-- - Finding all answers for an account (account_idx)
-- So we keep both, but add the composite for the common case

-- ============================================================================
-- STEP 5: Add index on profiles for buy_box queries (common for investor searches)
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_buy_box_idx
  ON public.profiles USING GIN (buy_box) WHERE buy_box IS NOT NULL;

-- ============================================================================
-- STEP 6: Ensure pins.profile_id and pins.created_by are properly indexed together
-- ============================================================================

-- Add composite index for queries that filter by profile_id and status/visibility
CREATE INDEX IF NOT EXISTS pins_profile_status_visibility_idx
  ON public.pins (profile_id, status, visibility)
  WHERE profile_id IS NOT NULL;

-- ============================================================================
-- STEP 7: Add missing index on accounts for account_type lookups (if not exists)
-- ============================================================================

-- This should already exist from migration 006, but ensure it's there
CREATE INDEX IF NOT EXISTS idx_accounts_account_type
  ON public.accounts(account_type) WHERE account_type IS NOT NULL;

-- ============================================================================
-- STEP 8: Review and optimize: Remove unnecessary partial indexes
-- ============================================================================

-- The idx_pins_expires index on a boolean is not very selective
-- Only index where expires = true (the interesting case)
DROP INDEX IF EXISTS idx_pins_expires;

CREATE INDEX idx_pins_expires_true
  ON public.pins(expiration_date)
  WHERE expires = true AND expiration_date IS NOT NULL;

-- ============================================================================
-- STEP 9: Add helpful comments for clarity
-- ============================================================================

COMMENT ON CONSTRAINT onboarding_questions_account_type_key_unique ON public.onboarding_questions IS 
  'Ensures question keys are unique per account type';

COMMENT ON INDEX onboarding_answers_account_question_idx IS 
  'Composite index for efficient lookups of account answers';

COMMENT ON INDEX pins_profile_status_visibility_idx IS 
  'Composite index for filtering pins by profile, status, and visibility';

-- ============================================================================
-- STEP 10: Ensure proper cascade behavior
-- ============================================================================

-- Verify that pins.profile_id has CASCADE delete (should already be set)
-- This ensures when a profile is deleted, its pins are also deleted
-- The constraint was added in migration 007, so this is just verification

