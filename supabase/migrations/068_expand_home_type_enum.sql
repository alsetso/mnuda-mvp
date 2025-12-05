-- Expand home_type enum to support profile-type-specific property types
-- Adds new types for realtors (listing status), wholesalers (deal stages), and investors (portfolio status)
-- Maintains backward compatibility with existing homeowner types

-- ============================================================================
-- STEP 1: Add new enum values for realtors (listing status)
-- ============================================================================

DO $$ BEGIN
  -- Add realtor-specific types
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'active';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'pending';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'sold';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'coming_soon';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'withdrawn';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'expired';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'land';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new enum values for wholesalers (deal stages)
-- ============================================================================

DO $$ BEGIN
  -- Add wholesaler-specific types
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'under_contract';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'assignment';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'available';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'distressed';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'pre_foreclosure';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'abandoned';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'auction';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'tax_delinquent';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Add new enum values for investors (portfolio status)
-- ============================================================================

DO $$ BEGIN
  -- Add investor-specific types
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'acquisition';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'active_project';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'completed';
  ALTER TYPE public.home_type ADD VALUE IF NOT EXISTS 'hold';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 4: Update comment to reflect all property types
-- ============================================================================

COMMENT ON COLUMN public.my_homes.home_type IS 'Property type: 
  Homeowner: primary, secondary, rental, investment, vacant, development, inherited
  Realtor: active, pending, sold, coming_soon, withdrawn, expired, rental, commercial, land
  Wholesaler: under_contract, assignment, available, distressed, pre_foreclosure, vacant, abandoned, auction, tax_delinquent
  Investor: acquisition, active_project, rental, completed, hold, commercial, land, development';


