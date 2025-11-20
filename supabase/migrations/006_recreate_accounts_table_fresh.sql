-- Drop and recreate accounts table with simplified structure
-- Removes: company, job_title, website, linkedin_url, primary_market_area, market_radius, member_subtype

-- ============================================================================
-- STEP 1: Drop dependent objects
-- ============================================================================

-- Drop foreign key constraints that reference accounts
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_created_by_fkey;

-- Drop triggers
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions (will recreate)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own account record" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.accounts;

-- ============================================================================
-- STEP 2: Drop and recreate accounts table
-- ============================================================================

DROP TABLE IF EXISTS public.accounts CASCADE;

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Personal information
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age INTEGER CHECK (age >= 18),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 2000),
  phone TEXT,
  
  -- Location information
  city TEXT,
  state TEXT DEFAULT 'MN' CHECK (state = 'MN'),
  zip_code TEXT,
  
  -- Account type
  account_type public.account_type,
  
  -- Role
  role public.account_role NOT NULL DEFAULT 'general'::public.account_role,
  
  -- Payment
  stripe_customer_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT accounts_user_id_email_unique UNIQUE (user_id, email)
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_email ON public.accounts(email);
CREATE INDEX idx_accounts_username ON public.accounts(username);
CREATE INDEX idx_accounts_role ON public.accounts(role);
CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_user_id_email ON public.accounts(user_id, email);
CREATE INDEX idx_accounts_city ON public.accounts(city) WHERE city IS NOT NULL;
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_accounts_first_name ON public.accounts(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX idx_accounts_last_name ON public.accounts(last_name) WHERE last_name IS NOT NULL;

-- ============================================================================
-- STEP 4: Create functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, user_id, email, role, state, username)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    'general'::public.account_role,
    'MN',
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.user_id = auth.uid()
    AND accounts.role = 'admin'::public.account_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create account when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts
CREATE POLICY "Users can view own account record"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own account record"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own account record"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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
-- STEP 7: Recreate foreign key for pins table
-- ============================================================================

ALTER TABLE public.pins
  ADD CONSTRAINT pins_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.accounts(id)
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================

COMMENT ON TABLE public.accounts IS 'User accounts table - supports multiple accounts per user';
COMMENT ON COLUMN public.accounts.id IS 'Unique account ID (UUID) - allows multiple accounts per user';
COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - the user who owns this account';
COMMENT ON COLUMN public.accounts.email IS 'Account email address';
COMMENT ON COLUMN public.accounts.first_name IS 'User first name';
COMMENT ON COLUMN public.accounts.last_name IS 'User last name';
COMMENT ON COLUMN public.accounts.username IS 'Unique username for the account';
COMMENT ON COLUMN public.accounts.gender IS 'User gender: male, female, other, or prefer_not_to_say';
COMMENT ON COLUMN public.accounts.age IS 'User age (must be 18 or older)';
COMMENT ON COLUMN public.accounts.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.accounts.bio IS 'User biography (max 2000 characters)';
COMMENT ON COLUMN public.accounts.phone IS 'User phone number';
COMMENT ON COLUMN public.accounts.city IS 'User city';
COMMENT ON COLUMN public.accounts.state IS 'User state (always MN)';
COMMENT ON COLUMN public.accounts.zip_code IS 'User zip code';
COMMENT ON COLUMN public.accounts.account_type IS 'Type of account (homeowner, renter, investor, etc.)';
COMMENT ON COLUMN public.accounts.role IS 'Account role: general or admin';

