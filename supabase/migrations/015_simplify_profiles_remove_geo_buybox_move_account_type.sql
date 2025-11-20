-- Simplify profiles table:
-- 1. Remove geo_focus and buy_box JSONB columns (move to onboarding_answers)
-- 2. Replace profile_type TEXT with account_type enum (from accounts table)
-- 3. Remove account_type from accounts table (no longer needed)

-- ============================================================================
-- STEP 1: Add account_type to profiles (temporary, will replace profile_type)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type_temp public.account_type;

-- Migrate profile_type to account_type_temp
UPDATE public.profiles
SET account_type_temp = profile_type::public.account_type
WHERE profile_type IS NOT NULL;

-- ============================================================================
-- STEP 2: Migrate geo_focus and buy_box data to onboarding_answers
-- ============================================================================

-- Create helper function to migrate geo_focus data
DO $$
DECLARE
  profile_record RECORD;
  question_id_county BIGINT;
  question_id_city BIGINT;
  question_id_zip BIGINT;
BEGIN
  -- Find question IDs for location questions (adjust keys as needed)
  SELECT id INTO question_id_county FROM public.onboarding_questions WHERE key = 'primary_county' LIMIT 1;
  SELECT id INTO question_id_city FROM public.onboarding_questions WHERE key = 'city' LIMIT 1;
  SELECT id INTO question_id_zip FROM public.onboarding_questions WHERE key = 'zip_code' LIMIT 1;

  -- Migrate geo_focus data
  FOR profile_record IN SELECT id, geo_focus FROM public.profiles WHERE geo_focus IS NOT NULL
  LOOP
    -- Migrate primary_county
    IF profile_record.geo_focus->>'primary_county' IS NOT NULL AND question_id_county IS NOT NULL THEN
      INSERT INTO public.onboarding_answers (profile_id, question_id, value)
      VALUES (profile_record.id, question_id_county, to_jsonb(profile_record.geo_focus->>'primary_county'))
      ON CONFLICT (profile_id, question_id) DO UPDATE SET value = to_jsonb(profile_record.geo_focus->>'primary_county');
    END IF;

    -- Migrate city
    IF profile_record.geo_focus->>'city' IS NOT NULL AND question_id_city IS NOT NULL THEN
      INSERT INTO public.onboarding_answers (profile_id, question_id, value)
      VALUES (profile_record.id, question_id_city, to_jsonb(profile_record.geo_focus->>'city'))
      ON CONFLICT (profile_id, question_id) DO UPDATE SET value = to_jsonb(profile_record.geo_focus->>'city');
    END IF;

    -- Migrate zip_code
    IF profile_record.geo_focus->>'zip_code' IS NOT NULL AND question_id_zip IS NOT NULL THEN
      INSERT INTO public.onboarding_answers (profile_id, question_id, value)
      VALUES (profile_record.id, question_id_zip, to_jsonb(profile_record.geo_focus->>'zip_code'))
      ON CONFLICT (profile_id, question_id) DO UPDATE SET value = to_jsonb(profile_record.geo_focus->>'zip_code');
    END IF;
  END LOOP;
END $$;

-- Migrate buy_box data (if questions exist)
DO $$
DECLARE
  profile_record RECORD;
  question_id_price_min BIGINT;
  question_id_price_max BIGINT;
  question_id_condition BIGINT;
  question_id_close_speed BIGINT;
BEGIN
  -- Find question IDs for buy_box questions
  SELECT id INTO question_id_price_min FROM public.onboarding_questions WHERE key = 'price_range_min' LIMIT 1;
  SELECT id INTO question_id_price_max FROM public.onboarding_questions WHERE key = 'price_range_max' LIMIT 1;
  SELECT id INTO question_id_condition FROM public.onboarding_questions WHERE key = 'property_condition' LIMIT 1;
  SELECT id INTO question_id_close_speed FROM public.onboarding_questions WHERE key = 'close_speed' LIMIT 1;

  FOR profile_record IN SELECT id, buy_box FROM public.profiles WHERE buy_box IS NOT NULL
  LOOP
    -- Migrate price_range
    IF profile_record.buy_box->'price_range' IS NOT NULL THEN
      IF profile_record.buy_box->'price_range'->>'min' IS NOT NULL AND question_id_price_min IS NOT NULL THEN
        INSERT INTO public.onboarding_answers (profile_id, question_id, value)
        VALUES (profile_record.id, question_id_price_min, profile_record.buy_box->'price_range'->'min')
        ON CONFLICT (profile_id, question_id) DO UPDATE SET value = profile_record.buy_box->'price_range'->'min';
      END IF;
      
      IF profile_record.buy_box->'price_range'->>'max' IS NOT NULL AND question_id_price_max IS NOT NULL THEN
        INSERT INTO public.onboarding_answers (profile_id, question_id, value)
        VALUES (profile_record.id, question_id_price_max, profile_record.buy_box->'price_range'->'max')
        ON CONFLICT (profile_id, question_id) DO UPDATE SET value = profile_record.buy_box->'price_range'->'max';
      END IF;
    END IF;

    -- Migrate property_condition
    IF profile_record.buy_box->>'property_condition' IS NOT NULL AND question_id_condition IS NOT NULL THEN
      INSERT INTO public.onboarding_answers (profile_id, question_id, value)
      VALUES (profile_record.id, question_id_condition, to_jsonb(profile_record.buy_box->>'property_condition'))
      ON CONFLICT (profile_id, question_id) DO UPDATE SET value = to_jsonb(profile_record.buy_box->>'property_condition');
    END IF;

    -- Migrate close_speed
    IF profile_record.buy_box->>'close_speed' IS NOT NULL AND question_id_close_speed IS NOT NULL THEN
      INSERT INTO public.onboarding_answers (profile_id, question_id, value)
      VALUES (profile_record.id, question_id_close_speed, to_jsonb(profile_record.buy_box->>'close_speed'))
      ON CONFLICT (profile_id, question_id) DO UPDATE SET value = to_jsonb(profile_record.buy_box->>'close_speed');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Drop old columns and rename account_type_temp
-- ============================================================================

-- Drop geo_focus and buy_box columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS geo_focus,
  DROP COLUMN IF EXISTS buy_box;

-- Drop old indexes
DROP INDEX IF EXISTS public.profiles_geo_focus_idx;
DROP INDEX IF EXISTS public.profiles_buy_box_idx;

-- Drop profile_type and rename account_type_temp
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS profile_type;

ALTER TABLE public.profiles
  RENAME COLUMN account_type_temp TO account_type;

-- Make account_type NOT NULL with default
ALTER TABLE public.profiles
  ALTER COLUMN account_type SET NOT NULL,
  ALTER COLUMN account_type SET DEFAULT 'homeowner'::public.account_type;

-- ============================================================================
-- STEP 4: Remove account_type from accounts table
-- ============================================================================

ALTER TABLE public.accounts
  DROP COLUMN IF EXISTS account_type;

-- Drop index
DROP INDEX IF EXISTS idx_accounts_account_type;
DROP INDEX IF EXISTS public.onboarding_questions_account_type_idx;

-- ============================================================================
-- STEP 5: Update onboarding_questions to use profile account_type
-- ============================================================================

-- The onboarding_questions table already has account_type column
-- We'll keep it but it now refers to the profile's account_type, not the account's
-- Update comment to clarify
COMMENT ON COLUMN public.onboarding_questions.account_type IS 
  'Account type this question applies to (matches profile.account_type, not accounts.account_type which no longer exists)';

-- ============================================================================
-- STEP 6: Update indexes and add new ones
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_account_type_idx
  ON public.profiles (account_type);

-- ============================================================================
-- STEP 7: Update comments
-- ============================================================================

COMMENT ON TABLE public.profiles IS 
  'Operational profiles - each profile has an account_type that determines its questions and behavior';
COMMENT ON COLUMN public.profiles.account_type IS 
  'Type of profile (homeowner, investor, etc.) - replaces old profile_type and accounts.account_type';
COMMENT ON TABLE public.accounts IS 
  'User identity and authentication - no longer contains account_type (moved to profiles)';

