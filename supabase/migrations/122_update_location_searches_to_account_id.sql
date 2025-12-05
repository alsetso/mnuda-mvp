-- Update location_searches.profile_id to reference accounts.id instead of profiles.id

-- ============================================================================
-- STEP 1: Migrate data - update profile_id to account_id (if profiles table exists)
-- ============================================================================

-- Migrate existing profile_id values to account_id by joining with profiles table
-- This will only work if profiles table still exists
DO $$
BEGIN
  -- Check if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Migrate data: update profile_id to account_id
    UPDATE public.location_searches ls
    SET profile_id = (
      SELECT profiles.account_id
      FROM public.profiles
      WHERE profiles.id = ls.profile_id
    )
    WHERE ls.profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = ls.profile_id
    );
  ELSE
    -- If profiles table doesn't exist, set profile_id to NULL
    -- (we can't migrate the data without the profiles table)
    UPDATE public.location_searches
    SET profile_id = NULL
    WHERE profile_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Rename profile_id column to account_id
-- ============================================================================

ALTER TABLE public.location_searches
  RENAME COLUMN profile_id TO account_id;

-- ============================================================================
-- STEP 3: Add foreign key constraint to accounts
-- ============================================================================

-- Add foreign key constraint to accounts.id
ALTER TABLE public.location_searches
  ADD CONSTRAINT location_searches_account_id_fkey
  FOREIGN KEY (account_id)
  REFERENCES public.accounts(id)
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 4: Update indexes
-- ============================================================================

-- Drop old profile_id index
DROP INDEX IF EXISTS public.idx_location_searches_profile_id;

-- Create new account_id index
CREATE INDEX IF NOT EXISTS idx_location_searches_account_id 
  ON public.location_searches(account_id) 
  WHERE account_id IS NOT NULL;

-- Drop old composite index if it exists
DROP INDEX IF EXISTS public.idx_location_searches_user_profile_created;

-- Create new composite index with account_id
CREATE INDEX IF NOT EXISTS idx_location_searches_user_account_created 
  ON public.location_searches(user_id, account_id, created_at DESC)
  WHERE account_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Update column comment
-- ============================================================================

COMMENT ON COLUMN public.location_searches.account_id IS 
  'References accounts.id - the account associated with this search (optional)';



