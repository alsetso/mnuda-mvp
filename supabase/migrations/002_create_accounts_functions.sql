-- Create functions, triggers, and RLS policies for accounts table

-- ============================================================================
-- STEP 1: Drop existing triggers if they exist
-- ============================================================================

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 2: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create trigger to auto-update updated_at
-- ============================================================================

CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON public.accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Create handle_new_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, email, name, role, state, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'general'::public.account_role,
    'MN',
    'homeowner'::public.account_type
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create trigger to create account when user signs up
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: Create is_admin function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = auth.uid()
    AND accounts.role = 'admin'::public.account_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Drop existing RLS policies if they exist
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own account record" ON public.accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.accounts;

-- ============================================================================
-- STEP 8: Create RLS policies
-- ============================================================================

-- Users can view their own account record
CREATE POLICY "Users can view own account record"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own account record
CREATE POLICY "Users can update own account record"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own account record
CREATE POLICY "Users can insert own account record"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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

