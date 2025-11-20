-- Add onboarded boolean field to profiles table
-- Controls visibility of onboarding widget and floating menu

-- ============================================================================
-- STEP 1: Add onboarded column
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- STEP 2: Create index for onboarded queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_onboarded
  ON public.profiles (onboarded)
  WHERE onboarded = false;

-- ============================================================================
-- STEP 3: Add comment
-- ============================================================================

COMMENT ON COLUMN public.profiles.onboarded IS 
  'Whether this profile has completed onboarding. When false, onboarding widget is shown and floating menu is hidden.';

