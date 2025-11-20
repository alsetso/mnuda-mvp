-- Delete all existing onboarding questions
-- This allows starting fresh with the new schema including the active field

-- ============================================================================
-- STEP 1: Delete all onboarding questions
-- ============================================================================

DELETE FROM public.onboarding_questions;

-- ============================================================================
-- STEP 2: Reset sequence if needed (optional, but good practice)
-- ============================================================================

-- Reset the sequence to start from 1 for new questions
-- This is optional but ensures clean IDs
ALTER SEQUENCE IF EXISTS public.onboarding_questions_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 3: Verify deletion
-- ============================================================================

-- This will show 0 if successful
DO $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count FROM public.onboarding_questions;
  IF question_count > 0 THEN
    RAISE WARNING 'Warning: % questions still exist after deletion', question_count;
  ELSE
    RAISE NOTICE 'Successfully deleted all onboarding questions';
  END IF;
END $$;

