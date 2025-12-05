-- Separate home_type and status into two distinct fields
-- home_type: What kind of property it is (residential, commercial, land, etc.)
-- status: Where it is in the workflow (active, pending, sold, etc.)

-- ============================================================================
-- STEP 1: Create property_status enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.property_status AS ENUM (
    -- Universal statuses (all profile types)
    'active',           -- Active/current
    'pending',          -- Pending/under contract
    'sold',             -- Sold/completed
    'available',        -- Available
    'withdrawn',        -- Withdrawn/cancelled
    'expired',          -- Expired
    
    -- Homeowner-specific statuses
    'primary',          -- Primary residence
    'secondary',        -- Secondary/vacation home
    'rental',           -- Rental property
    'vacant',           -- Vacant property
    'development',      -- Under development
    'inherited',        -- Inherited property
    
    -- Realtor-specific statuses
    'coming_soon',      -- Coming soon listing
    
    -- Wholesaler-specific statuses
    'under_contract',   -- Under contract
    'assignment',       -- Assignment deal
    'distressed',       -- Distressed property
    'pre_foreclosure',  -- Pre-foreclosure
    'abandoned',        -- Abandoned property
    'auction',          -- Auction property
    'tax_delinquent',   -- Tax-delinquent property
    
    -- Investor-specific statuses
    'acquisition',      -- Being acquired
    'active_project',    -- Active renovation/flip project
    'completed',        -- Completed project
    'hold'              -- Long-term hold
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create property_type enum (simplified, clear types)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.property_type AS ENUM (
    'residential',      -- Single family residential
    'commercial',       -- Commercial property
    'land',             -- Land/vacant lot
    'multi_family',     -- Multi-family property
    'condo',            -- Condominium
    'townhouse'         -- Townhouse
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Add status column to my_homes table
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS status public.property_status DEFAULT 'active';

-- ============================================================================
-- STEP 4: Migrate existing home_type data to status
-- ============================================================================

-- Map existing home_type values to status
-- Keep home_type for now, but populate status based on current home_type
UPDATE public.my_homes
SET status = CASE
  -- Homeowner types map directly to status
  WHEN home_type = 'primary' THEN 'primary'::public.property_status
  WHEN home_type = 'secondary' THEN 'secondary'::public.property_status
  WHEN home_type = 'rental' THEN 'rental'::public.property_status
  WHEN home_type = 'vacant' THEN 'vacant'::public.property_status
  WHEN home_type = 'development' THEN 'development'::public.property_status
  WHEN home_type = 'inherited' THEN 'inherited'::public.property_status
  
  -- Investment/commercial/flip map to generic statuses
  WHEN home_type = 'investment' THEN 'active'::public.property_status
  WHEN home_type = 'commercial' THEN 'active'::public.property_status
  WHEN home_type = 'flip' THEN 'active_project'::public.property_status
  
  -- Default to active if unknown
  ELSE 'active'::public.property_status
END
WHERE status IS NULL OR status = 'active'::public.property_status;

-- ============================================================================
-- STEP 5: Add property_type column and set defaults
-- ============================================================================

ALTER TABLE public.my_homes
ADD COLUMN IF NOT EXISTS property_type public.property_type DEFAULT 'residential';

-- ============================================================================
-- STEP 6: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_my_homes_status 
ON public.my_homes (status);

CREATE INDEX IF NOT EXISTS idx_my_homes_property_type 
ON public.my_homes (property_type);

CREATE INDEX IF NOT EXISTS idx_my_homes_status_type 
ON public.my_homes (status, property_type);

-- ============================================================================
-- STEP 7: Update comments
-- ============================================================================

COMMENT ON COLUMN public.my_homes.status IS 'Property status/workflow stage: 
  Universal: active, pending, sold, available, withdrawn, expired
  Homeowner: primary, secondary, rental, vacant, development, inherited
  Realtor: coming_soon
  Wholesaler: under_contract, assignment, distressed, pre_foreclosure, abandoned, auction, tax_delinquent
  Investor: acquisition, active_project, completed, hold';

COMMENT ON COLUMN public.my_homes.property_type IS 'Physical property type: residential, commercial, land, multi_family, condo, townhouse';

COMMENT ON COLUMN public.my_homes.home_type IS 'DEPRECATED: Use status and property_type instead. Kept for backward compatibility.';


