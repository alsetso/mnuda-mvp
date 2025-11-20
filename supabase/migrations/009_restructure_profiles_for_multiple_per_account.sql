-- Restructure profiles to allow multiple profiles per account
-- Drop created_by from pins (use only profile_id)
-- Ideal architecture: One account per user, multiple profiles per account

-- ============================================================================
-- STEP 1: Drop created_by column from pins table
-- ============================================================================

-- Drop the foreign key constraint
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_created_by_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_pins_created_by;

-- Drop the column
ALTER TABLE public.pins
  DROP COLUMN IF EXISTS created_by;

-- Update comment
COMMENT ON COLUMN public.pins.profile_id IS 'References profiles.id - the profile that owns/created this pin';

-- ============================================================================
-- STEP 2: Restructure profiles table for multiple profiles per account
-- ============================================================================

-- Drop existing foreign key constraint (will recreate)
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_profile_id_fkey;

-- Drop existing profile policies (will recreate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Drop the existing profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with id as PK, account_id as FK
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  display_name TEXT,
  
  -- Operational attributes
  primary_county TEXT,
  service_radius_km NUMERIC,
  geo_focus JSONB,            -- ex: {"counties":["Hennepin"], "cities":["Minneapolis"]}
  buy_box JSONB,              -- strategies, ranges, budgets
  settings JSONB,             -- catch-all for arbitrary metadata
  
  -- Profile metadata
  is_primary BOOLEAN NOT NULL DEFAULT false,  -- One primary profile per account
  profile_type TEXT,                          -- e.g., 'homeowner', 'investor', 'contractor_business'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX profiles_account_id_idx
  ON public.profiles (account_id);

CREATE INDEX profiles_primary_county_idx
  ON public.profiles (primary_county) WHERE primary_county IS NOT NULL;

CREATE INDEX profiles_geo_focus_idx
  ON public.profiles USING GIN (geo_focus) WHERE geo_focus IS NOT NULL;

CREATE INDEX profiles_buy_box_idx
  ON public.profiles USING GIN (buy_box) WHERE buy_box IS NOT NULL;

-- Unique index to ensure only one primary profile per account
CREATE UNIQUE INDEX profiles_one_primary_per_account_idx
  ON public.profiles (account_id)
  WHERE is_primary = true;

-- Add comments
COMMENT ON TABLE public.profiles IS 'Operational profile data - multiple profiles per account for different contexts';
COMMENT ON COLUMN public.profiles.id IS 'Unique profile ID';
COMMENT ON COLUMN public.profiles.account_id IS 'References accounts.id - one account can have multiple profiles';
COMMENT ON COLUMN public.profiles.display_name IS 'Display name for this profile';
COMMENT ON COLUMN public.profiles.is_primary IS 'True if this is the primary profile for the account (only one per account)';
COMMENT ON COLUMN public.profiles.profile_type IS 'Type of profile (e.g., homeowner, investor, contractor_business)';

-- ============================================================================
-- STEP 3: Recreate foreign key constraint on pins
-- ============================================================================

-- Drop existing index if it exists (will recreate with correct reference)
DROP INDEX IF EXISTS pins_profile_id_idx;

-- Drop existing foreign key constraint if it exists
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_profile_id_fkey;

-- Add new foreign key constraint (now references profiles.id instead of profiles.account_id)
ALTER TABLE public.pins
  ADD CONSTRAINT pins_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Recreate index
CREATE INDEX pins_profile_id_idx
  ON public.pins (profile_id) WHERE profile_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Create function to ensure only one primary profile per account
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_one_primary_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a profile as primary, unset all other primary profiles for this account
  IF NEW.is_primary = true THEN
    UPDATE public.profiles
    SET is_primary = false
    WHERE account_id = NEW.account_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_primary_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_one_primary_profile();

-- ============================================================================
-- STEP 6: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view own profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can delete their own profiles
CREATE POLICY "Users can delete own profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- ============================================================================
-- STEP 8: Update accounts table to enforce one account per user
-- ============================================================================

-- Add unique constraint to ensure one account per user
-- (This should already exist via the UNIQUE constraint, but let's ensure it)
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_user_id_unique;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_id_unique
  UNIQUE (user_id);

-- Update comment
COMMENT ON CONSTRAINT accounts_user_id_unique ON public.accounts IS 
  'Ensures one account per user - users can have multiple profiles within their account';

