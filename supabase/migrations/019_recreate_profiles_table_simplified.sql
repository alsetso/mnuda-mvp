-- Drop and recreate profiles table with simplified schema
-- Columns: id, account_id, username (unique), profile_image, account_type, created_at, updated_at

-- ============================================================================
-- STEP 1: Drop dependent objects
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop RLS policies (will recreate)
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- ============================================================================
-- STEP 2: Drop and recreate profiles table
-- ============================================================================

-- Drop table (CASCADE will handle foreign keys from pins and onboarding_answers)
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  profile_image TEXT,
  account_type public.account_type NOT NULL DEFAULT 'homeowner'::public.account_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);

-- ============================================================================
-- STEP 4: Create updated_at trigger
-- ============================================================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Recreate foreign key constraints
-- ============================================================================

-- Recreate foreign key for pins table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pins') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pins' AND column_name = 'profile_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'pins_profile_id_fkey'
      ) THEN
        ALTER TABLE public.pins
          ADD CONSTRAINT pins_profile_id_fkey
          FOREIGN KEY (profile_id)
          REFERENCES public.profiles(id)
          ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Recreate foreign key for onboarding_answers table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'onboarding_answers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'onboarding_answers' AND column_name = 'profile_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'onboarding_answers_profile_id_fkey'
      ) THEN
        ALTER TABLE public.onboarding_answers
          ADD CONSTRAINT onboarding_answers_profile_id_fkey
          FOREIGN KEY (profile_id)
          REFERENCES public.profiles(id)
          ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS policies
-- ============================================================================

-- Users can view their own profiles (via account ownership)
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

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles table with simplified schema';
COMMENT ON COLUMN public.profiles.id IS 'Unique profile ID (UUID)';
COMMENT ON COLUMN public.profiles.account_id IS 'References accounts.id - the account this profile belongs to';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the profile';
COMMENT ON COLUMN public.profiles.profile_image IS 'URL to profile image';
COMMENT ON COLUMN public.profiles.account_type IS 'Account type: homeowner, renter, investor, realtor, etc.';
COMMENT ON COLUMN public.profiles.created_at IS 'Profile creation timestamp';
COMMENT ON COLUMN public.profiles.updated_at IS 'Last update timestamp (auto-updated)';

