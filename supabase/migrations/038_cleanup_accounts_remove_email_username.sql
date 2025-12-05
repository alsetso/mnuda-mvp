-- Remove email and username from accounts table
-- Email is in auth.users, username is in profiles
-- Add last_visit update logic

-- ============================================================================
-- STEP 1: Drop columns from accounts table
-- ============================================================================

-- Drop indexes that reference email/username
DROP INDEX IF EXISTS idx_accounts_email;
DROP INDEX IF EXISTS idx_accounts_username;
DROP INDEX IF EXISTS idx_accounts_user_id_email;

-- Drop columns
ALTER TABLE public.accounts
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS username;

-- ============================================================================
-- STEP 2: Update handle_new_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if account doesn't already exist for this user
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = NEW.id) THEN
    INSERT INTO public.accounts (user_id, role, last_visit)
    VALUES (
      NEW.id,
      'general'::public.account_role,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 
  'Creates minimal account record for new user. Email is in auth.users, username is in profiles.';

-- ============================================================================
-- STEP 3: Create function to update last_visit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_account_last_visit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.accounts
  SET last_visit = NOW()
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_account_last_visit IS 
  'Updates last_visit timestamp for the authenticated user''s account.';

-- ============================================================================
-- STEP 4: Update comments
-- ============================================================================

COMMENT ON TABLE public.accounts IS 
  'Minimal user account table. Email stored in auth.users, username stored in profiles. Personal info (first_name, last_name, gender, age, image_url) stored here as default user information.';

COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - email available via auth.users.email';
COMMENT ON COLUMN public.accounts.last_visit IS 'Last visit timestamp - updated via middleware or application logic';


