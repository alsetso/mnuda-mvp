-- Rename account_type enum to profile_type and update values
-- Changes: service_provider -> services, business -> organization

-- ============================================================================
-- STEP 1: Create new profile_type enum with updated values
-- ============================================================================

CREATE TYPE public.profile_type AS ENUM (
  'homeowner',
  'renter',
  'investor',
  'realtor',
  'wholesaler',
  'contractor',
  'services',
  'developer',
  'property_manager',
  'organization'
);

-- ============================================================================
-- STEP 2: Add temporary profile_type column to profiles table
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN profile_type_temp public.profile_type;

-- Migrate data: account_type -> profile_type with value mapping
UPDATE public.profiles
SET profile_type_temp = CASE
  WHEN account_type::text = 'service_provider' THEN 'services'::public.profile_type
  WHEN account_type::text = 'business' THEN 'organization'::public.profile_type
  ELSE account_type::text::public.profile_type
END
WHERE account_type IS NOT NULL;

-- ============================================================================
-- STEP 3: Handle existing profile_type column in onboarding_questions table
-- ============================================================================

-- Add temporary column for enum type
ALTER TABLE public.onboarding_questions
  ADD COLUMN IF NOT EXISTS profile_type_temp public.profile_type;

-- Migrate data from existing profile_type (TEXT) or account_type to profile_type_temp (enum)
-- Use a DO block to handle the conditional logic
DO $$
DECLARE
  has_text_profile_type BOOLEAN;
BEGIN
  -- Check if profile_type exists as TEXT
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_questions' 
    AND column_name = 'profile_type'
    AND data_type = 'text'
  ) INTO has_text_profile_type;
  
  IF has_text_profile_type THEN
    -- Migrate from existing TEXT profile_type column
    UPDATE public.onboarding_questions
    SET profile_type_temp = CASE
      WHEN profile_type::text = 'service_provider' THEN 'services'::public.profile_type
      WHEN profile_type::text = 'business' THEN 'organization'::public.profile_type
      WHEN profile_type::text IN ('homeowner', 'renter', 'investor', 'realtor', 'wholesaler', 'contractor', 'developer', 'property_manager')
        THEN profile_type::text::public.profile_type
      ELSE NULL
    END
    WHERE profile_type IS NOT NULL;
    
    -- Fill in NULLs from account_type
    UPDATE public.onboarding_questions
    SET profile_type_temp = CASE
      WHEN account_type::text = 'service_provider' THEN 'services'::public.profile_type
      WHEN account_type::text = 'business' THEN 'organization'::public.profile_type
      ELSE account_type::text::public.profile_type
    END
    WHERE profile_type_temp IS NULL AND account_type IS NOT NULL;
  ELSE
    -- No existing profile_type, migrate from account_type
    UPDATE public.onboarding_questions
    SET profile_type_temp = CASE
      WHEN account_type::text = 'service_provider' THEN 'services'::public.profile_type
      WHEN account_type::text = 'business' THEN 'organization'::public.profile_type
      ELSE account_type::text::public.profile_type
    END
    WHERE account_type IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop old columns and constraints
-- ============================================================================

-- Drop indexes that reference account_type
DROP INDEX IF EXISTS idx_profiles_account_type;
DROP INDEX IF EXISTS onboarding_questions_account_type_idx;
DROP INDEX IF EXISTS onboarding_questions_profile_type_idx;

-- Drop constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.onboarding_questions DROP CONSTRAINT IF EXISTS onboarding_questions_account_type_key_unique;

-- Drop old columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_type;
ALTER TABLE public.onboarding_questions DROP COLUMN IF EXISTS account_type;

-- Drop old TEXT profile_type column if it exists (from migration 011)
ALTER TABLE public.onboarding_questions DROP COLUMN IF EXISTS profile_type;

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
  ALTER COLUMN profile_type SET DEFAULT 'homeowner'::public.profile_type;

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

-- Recreate unique constraint on onboarding_questions.key per profile_type
ALTER TABLE public.onboarding_questions
  ADD CONSTRAINT onboarding_questions_profile_type_key_unique
  UNIQUE (profile_type, key);

-- ============================================================================
-- STEP 9: Update comments
-- ============================================================================

COMMENT ON TYPE public.profile_type IS 'Profile type enum: homeowner, renter, investor, realtor, wholesaler, contractor, services, developer, property_manager, organization';
COMMENT ON COLUMN public.profiles.profile_type IS 'Profile type: homeowner, renter, investor, realtor, wholesaler, contractor, services, developer, property_manager, organization';
COMMENT ON COLUMN public.onboarding_questions.profile_type IS 'Profile type this question applies to (matches profile.profile_type)';

-- ============================================================================
-- STEP 10: Drop old account_type enum (only if no other tables use it)
-- ============================================================================

-- Check if any other tables use account_type enum
DO $$
DECLARE
  enum_used BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE udt_name = 'account_type'
    AND table_schema = 'public'
  ) INTO enum_used;
  
  IF NOT enum_used THEN
    DROP TYPE IF EXISTS public.account_type CASCADE;
  END IF;
END $$;


