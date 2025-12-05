-- Restore removed profile types: renter, contractor, services, developer, property_manager, organization
-- This migration adds back the 6 profile types that were removed in migration 035

-- ============================================================================
-- STEP 1: Create new enum with all 10 profile types
-- ============================================================================

CREATE TYPE public.profile_type_new AS ENUM (
  'homeowner',
  'renter',
  'realtor',
  'wholesaler',
  'investor',
  'contractor',
  'services',
  'developer',
  'property_manager',
  'organization'
);

-- ============================================================================
-- STEP 2: Add temporary column with new enum type
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN profile_type_temp public.profile_type_new;

ALTER TABLE public.onboarding_questions
  ADD COLUMN profile_type_temp public.profile_type_new;

-- ============================================================================
-- STEP 3: Migrate existing data (keep current values)
-- ============================================================================

-- Profiles: Keep existing values, they're already valid
UPDATE public.profiles
SET profile_type_temp = profile_type::text::public.profile_type_new
WHERE profile_type::text IN ('homeowner', 'realtor', 'wholesaler', 'investor');

-- Onboarding questions: Keep existing values
UPDATE public.onboarding_questions
SET profile_type_temp = profile_type::text::public.profile_type_new
WHERE profile_type::text IN ('homeowner', 'realtor', 'wholesaler', 'investor');

-- ============================================================================
-- STEP 4: Drop old columns and constraints
-- ============================================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_profiles_profile_type;
DROP INDEX IF EXISTS onboarding_questions_profile_type_idx;

-- Drop constraints
ALTER TABLE public.onboarding_questions DROP CONSTRAINT IF EXISTS onboarding_questions_profile_type_key_unique;

-- Drop old columns
ALTER TABLE public.profiles DROP COLUMN profile_type;
ALTER TABLE public.onboarding_questions DROP COLUMN profile_type;

-- ============================================================================
-- STEP 5: Rename temporary columns to final names
-- ============================================================================

ALTER TABLE public.profiles
  RENAME COLUMN profile_type_temp TO profile_type;

ALTER TABLE public.onboarding_questions
  RENAME COLUMN profile_type_temp TO profile_type;

-- ============================================================================
-- STEP 6: Add NOT NULL constraints and defaults
-- ============================================================================

ALTER TABLE public.profiles
  ALTER COLUMN profile_type SET NOT NULL,
  ALTER COLUMN profile_type SET DEFAULT 'homeowner'::public.profile_type_new;

ALTER TABLE public.onboarding_questions
  ALTER COLUMN profile_type SET NOT NULL;

-- ============================================================================
-- STEP 7: Recreate indexes
-- ============================================================================

CREATE INDEX idx_profiles_profile_type
  ON public.profiles (profile_type);

CREATE INDEX onboarding_questions_profile_type_idx
  ON public.onboarding_questions (profile_type, sort_order);

-- ============================================================================
-- STEP 8: Recreate constraints
-- ============================================================================

ALTER TABLE public.onboarding_questions
  ADD CONSTRAINT onboarding_questions_profile_type_key_unique
  UNIQUE (profile_type, key);

-- ============================================================================
-- STEP 9: Drop old enum and rename new one
-- ============================================================================

-- Drop old enum (only if no other tables use it)
DO $$
DECLARE
  enum_used BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE udt_name = 'profile_type'
    AND table_schema = 'public'
    AND column_name != 'profile_type'
  ) INTO enum_used;
  
  IF NOT enum_used THEN
    DROP TYPE IF EXISTS public.profile_type CASCADE;
  END IF;
END $$;

-- Rename new enum to profile_type
ALTER TYPE public.profile_type_new RENAME TO profile_type;

-- ============================================================================
-- STEP 10: Update comments
-- ============================================================================

COMMENT ON TYPE public.profile_type IS 'Profile type enum: homeowner, renter, realtor, wholesaler, investor, contractor, services, developer, property_manager, organization';
COMMENT ON COLUMN public.profiles.profile_type IS 'Profile type: homeowner, renter, realtor, wholesaler, investor, contractor, services, developer, property_manager, organization';
COMMENT ON COLUMN public.onboarding_questions.profile_type IS 'Profile type this question applies to (matches profile.profile_type)';


