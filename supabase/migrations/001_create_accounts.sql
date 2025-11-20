-- Create accounts table and enums
-- This is the base table structure for user accounts

-- ============================================================================
-- STEP 1: Create account_type enum
-- ============================================================================

CREATE TYPE public.account_type AS ENUM (
  'homeowner',
  'renter',
  'investor',
  'realtor',
  'wholesaler',
  'contractor',
  'service_provider',
  'developer',
  'property_manager',
  'business'
);

-- ============================================================================
-- STEP 2: Create account_role enum
-- ============================================================================

CREATE TYPE public.account_role AS ENUM ('general', 'admin');

-- ============================================================================
-- STEP 3: Create accounts table
-- ============================================================================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role public.account_role NOT NULL DEFAULT 'general'::public.account_role,
  
  -- Professional information
  company TEXT,
  job_title TEXT,
  bio TEXT CHECK (char_length(bio) <= 2000),
  website TEXT,
  linkedin_url TEXT,
  phone TEXT,
  
  -- Location information
  city TEXT,
  state TEXT DEFAULT 'MN' CHECK (state = 'MN'),
  zip_code TEXT,
  primary_market_area TEXT,
  market_radius INTEGER CHECK (market_radius >= 1 AND market_radius <= 99),
  
  -- Account type and subtype
  account_type public.account_type DEFAULT 'homeowner'::public.account_type,
  member_subtype TEXT,
  
  -- Payment
  stripe_customer_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Create indexes
-- ============================================================================

CREATE INDEX idx_accounts_email ON public.accounts(email);
CREATE INDEX idx_accounts_role ON public.accounts(role);
CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_member_subtype ON public.accounts(member_subtype) WHERE member_subtype IS NOT NULL;
CREATE INDEX idx_accounts_city ON public.accounts(city) WHERE city IS NOT NULL;
CREATE INDEX idx_accounts_primary_market_area ON public.accounts(primary_market_area) WHERE primary_market_area IS NOT NULL;
CREATE INDEX idx_accounts_market_radius ON public.accounts(market_radius) WHERE market_radius IS NOT NULL;
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.accounts TO anon;

-- ============================================================================
-- STEP 6: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.accounts IS 'User accounts table - extends auth.users with profile information';
COMMENT ON COLUMN public.accounts.account_type IS 'Account type: homeowner, renter, investor, realtor, wholesaler, contractor, service_provider, developer, property_manager, or business';
COMMENT ON COLUMN public.accounts.member_subtype IS 'Optional specialization within account_type (e.g., contractor → "roofer", investor → "flipper")';
COMMENT ON COLUMN public.accounts.market_radius IS 'Market radius in miles (1-99) around primary market area';
COMMENT ON COLUMN public.accounts.stripe_customer_id IS 'Stripe customer ID for payment method and subscription management';

