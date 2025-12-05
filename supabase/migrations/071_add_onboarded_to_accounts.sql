-- Add onboarded boolean field to accounts table
-- This field tracks whether a user has completed the initial onboarding flow

-- ============================================================================
-- STEP 1: Add onboarded column
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- STEP 2: Create index for onboarded queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_onboarded
  ON public.accounts (onboarded)
  WHERE onboarded = false;

-- ============================================================================
-- STEP 3: Add comment
-- ============================================================================

COMMENT ON COLUMN public.accounts.onboarded IS
  'Whether the user has completed the initial onboarding flow. Users must complete onboarding before accessing the main app.';


