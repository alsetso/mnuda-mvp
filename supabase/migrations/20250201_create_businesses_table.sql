-- Create businesses table for users to manage their business records
-- Each user can have multiple businesses

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  
  -- Business Information
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  website TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT DEFAULT 'MN' CHECK (state = 'MN'),
  zip_code TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_member_id ON public.businesses(member_id);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON public.businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Businesses

-- Users can view their own businesses
CREATE POLICY "Users can view their own businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Users can create their own businesses
CREATE POLICY "Users can create their own businesses"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = member_id);

-- Users can update their own businesses
CREATE POLICY "Users can update their own businesses"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

-- Users can delete their own businesses
CREATE POLICY "Users can delete their own businesses"
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = member_id);

