-- Add active field to onboarding_questions table
-- Allows admins to toggle questions on/off without deleting them

-- ============================================================================
-- STEP 1: Add active column
-- ============================================================================

ALTER TABLE public.onboarding_questions
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- STEP 2: Create index for active queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_questions_active
  ON public.onboarding_questions (active)
  WHERE active = true;

-- ============================================================================
-- STEP 3: Update RLS policies to include active check (optional - for user queries)
-- ============================================================================

-- Note: RLS policies don't need to change - users can see all questions
-- The application logic will filter by active=true for user-facing queries
-- Admins can see all questions (active and inactive) for management

-- ============================================================================
-- STEP 4: Add comment
-- ============================================================================

COMMENT ON COLUMN public.onboarding_questions.active IS 
  'Whether this question is active and should be shown to users. Inactive questions are hidden but preserved for admin management.';

