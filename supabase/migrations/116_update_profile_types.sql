-- Update profile_type enum to new 5 types: homeowner, renter, student, worker, business
-- Map old types to new ones:
--   homeowner -> homeowner
--   renter -> renter
--   realtor -> business
--   wholesaler -> business
--   investor -> business
--   contractor -> worker
--   services -> worker
--   developer -> business
--   property_manager -> business
--   organization -> business

-- ============================================================================
-- STEP 1: Create new enum with 5 profile types
-- ============================================================================

CREATE TYPE public.profile_type_new AS ENUM (
  'homeowner',
  'renter',
  'student',
  'worker',
  'business'
);

-- ============================================================================
-- STEP 2: Add temporary column with new enum type
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN profile_type_temp public.profile_type_new;

ALTER TABLE public.onboarding_questions
  ADD COLUMN profile_type_temp public.profile_type_new;

-- ============================================================================
-- STEP 3: Migrate existing data - map old types to new ones
-- ============================================================================

-- Profiles: Map old types to new ones
UPDATE public.profiles
SET profile_type_temp = CASE
  WHEN profile_type::text = 'homeowner' THEN 'homeowner'::public.profile_type_new
  WHEN profile_type::text = 'renter' THEN 'renter'::public.profile_type_new
  WHEN profile_type::text IN ('realtor', 'wholesaler', 'investor', 'developer', 'property_manager', 'organization') 
    THEN 'business'::public.profile_type_new
  WHEN profile_type::text IN ('contractor', 'services') 
    THEN 'worker'::public.profile_type_new
  ELSE 'homeowner'::public.profile_type_new
END;

-- Onboarding questions: Map old types to new ones
UPDATE public.onboarding_questions
SET profile_type_temp = CASE
  WHEN profile_type::text = 'homeowner' THEN 'homeowner'::public.profile_type_new
  WHEN profile_type::text = 'renter' THEN 'renter'::public.profile_type_new
  WHEN profile_type::text IN ('realtor', 'wholesaler', 'investor', 'developer', 'property_manager', 'organization') 
    THEN 'business'::public.profile_type_new
  WHEN profile_type::text IN ('contractor', 'services') 
    THEN 'worker'::public.profile_type_new
  ELSE 'homeowner'::public.profile_type_new
END;

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

COMMENT ON TYPE public.profile_type IS 'Profile type enum: homeowner, renter, student, worker, business';
COMMENT ON COLUMN public.profiles.profile_type IS 'Profile type: homeowner, renter, student, worker, business';
COMMENT ON COLUMN public.onboarding_questions.profile_type IS 'Profile type this question applies to (matches profile.profile_type)';




