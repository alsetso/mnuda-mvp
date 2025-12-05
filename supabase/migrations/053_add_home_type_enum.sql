-- Add home_type enum to my_homes table
-- This categorizes the purpose/use of each home property

-- ============================================================================
-- STEP 1: Create home_type enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.home_type AS ENUM (
    'primary',      -- Primary residence
    'secondary',    -- Secondary/vacation home
    'rental',       -- Rental property
    'investment',     -- Investment property
    'commercial',   -- Commercial property
    'vacant',       -- Vacant land/property
    'development',  -- Property under development
    'flip',         -- Property being flipped
    'inherited'     -- Inherited property
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add home_type column to my_homes table
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS home_type public.home_type DEFAULT 'primary';

-- ============================================================================
-- STEP 3: Add index for home_type queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_my_homes_home_type 
ON public.my_homes (home_type);

-- ============================================================================
-- STEP 4: Add comment
-- ============================================================================

COMMENT ON COLUMN public.my_homes.home_type IS 'Type of home: primary (main residence), secondary (vacation/second home), rental (rental property), investment (investment property), commercial (commercial property), vacant (vacant land), development (under development), flip (being flipped), inherited (inherited property)';


