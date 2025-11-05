-- Create people_records table
CREATE TABLE IF NOT EXISTS people_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Essential contact information
  full_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Property relationship
  relationship_to_property TEXT CHECK (relationship_to_property IN ('owner', 'resident', 'tenant', 'relative', 'contact', 'other')),
  
  -- Data source
  data_source TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_people_records_property_id ON people_records(property_id);
CREATE INDEX IF NOT EXISTS idx_people_records_workspace_id ON people_records(workspace_id);

-- Create updated_at trigger
CREATE TRIGGER update_people_records_updated_at 
    BEFORE UPDATE ON people_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE people_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the is_member function
-- Users can only see people records from workspaces they belong to
CREATE POLICY "Users can view people records from their workspaces" ON people_records
    FOR SELECT USING (public.is_member(workspace_id));

-- Users can insert people records in workspaces they belong to
CREATE POLICY "Users can insert people records in their workspaces" ON people_records
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

-- Users can update people records in workspaces they belong to
CREATE POLICY "Users can update people records in their workspaces" ON people_records
    FOR UPDATE USING (public.is_member(workspace_id));

-- Users can delete people records in workspaces they belong to
CREATE POLICY "Users can delete people records in their workspaces" ON people_records
    FOR DELETE USING (public.is_member(workspace_id));

-- Add comment
COMMENT ON TABLE people_records IS 'People records linked to properties, populated via API calls with full address data';
