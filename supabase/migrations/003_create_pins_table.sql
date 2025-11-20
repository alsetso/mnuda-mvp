-- Create pins table and categories
-- This table stores all available pin types with their access permissions

-- ============================================================================
-- STEP 1: Create pin_category enum
-- ============================================================================

CREATE TYPE public.pin_category AS ENUM (
  'property',
  'work',
  'project',
  'concern',
  'business',
  'opportunity'
);

-- ============================================================================
-- STEP 1b: Create pin_status enum
-- ============================================================================

CREATE TYPE public.pin_status AS ENUM (
  'active',
  'draft',
  'archived'
);

-- ============================================================================
-- STEP 1c: Create pin_visibility enum
-- ============================================================================

CREATE TYPE public.pin_visibility AS ENUM (
  'public',
  'accounts_only',
  'private'
);

-- ============================================================================
-- STEP 2: Create pins table
-- ============================================================================

CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.pin_category NOT NULL,
  access_list TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  expires BOOLEAN NOT NULL DEFAULT false,
  expiration_date TIMESTAMP WITH TIME ZONE,
  status public.pin_status NOT NULL DEFAULT 'active'::public.pin_status,
  visibility public.pin_visibility NOT NULL DEFAULT 'public'::public.pin_visibility,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_pins_slug ON public.pins(slug);
CREATE INDEX idx_pins_category ON public.pins(category);
CREATE INDEX idx_pins_access_list ON public.pins USING GIN(access_list);
CREATE INDEX idx_pins_created_by ON public.pins(created_by);
CREATE INDEX idx_pins_expires ON public.pins(expires);
CREATE INDEX idx_pins_expiration_date ON public.pins(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_pins_status ON public.pins(status);
CREATE INDEX idx_pins_visibility ON public.pins(visibility);

-- ============================================================================
-- STEP 4: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_pins_updated_at 
    BEFORE UPDATE ON public.pins 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Insert PROPERTY category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('For Sale', 'for_sale', 'property', ARRAY['homeowner', 'realtor', 'investor', 'developer', 'wholesaler', 'property_manager', 'business']),
  ('For Rent', 'for_rent', 'property', ARRAY['realtor', 'property_manager', 'business']),
  ('Land', 'land', 'property', ARRAY['investor', 'developer', 'realtor', 'business']),
  ('FSBO', 'fsbo', 'property', ARRAY['homeowner']),
  ('Pocket', 'pocket', 'property', ARRAY['realtor', 'investor', 'wholesaler']),
  ('Coming', 'coming', 'property', ARRAY['realtor', 'developer', 'investor']),
  ('Lead', 'lead', 'property', ARRAY['investor', 'wholesaler', 'developer']),
  ('Distressed', 'distressed', 'property', ARRAY['investor', 'wholesaler', 'developer', 'contractor', 'business']),
  ('Vacant', 'vacant', 'property', ARRAY['investor', 'wholesaler', 'developer', 'property_manager']),
  ('Abandoned', 'abandoned', 'property', ARRAY['investor', 'wholesaler', 'developer', 'contractor']),
  ('Pre-Foreclosure', 'preforeclosure', 'property', ARRAY['investor', 'wholesaler']),
  ('Auction', 'auction', 'property', ARRAY['investor', 'wholesaler', 'business']),
  ('Tax-Delinquent', 'tax_delinquent', 'property', ARRAY['investor', 'wholesaler']),
  ('Contract', 'contract', 'property', ARRAY['wholesaler', 'investor']),
  ('Assignment', 'assignment', 'property', ARRAY['wholesaler']),
  ('JV', 'jv', 'property', ARRAY['investor', 'developer', 'business']),
  ('Parcel', 'parcel', 'property', ARRAY['developer', 'investor']);

-- ============================================================================
-- STEP 6: Insert WORK category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('Labor', 'labor', 'work', ARRAY['homeowner', 'investor', 'property_manager', 'business']),
  ('Handyman', 'handyman', 'work', ARRAY['homeowner', 'investor', 'property_manager', 'business']),
  ('Snow', 'snow', 'work', ARRAY['homeowner', 'renter', 'property_manager', 'business']),
  ('Lawn', 'lawn', 'work', ARRAY['homeowner', 'renter', 'property_manager', 'business']),
  ('Cleanup', 'cleanup', 'work', ARRAY['homeowner', 'investor', 'property_manager', 'business']),
  ('Moving', 'moving', 'work', ARRAY['homeowner', 'renter', 'business']),
  ('Plow', 'plow', 'work', ARRAY['homeowner', 'renter', 'property_manager', 'business']),
  ('Roof', 'roof', 'work', ARRAY['homeowner', 'investor', 'property_manager', 'business']),
  ('Plumbing', 'plumbing', 'work', ARRAY['homeowner', 'property_manager', 'business']),
  ('Electrical', 'electrical', 'work', ARRAY['homeowner', 'property_manager', 'business']),
  ('HVAC', 'hvac', 'work', ARRAY['homeowner', 'property_manager', 'business']),
  ('Carpentry', 'carpentry', 'work', ARRAY['homeowner', 'property_manager', 'business']),
  ('Painting', 'painting', 'work', ARRAY['homeowner', 'property_manager', 'business']),
  ('Service', 'service', 'work', ARRAY['service_provider', 'contractor', 'business']),
  ('Contractor', 'contractor', 'work', ARRAY['contractor', 'business']),
  ('Roofing', 'roofing', 'work', ARRAY['contractor', 'business']),
  ('Cleaning', 'cleaning', 'work', ARRAY['service_provider', 'business']);

-- ============================================================================
-- STEP 7: Insert PROJECT category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('NewRoof', 'newroof', 'project', ARRAY['contractor', 'developer', 'investor', 'business']),
  ('Renovation', 'renovation', 'project', ARRAY['investor', 'developer', 'contractor', 'business']),
  ('Flip', 'flip', 'project', ARRAY['investor', 'developer']),
  ('Foundation', 'foundation', 'project', ARRAY['contractor', 'developer']),
  ('Addition', 'addition', 'project', ARRAY['contractor', 'developer']),
  ('Build', 'build', 'project', ARRAY['developer', 'contractor', 'business']),
  ('Demo', 'demo', 'project', ARRAY['contractor', 'developer']),
  ('Completed', 'completed', 'project', ARRAY['contractor', 'developer', 'investor']);

-- ============================================================================
-- STEP 8: Insert CONCERN category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('Suspicious', 'suspicious', 'concern', ARRAY['renter', 'homeowner', 'property_manager', 'business']),
  ('BreakIn', 'breakin', 'concern', ARRAY['renter', 'homeowner']),
  ('Fire', 'fire', 'concern', ARRAY['renter', 'homeowner', 'property_manager']),
  ('Flood', 'flood', 'concern', ARRAY['renter', 'homeowner', 'property_manager']),
  ('Unsafe', 'unsafe', 'concern', ARRAY['renter', 'homeowner', 'contractor']),
  ('AbandonedCar', 'abandonedcar', 'concern', ARRAY['renter', 'homeowner', 'property_manager']),
  ('Yard', 'yard_concern', 'concern', ARRAY['renter', 'homeowner']),
  ('Pothole', 'pothole', 'concern', ARRAY['renter', 'homeowner']),
  ('Trash', 'trash', 'concern', ARRAY['renter', 'homeowner']),
  ('Water', 'water', 'concern', ARRAY['renter', 'homeowner']),
  ('Animal', 'animal', 'concern', ARRAY['renter', 'homeowner']),
  ('Violation', 'violation', 'concern', ARRAY['renter', 'homeowner', 'property_manager']),
  ('Concern', 'concern', 'concern', ARRAY['renter', 'homeowner']);

-- ============================================================================
-- STEP 9: Insert BUSINESS category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('HQ', 'hq', 'business', ARRAY['business', 'contractor', 'service_provider']),
  ('Yard', 'yard_business', 'business', ARRAY['business', 'contractor']),
  ('Hiring', 'hiring', 'business', ARRAY['business', 'contractor', 'service_provider']),
  ('Equipment', 'equipment', 'business', ARRAY['business', 'contractor']),
  ('Warehouse', 'warehouse', 'business', ARRAY['business']),
  ('Adjuster', 'adjuster', 'business', ARRAY['business']),
  ('Subcontract', 'subcontract', 'business', ARRAY['contractor', 'business']);

-- ============================================================================
-- STEP 10: Insert OPPORTUNITY category pins
-- ============================================================================

INSERT INTO public.pins (name, slug, category, access_list) VALUES
  ('Rezoning', 'rezoning', 'opportunity', ARRAY['developer', 'investor', 'business']),
  ('Environmental', 'environmental', 'opportunity', ARRAY['developer', 'investor', 'business']),
  ('Development', 'development', 'opportunity', ARRAY['developer', 'investor', 'business']),
  ('CityProject', 'cityproject', 'opportunity', ARRAY['business', 'developer']),
  ('Permit', 'permit', 'opportunity', ARRAY['developer', 'contractor', 'business']);

-- ============================================================================
-- STEP 11: Grant permissions
-- ============================================================================

GRANT SELECT ON public.pins TO authenticated;
GRANT SELECT ON public.pins TO anon;

-- ============================================================================
-- STEP 12: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 13: Create RLS policies
-- ============================================================================

-- Everyone can view pins (they're public reference data)
CREATE POLICY "Anyone can view pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- STEP 14: Add comments
-- ============================================================================

COMMENT ON TABLE public.pins IS 'Reference table for all available pin types with access permissions';
COMMENT ON COLUMN public.pins.category IS 'Pin category: property, work, project, concern, business, or opportunity';
COMMENT ON COLUMN public.pins.access_list IS 'Array of account types that can use this pin type';
COMMENT ON COLUMN public.pins.slug IS 'Unique slug identifier for the pin type';
COMMENT ON COLUMN public.pins.created_by IS 'Account ID that created this pin type (if custom)';
COMMENT ON COLUMN public.pins.expires IS 'Whether this pin type has an expiration date';
COMMENT ON COLUMN public.pins.expiration_date IS 'Date when this pin type expires (if expires is true)';
COMMENT ON COLUMN public.pins.status IS 'Pin status: active (visible and usable), draft (work in progress), or archived (hidden)';
COMMENT ON COLUMN public.pins.visibility IS 'Pin visibility: public (anyone can see), accounts_only (only logged-in users), or private (only creator)';

