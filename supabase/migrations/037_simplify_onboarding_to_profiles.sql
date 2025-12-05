-- Simplify onboarding: Store directly in profiles.onboarding_data JSONB
-- Migrate existing onboarding_answers data, then drop tables

-- ============================================================================
-- STEP 1: Add onboarding_data column to profiles
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS profiles_onboarding_data_gin_idx
  ON public.profiles USING GIN (onboarding_data)
  WHERE onboarding_data IS NOT NULL AND onboarding_data != '{}'::jsonb;

COMMENT ON COLUMN public.profiles.onboarding_data IS 'JSONB storing onboarding answers. Structure: {"question_key": value, ...}';

-- ============================================================================
-- STEP 2: Migrate existing onboarding_answers to profiles.onboarding_data
-- ============================================================================

-- Migrate answers grouped by profile_id
UPDATE public.profiles p
SET onboarding_data = COALESCE(
  (
    SELECT jsonb_object_agg(
      q.key,
      a.value
    )
    FROM public.onboarding_answers a
    INNER JOIN public.onboarding_questions q ON q.id = a.question_id
    WHERE a.profile_id = p.id
  ),
  '{}'::jsonb
)
WHERE EXISTS (
  SELECT 1 FROM public.onboarding_answers
  WHERE profile_id = p.id
);

-- ============================================================================
-- STEP 3: Drop onboarding_answers table (foreign key will cascade)
-- ============================================================================

DROP TABLE IF EXISTS public.onboarding_answers CASCADE;

-- ============================================================================
-- STEP 4: Drop onboarding_questions table
-- ============================================================================

-- Note: We keep the table for admin management, but it's now just metadata
-- The actual question data is seeded in migration 036
-- If you want to remove it entirely, uncomment below:
-- DROP TABLE IF EXISTS public.onboarding_questions CASCADE;

-- For now, we'll keep it for admin UI but mark it as deprecated
COMMENT ON TABLE public.onboarding_questions IS 'DEPRECATED: Questions are now hardcoded. This table exists only for admin reference. Answers stored in profiles.onboarding_data JSONB.';


