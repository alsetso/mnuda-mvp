-- ============================================================================
-- CONSOLIDATED BASE SCHEMA
-- This file represents the CURRENT STATE of the database after all migrations
-- Use this as a reference for understanding the schema
-- DO NOT run this on existing databases - migrations handle the history
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Account role enum
CREATE TYPE public.account_role AS ENUM ('general', 'admin');

-- Profile type enum (consolidated to 4 types)
CREATE TYPE public.profile_type AS ENUM (
  'homeowner',
  'realtor',
  'wholesaler',
  'investor'
);

-- Pin category enum
CREATE TYPE public.pin_category AS ENUM (
  'property',
  'work',
  'project',
  'concern',
  'business',
  'opportunity'
);

-- Pin status enum
CREATE TYPE public.pin_status AS ENUM (
  'active',
  'draft',
  'archived'
);

-- Pin visibility enum
CREATE TYPE public.pin_visibility AS ENUM (
  'public',
  'accounts_only',
  'private'
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.user_id = auth.uid()
    AND accounts.role = 'admin'::public.account_role
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS 
  'Checks if the current authenticated user has admin role in accounts table. Uses accounts.user_id and accounts.role.';

-- Create account when new user signs up
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
-- TABLES
-- ============================================================================

-- Accounts table - stores default user information
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal information (default user info that won't change)
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  age INTEGER,
  image_url TEXT,
  
  -- Account settings
  role public.account_role NOT NULL DEFAULT 'general'::public.account_role,
  stripe_customer_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_role ON public.accounts(role);
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_accounts_first_name ON public.accounts(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX idx_accounts_last_name ON public.accounts(last_name) WHERE last_name IS NOT NULL;

-- Triggers
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON public.accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comments
COMMENT ON TABLE public.accounts IS 
  'Minimal user account table. Email stored in auth.users, username stored in profiles. Personal info (first_name, last_name, gender, age, image_url) stored here as default user information.';
COMMENT ON COLUMN public.accounts.user_id IS 'References auth.users(id) - email available via auth.users.email';
COMMENT ON COLUMN public.accounts.last_visit IS 'Last visit timestamp - updated via middleware or application logic';

-- ============================================================================

-- Profiles table - stores operational profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Profile identity
  username TEXT NOT NULL UNIQUE,
  profile_image TEXT,
  profile_type public.profile_type NOT NULL DEFAULT 'homeowner'::public.profile_type,
  
  -- Onboarding data (stored as JSONB)
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_profile_type ON public.profiles(profile_type);
CREATE INDEX idx_profiles_onboarded ON public.profiles(onboarded) WHERE onboarded = false;
CREATE INDEX profiles_onboarding_data_gin_idx ON public.profiles USING GIN (onboarding_data)
  WHERE onboarding_data IS NOT NULL AND onboarding_data != '{}'::jsonb;

-- Triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles table with operational data. Username, profile_type, and onboarding_data stored here.';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'JSONB storing onboarding answers. Structure: {"question_key": value, ...}';
COMMENT ON COLUMN public.profiles.onboarded IS 'Whether this profile has completed onboarding. When false, onboarding widget is shown and floating menu is hidden.';

-- ============================================================================

-- Pins table - reference table for pin types (not user-created pins)
CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.pin_category NOT NULL,
  access_list TEXT[] NOT NULL DEFAULT '{}',
  expires BOOLEAN NOT NULL DEFAULT false,
  expiration_date TIMESTAMP WITH TIME ZONE,
  status public.pin_status NOT NULL DEFAULT 'active'::public.pin_status,
  visibility public.pin_visibility NOT NULL DEFAULT 'public'::public.pin_visibility,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pins_slug ON public.pins(slug);
CREATE INDEX idx_pins_category ON public.pins(category);
CREATE INDEX idx_pins_access_list ON public.pins USING GIN(access_list);
CREATE INDEX idx_pins_expires ON public.pins(expires);
CREATE INDEX idx_pins_expiration_date ON public.pins(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_pins_status ON public.pins(status);
CREATE INDEX idx_pins_visibility ON public.pins(visibility);

-- Triggers
CREATE TRIGGER update_pins_updated_at 
    BEFORE UPDATE ON public.pins 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.pins IS 'Reference table for all available pin types with access permissions';
COMMENT ON COLUMN public.pins.category IS 'Pin category: property, work, project, concern, business, or opportunity';
COMMENT ON COLUMN public.pins.access_list IS 'Array of account types that can use this pin type';
COMMENT ON COLUMN public.pins.slug IS 'Unique slug identifier for the pin type';

-- ============================================================================

-- Areas table - user-drawn geographic areas
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  category TEXT NOT NULL CHECK (category IN ('custom', 'county', 'city', 'state', 'region', 'zipcode')) DEFAULT 'custom',
  geometry JSONB NOT NULL, -- GeoJSON Polygon or MultiPolygon
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_areas_profile_id ON public.areas(profile_id);
CREATE INDEX idx_areas_visibility ON public.areas(visibility);
CREATE INDEX idx_areas_category ON public.areas(category);
CREATE INDEX idx_areas_created_at ON public.areas(created_at);
CREATE INDEX idx_areas_geometry ON public.areas USING GIN (geometry);

-- Triggers
CREATE TRIGGER update_areas_updated_at 
  BEFORE UPDATE ON public.areas 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.areas IS 'User-drawn geographic areas (polygons/multipolygons) for map visualization';
COMMENT ON COLUMN public.areas.geometry IS 'GeoJSON geometry (Polygon or MultiPolygon)';

-- ============================================================================

-- My homes table - user-owned homes
CREATE TABLE public.my_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Location data
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  
  -- Optional metadata
  nickname TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX my_homes_profile_id_idx ON public.my_homes (profile_id);
CREATE INDEX my_homes_lat_lng_idx ON public.my_homes (lat, lng);

-- Triggers
CREATE TRIGGER update_my_homes_updated_at
  BEFORE UPDATE ON public.my_homes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.my_homes IS 'Homes owned by users - separate from pins table';
COMMENT ON COLUMN public.my_homes.address IS 'Full address of the home';

-- ============================================================================

-- Onboarding questions table - admin-managed questions (kept for admin UI)
CREATE TABLE public.onboarding_questions (
  id BIGSERIAL PRIMARY KEY,
  profile_type public.profile_type NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  field_type TEXT NOT NULL CHECK (field_type IN ('map_point', 'map_area')),
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure only one active question per profile_type
  UNIQUE (profile_type, key)
);

-- Indexes
CREATE INDEX onboarding_questions_profile_type_idx ON public.onboarding_questions (profile_type, sort_order);
CREATE UNIQUE INDEX onboarding_questions_one_active_per_profile_type
  ON public.onboarding_questions (profile_type)
  WHERE active = true;

-- Triggers
CREATE TRIGGER update_onboarding_questions_updated_at
  BEFORE UPDATE ON public.onboarding_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.onboarding_questions IS 'Single onboarding question per profile type. Must be map_point or map_area type. Value supports arrays for multiple entries. Kept for admin UI.';
COMMENT ON COLUMN public.onboarding_questions.field_type IS 'Type of input field - only map_point or map_area allowed';

-- ============================================================================

-- Pages table - account-level page management (businesses, personal brands, organizations, etc.)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Page information
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  email TEXT,
  phone TEXT,
  industry TEXT,
  hours TEXT,
  service_areas UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX pages_account_id_idx ON public.pages(account_id);
CREATE INDEX pages_name_idx ON public.pages(name) WHERE name IS NOT NULL;
CREATE INDEX pages_industry_idx ON public.pages(industry) WHERE industry IS NOT NULL;
CREATE INDEX pages_lat_lng_idx ON public.pages(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX pages_service_areas_idx ON public.pages USING GIN (service_areas)
  WHERE service_areas IS NOT NULL AND array_length(service_areas, 1) > 0;

-- Triggers
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON public.pages 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.pages IS 'Pages managed at the account level - can be businesses, personal brands, organizations, etc. Created and managed by accounts';
COMMENT ON COLUMN public.pages.account_id IS 'References accounts.id - the account that owns this page';
COMMENT ON COLUMN public.pages.name IS 'Page name';
COMMENT ON COLUMN public.pages.type IS 'Type of page (business, personal brand, organization, etc.)';
COMMENT ON COLUMN public.pages.address IS 'Full page address';
COMMENT ON COLUMN public.pages.lat IS 'Page latitude coordinate';
COMMENT ON COLUMN public.pages.lng IS 'Page longitude coordinate';
COMMENT ON COLUMN public.pages.email IS 'Page email address';
COMMENT ON COLUMN public.pages.phone IS 'Page phone number';
COMMENT ON COLUMN public.pages.industry IS 'Page industry';
COMMENT ON COLUMN public.pages.hours IS 'Page hours (stored as text)';
COMMENT ON COLUMN public.pages.service_areas IS 'Array of city UUIDs (references cities.id) where the page provides services';


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.accounts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

GRANT SELECT ON public.pins TO authenticated;
GRANT SELECT ON public.pins TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT SELECT ON public.areas TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_homes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_questions TO authenticated;
GRANT SELECT ON public.onboarding_questions TO authenticated;

GRANT SELECT ON public.businesses TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

GRANT SELECT ON public.business_locations TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.business_locations TO authenticated;


