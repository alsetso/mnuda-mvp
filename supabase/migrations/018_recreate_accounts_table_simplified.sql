-- Drop and recreate accounts table with simplified schema
-- Columns: id, user_id, first_name, last_name, gender, age, image_url, role, 
--          stripe_customer_id, created_at, updated_at, last_visit

-- ============================================================================
-- STEP 1: Drop dependent objects
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions (will recreate)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop RLS policies (will recreate)
DROP POLICY IF EXISTS "Users can view own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own account" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.accounts;

-- ============================================================================
-- STEP 2: Drop and recreate accounts table
-- ============================================================================

-- Drop table (CASCADE will handle foreign keys from profiles and pins)
DROP TABLE IF EXISTS public.accounts CASCADE;

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  age INTEGER,
  image_url TEXT,
  role public.account_role NOT NULL DEFAULT 'general'::public.account_role,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_role ON public.accounts(role);
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_accounts_first_name ON public.accounts(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX idx_accounts_last_name ON public.accounts(last_name) WHERE last_name IS NOT NULL;

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
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON public.accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Create handle_new_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if account doesn't already exist for this user
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = NEW.id) THEN
    INSERT INTO public.accounts (user_id, role)
    VALUES (
      NEW.id,
      'general'::public.account_role
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create account when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS policies
-- ============================================================================

-- Users can view their own account
CREATE POLICY "Users can view own account"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own account
CREATE POLICY "Users can update own account"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own account
CREATE POLICY "Users can insert own account"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all accounts
CREATE POLICY "Admins can update all accounts"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert accounts
CREATE POLICY "Admins can insert accounts"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 8: Recreate foreign key constraints
-- ============================================================================

-- Recreate foreign key for profiles table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND constraint_name = 'profiles_account_id_fkey'
    ) THEN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_account_id_fkey
        FOREIGN KEY (account_id)
        REFERENCES public.accounts(id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Note: pins table no longer has created_by column (removed in migration 009)
-- Pins now use profile_id to reference profiles, which in turn references accounts

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.accounts TO anon;

-- ============================================================================
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE public.accounts IS 'User accounts table with simplified schema';
COMMENT ON COLUMN public.accounts.id IS 'Unique account ID (UUID)';
COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - the authenticated user';
COMMENT ON COLUMN public.accounts.first_name IS 'User first name';
COMMENT ON COLUMN public.accounts.last_name IS 'User last name';
COMMENT ON COLUMN public.accounts.gender IS 'User gender';
COMMENT ON COLUMN public.accounts.age IS 'User age';
COMMENT ON COLUMN public.accounts.image_url IS 'URL to user profile image';
COMMENT ON COLUMN public.accounts.role IS 'Account role: general or admin';
COMMENT ON COLUMN public.accounts.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.accounts.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.accounts.updated_at IS 'Last update timestamp (auto-updated)';
COMMENT ON COLUMN public.accounts.last_visit IS 'Last visit timestamp';

