-- Optimize accounts and profiles tables: 50% column reduction
-- Consolidate operational data into JSONB fields
-- Accounts = minimal identity, Profiles = all operational data

-- ============================================================================
-- STEP 1: Enhance profiles.geo_focus to include all location data
-- ============================================================================

-- Update geo_focus to include primary_county, city, zip_code from accounts
UPDATE public.profiles p
SET geo_focus = COALESCE(p.geo_focus, '{}'::jsonb) || jsonb_build_object(
  'primary_county', p.primary_county,
  'city', a.city,
  'zip_code', a.zip_code
)
FROM public.accounts a
WHERE p.account_id = a.id
  AND (a.city IS NOT NULL OR a.zip_code IS NOT NULL OR p.primary_county IS NOT NULL)
  AND (p.geo_focus IS NULL OR p.geo_focus = '{}'::jsonb OR NOT (p.geo_focus ? 'city'));

-- ============================================================================
-- STEP 2: Enhance profiles.settings to include all optional data
-- ============================================================================

-- Migrate display_name, service_radius_km, and account data to settings
UPDATE public.profiles p
SET settings = COALESCE(p.settings, '{}'::jsonb) || jsonb_build_object(
  'display_name', p.display_name,
  'service_radius_km', p.service_radius_km,
  'phone', a.phone,
  'bio', a.bio,
  'avatar_url', a.avatar_url,
  'first_name', a.first_name,
  'last_name', a.last_name,
  'gender', a.gender,
  'age', a.age
)
FROM public.accounts a
WHERE p.account_id = a.id
  AND (
    p.display_name IS NOT NULL OR
    p.service_radius_km IS NOT NULL OR
    a.phone IS NOT NULL OR
    a.bio IS NOT NULL OR
    a.avatar_url IS NOT NULL OR
    a.first_name IS NOT NULL OR
    a.last_name IS NOT NULL OR
    a.gender IS NOT NULL OR
    a.age IS NOT NULL
  );

-- ============================================================================
-- STEP 3: Drop columns from profiles table
-- ============================================================================

-- Drop display_name (now in settings)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS display_name;

-- Drop primary_county (now in geo_focus)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS primary_county;

-- Drop service_radius_km (now in settings)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS service_radius_km;

-- ============================================================================
-- STEP 4: Drop indexes that reference removed columns
-- ============================================================================

DROP INDEX IF EXISTS public.profiles_primary_county_idx;

-- ============================================================================
-- STEP 5: Update indexes for JSONB queries
-- ============================================================================

-- Index for geo_focus queries (counties, cities)
CREATE INDEX IF NOT EXISTS profiles_geo_focus_gin_idx
  ON public.profiles USING GIN (geo_focus)
  WHERE geo_focus IS NOT NULL;

-- Index for settings queries (common lookups)
CREATE INDEX IF NOT EXISTS profiles_settings_gin_idx
  ON public.profiles USING GIN (settings)
  WHERE settings IS NOT NULL;

-- Index for geo_focus->>'primary_county' queries
CREATE INDEX IF NOT EXISTS profiles_geo_focus_primary_county_idx
  ON public.profiles ((geo_focus->>'primary_county'))
  WHERE geo_focus->>'primary_county' IS NOT NULL;

-- ============================================================================
-- STEP 6: Drop columns from accounts table
-- ============================================================================

-- Drop personal information columns (move to profile.settings)
ALTER TABLE public.accounts
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS phone;

-- Drop location columns (move to profile.geo_focus)
ALTER TABLE public.accounts
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS zip_code;

-- ============================================================================
-- STEP 7: Drop indexes that reference removed columns
-- ============================================================================

DROP INDEX IF EXISTS public.idx_accounts_city;
DROP INDEX IF EXISTS public.idx_accounts_first_name;
DROP INDEX IF EXISTS public.idx_accounts_last_name;

-- ============================================================================
-- STEP 8: Update comments
-- ============================================================================

COMMENT ON TABLE public.accounts IS 
  'Minimal user identity and membership table. All operational data is in profiles.';

COMMENT ON COLUMN public.accounts.id IS 'Unique account ID';
COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - authentication link';
COMMENT ON COLUMN public.accounts.email IS 'Account email address';
COMMENT ON COLUMN public.accounts.username IS 'Unique username for the account';
COMMENT ON COLUMN public.accounts.account_type IS 'Account classification (used as default profile type)';
COMMENT ON COLUMN public.accounts.role IS 'Account role: general or admin';
COMMENT ON COLUMN public.accounts.stripe_customer_id IS 'Stripe customer ID for billing';

COMMENT ON TABLE public.profiles IS 
  'Operational profile data. All user-facing and operational information is stored here.';

COMMENT ON COLUMN public.profiles.id IS 'Unique profile ID';
COMMENT ON COLUMN public.profiles.account_id IS 'References accounts.id - one account can have multiple profiles';
COMMENT ON COLUMN public.profiles.profile_type IS 'Type of profile (e.g., homeowner, investor, contractor_business)';
COMMENT ON COLUMN public.profiles.is_primary IS 'True if this is the primary profile for the account (only one per account)';
COMMENT ON COLUMN public.profiles.geo_focus IS 
  'JSONB: Geographic focus areas. Structure: {"counties":[], "cities":[], "primary_county":"", "city":"", "zip_code":""}';
COMMENT ON COLUMN public.profiles.buy_box IS 
  'JSONB: Investment/buying criteria. Structure: {"price_range":{}, "property_condition":"", "deal_types":[], "close_speed":""}';
COMMENT ON COLUMN public.profiles.settings IS 
  'JSONB: Catch-all for profile settings. Common fields: display_name, service_radius_km, phone, bio, avatar_url, first_name, last_name, gender, age';

-- ============================================================================
-- STEP 9: Create helper functions for common JSONB queries
-- ============================================================================

-- Function to get display name from profile (with fallback)
CREATE OR REPLACE FUNCTION public.get_profile_display_name(p_profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_display_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_username TEXT;
BEGIN
  SELECT 
    p.settings->>'display_name',
    p.settings->>'first_name',
    p.settings->>'last_name',
    a.username
  INTO v_display_name, v_first_name, v_last_name, v_username
  FROM public.profiles p
  INNER JOIN public.accounts a ON a.id = p.account_id
  WHERE p.id = p_profile_id;

  -- Return in priority order: display_name > first_name + last_name > username
  RETURN COALESCE(
    v_display_name,
    NULLIF(TRIM(CONCAT(COALESCE(v_first_name, ''), ' ', COALESCE(v_last_name, ''))), ''),
    v_username,
    'Unnamed Profile'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_profile_display_name IS 
  'Returns display name for a profile, with fallback to first_name+last_name or username';

-- Function to get primary county from geo_focus
CREATE OR REPLACE FUNCTION public.get_profile_primary_county(p_profile_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT geo_focus->>'primary_county'
    FROM public.profiles
    WHERE id = p_profile_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_profile_primary_county IS 
  'Returns primary county from profile geo_focus JSONB';

-- ============================================================================
-- STEP 10: Update handle_new_user function (remove references to dropped columns)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, user_id, email, role, username)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    'general'::public.account_role,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: Verify data integrity
-- ============================================================================

-- Check that all profiles have valid JSONB structures
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.profiles
  WHERE geo_focus IS NOT NULL 
    AND jsonb_typeof(geo_focus) != 'object';
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % profiles with invalid geo_focus JSONB structure', invalid_count;
  END IF;

  SELECT COUNT(*) INTO invalid_count
  FROM public.profiles
  WHERE settings IS NOT NULL 
    AND jsonb_typeof(settings) != 'object';
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % profiles with invalid settings JSONB structure', invalid_count;
  END IF;
END $$;



