-- Update accounts table to replace name with first_name, last_name, username, gender, age
-- Remove name column and add new personal information fields

-- ============================================================================
-- STEP 1: Add new columns
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 18);

-- ============================================================================
-- STEP 2: Migrate existing name data (split on first space)
-- ============================================================================

-- For existing accounts, try to split name into first_name and last_name
-- Only if the name column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts' 
    AND column_name = 'name'
  ) THEN
    UPDATE public.accounts
    SET 
      first_name = CASE 
        WHEN name IS NOT NULL AND name != '' THEN 
          SPLIT_PART(name, ' ', 1)
        ELSE NULL
      END,
      last_name = CASE 
        WHEN name IS NOT NULL AND name != '' AND POSITION(' ' IN name) > 0 THEN 
          SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE NULL
      END
    WHERE (first_name IS NULL OR last_name IS NULL) 
    AND name IS NOT NULL 
    AND name != '';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Generate usernames from email for existing accounts
-- ============================================================================

-- Create username from email (before @) for existing accounts
UPDATE public.accounts
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL OR username = '';

-- ============================================================================
-- STEP 4: Drop name column (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.accounts DROP COLUMN name;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_username ON public.accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_first_name ON public.accounts(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_last_name ON public.accounts(last_name) WHERE last_name IS NOT NULL;

-- ============================================================================
-- STEP 6: Update handle_new_user function
-- ============================================================================

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

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON COLUMN public.accounts.first_name IS 'User first name';
COMMENT ON COLUMN public.accounts.last_name IS 'User last name';
COMMENT ON COLUMN public.accounts.username IS 'Unique username for the account';
COMMENT ON COLUMN public.accounts.gender IS 'User gender: male, female, other, or prefer_not_to_say';
COMMENT ON COLUMN public.accounts.age IS 'User age (must be 18 or older)';

