-- Enhance members table for Minnesota Platform for Under Development & Acquisition
-- Adds professional, geographic, and real estate-specific fields

-- Add professional information columns
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 2000),
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add location information (Minnesota-focused)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'MN' CHECK (state = 'MN'),
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS primary_market_area TEXT; -- e.g., "Twin Cities", "Duluth", "Rochester"

-- Create member type enum for real estate professionals
CREATE TYPE public.member_type AS ENUM (
  'developer',
  'investor',
  'agent',
  'builder',
  'contractor',
  'lender',
  'attorney',
  'inspector',
  'appraiser',
  'wholesaler',
  'homeowner',
  'neighbor'
);

-- Add member type column
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS member_type public.member_type DEFAULT 'homeowner'::public.member_type;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_members_member_type ON public.members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_city ON public.members(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_primary_market_area ON public.members(primary_market_area) WHERE primary_market_area IS NOT NULL;

-- Update handle_new_user function to include new defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, name, role, state, member_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'general'::public.member_role,
    'MN',
    'homeowner'::public.member_type
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN public.members.company IS 'Company or organization name';
COMMENT ON COLUMN public.members.job_title IS 'Professional job title or role';
COMMENT ON COLUMN public.members.bio IS 'Professional biography (max 2000 characters)';
COMMENT ON COLUMN public.members.city IS 'City in Minnesota';
COMMENT ON COLUMN public.members.state IS 'State (always MN for Minnesota platform)';
COMMENT ON COLUMN public.members.primary_market_area IS 'Primary market area within Minnesota (e.g., Twin Cities, Duluth, Rochester)';
COMMENT ON COLUMN public.members.member_type IS 'Type of real estate professional or community member';

