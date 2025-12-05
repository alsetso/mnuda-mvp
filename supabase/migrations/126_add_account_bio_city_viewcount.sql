-- Add bio, city_id, and view_count to accounts table

-- ============================================================================
-- STEP 1: Add bio column (220 characters max)
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_bio_length CHECK (
    bio IS NULL OR char_length(bio) <= 220
  );

-- ============================================================================
-- STEP 2: Add city_id foreign key
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS accounts_city_id_idx
  ON public.accounts (city_id)
  WHERE city_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Add view_count
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_view_count_non_negative CHECK (view_count >= 0);

CREATE INDEX IF NOT EXISTS accounts_view_count_idx
  ON public.accounts (view_count DESC)
  WHERE view_count > 0;

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================

COMMENT ON COLUMN public.accounts.bio IS
  'User bio/description, maximum 220 characters';

COMMENT ON COLUMN public.accounts.city_id IS
  'Primary city location for the account';

COMMENT ON COLUMN public.accounts.view_count IS
  'Total number of profile views';



