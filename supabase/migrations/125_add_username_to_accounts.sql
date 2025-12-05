-- Add username field to accounts table for public URL slugs
-- Username must be unique and can be used instead of UUID in URLs

-- ============================================================================
-- STEP 1: Add username column (nullable initially for existing accounts)
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS username TEXT;

-- ============================================================================
-- STEP 2: Create unique index on username (allowing NULL for now)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_unique_idx
  ON public.accounts (username)
  WHERE username IS NOT NULL;

-- ============================================================================
-- STEP 3: Add constraint to ensure username format (alphanumeric, hyphens, underscores)
-- ============================================================================

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_username_format CHECK (
    username IS NULL OR (
      char_length(username) >= 3 AND
      char_length(username) <= 30 AND
      username ~ '^[a-zA-Z0-9_-]+$'
    )
  );

-- ============================================================================
-- STEP 4: Create index for username lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS accounts_username_idx
  ON public.accounts (username)
  WHERE username IS NOT NULL;

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON COLUMN public.accounts.username IS
  'Unique username for public profile URLs. Must be 3-30 characters, alphanumeric with hyphens/underscores only.';



