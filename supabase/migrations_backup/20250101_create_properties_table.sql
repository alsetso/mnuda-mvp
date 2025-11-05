-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Address (essential for API calls)
  full_address TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  
  -- Coordinates (for mapping)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Status (core business logic)
  status TEXT DEFAULT 'Off Market' CHECK (status IN (
    'Preforeclosure', 'Foreclosure', 'Foreclosed', 'Auction', 'Redemption',
    'Bank Owned', 'Short Sale', 'Subject To', 'Deed In Lieu', 'Leaseback',
    'For Sale By Owner', 'Listed On MLS', 'Under Contract', 'Sold', 'Off Market'
  )),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_workspace_id ON properties(workspace_id);
CREATE INDEX IF NOT EXISTS idx_properties_full_address ON properties(full_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_workspace_address ON properties(workspace_id, full_address);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the is_member function
-- Users can only see properties from workspaces they belong to
CREATE POLICY "Users can view properties from their workspaces" ON properties
    FOR SELECT USING (public.is_member(workspace_id));

-- Users can insert properties in workspaces they belong to
CREATE POLICY "Users can insert properties in their workspaces" ON properties
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

-- Users can update properties in workspaces they belong to
CREATE POLICY "Users can update properties in their workspaces" ON properties
    FOR UPDATE USING (public.is_member(workspace_id));

-- Users can delete properties in workspaces they belong to
CREATE POLICY "Users can delete properties in their workspaces" ON properties
    FOR DELETE USING (public.is_member(workspace_id));

-- Add comment
COMMENT ON TABLE properties IS 'Real estate properties linked to workspaces with full address and coordinate data';
