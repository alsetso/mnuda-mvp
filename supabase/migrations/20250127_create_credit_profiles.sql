-- Create credit_profiles table
-- Stores personal information for credit restoration, linked to members

CREATE TABLE IF NOT EXISTS public.credit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  
  -- Personal Information (extracted from identity_details JSONB)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  date_of_birth DATE NOT NULL,
  ssn TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Address Information
  address JSONB NOT NULL, -- {street, city, state, zip_code}
  previous_addresses JSONB[], -- Array of previous addresses
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One profile per member
  UNIQUE(member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_profiles_member_id ON public.credit_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_credit_profiles_status ON public.credit_profiles(status);
CREATE INDEX IF NOT EXISTS idx_credit_profiles_created_at ON public.credit_profiles(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_credit_profiles_updated_at 
    BEFORE UPDATE ON public.credit_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.credit_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own credit profile
CREATE POLICY "Users can view own credit profile"
  ON public.credit_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = credit_profiles.member_id
      AND id = auth.uid()
    )
  );

-- Users can create their own credit profile
CREATE POLICY "Users can create own credit profile"
  ON public.credit_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = credit_profiles.member_id
      AND id = auth.uid()
    )
  );

-- Users can update their own credit profile
CREATE POLICY "Users can update own credit profile"
  ON public.credit_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = credit_profiles.member_id
      AND id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = credit_profiles.member_id
      AND id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.credit_profiles TO authenticated;



