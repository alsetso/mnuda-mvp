-- Update accounts table to allow users to own multiple accounts
-- Changes id to gen_random_uuid() and adds user_id to reference auth.users

-- ============================================================================
-- STEP 1: Drop foreign key constraints that reference accounts.id
-- ============================================================================

-- Drop foreign key from pins table (if it exists)
ALTER TABLE public.pins
  DROP CONSTRAINT IF EXISTS pins_created_by_fkey;

-- ============================================================================
-- STEP 2: Drop existing indexes (will be recreated)
-- ============================================================================

DROP INDEX IF EXISTS idx_accounts_email;

-- ============================================================================
-- STEP 3: Create new user_id column
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: Backfill user_id for existing accounts (id was the user_id)
-- ============================================================================

UPDATE public.accounts
SET user_id = id
WHERE user_id IS NULL;

-- ============================================================================
-- STEP 5: Make user_id NOT NULL
-- ============================================================================

ALTER TABLE public.accounts
  ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- STEP 6: Change id to use gen_random_uuid() instead of referencing auth.users
-- ============================================================================

-- Drop the foreign key constraint on id (it references auth.users)
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_id_fkey;

-- Drop primary key temporarily
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_pkey;

-- Change id default to gen_random_uuid()
-- Note: Existing rows keep their current id values (they're already valid UUIDs)
-- New rows will get random UUIDs
ALTER TABLE public.accounts
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.accounts
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Recreate primary key
ALTER TABLE public.accounts
  ADD PRIMARY KEY (id);

-- ============================================================================
-- STEP 7: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_email ON public.accounts(user_id, email);

-- ============================================================================
-- STEP 8: Update handle_new_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (id, user_id, email, name, role, state)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'general'::public.account_role,
    'MN'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Update RLS policies to use user_id instead of id
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own account record" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own account record" ON public.accounts;

-- Recreate policies using user_id
CREATE POLICY "Users can view own account records"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account records"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own account records"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: Update is_admin function to check user_id
-- ============================================================================

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
-- STEP 11: Recreate foreign key for pins table
-- ============================================================================

-- Recreate foreign key constraint for pins.created_by
ALTER TABLE public.pins
  ADD CONSTRAINT pins_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.accounts(id)
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 12: Add comments
-- ============================================================================

COMMENT ON COLUMN public.accounts.id IS 'Unique account ID (UUID) - allows multiple accounts per user';
COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - the user who owns this account';

