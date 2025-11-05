-- Create contact_entities table for normalized phone/email tracking
-- This allows linking contact_logs to specific contact methods with type and source tracking

CREATE TABLE IF NOT EXISTS contact_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Contact information
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  value TEXT NOT NULL, -- The actual phone number or email address
  
  -- Type classification (for phones: mobile, landline, work, etc.)
  -- (for emails: personal, work, etc.)
  subtype TEXT,
  
  -- Source of this contact information
  source TEXT CHECK (source IN ('skip_trace', 'manual', 'main_record')),
  
  -- Additional metadata from skip trace
  provider TEXT, -- Phone provider (for phones)
  phone_type TEXT, -- mobile, landline, etc. (for phones)
  last_reported TEXT, -- Last time this contact was reported (for phones)
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_entities_people_record_id ON contact_entities(people_record_id);
CREATE INDEX IF NOT EXISTS idx_contact_entities_workspace_id ON contact_entities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_entities_contact_type ON contact_entities(contact_type);
CREATE INDEX IF NOT EXISTS idx_contact_entities_value ON contact_entities(value);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_entities_unique ON contact_entities(people_record_id, contact_type, value);

-- Create updated_at trigger
CREATE TRIGGER update_contact_entities_updated_at 
    BEFORE UPDATE ON contact_entities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contact_entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the is_member function
CREATE POLICY "Users can view contact entities from their workspaces" ON contact_entities
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert contact entities in their workspaces" ON contact_entities
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update contact entities in their workspaces" ON contact_entities
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete contact entities in their workspaces" ON contact_entities
    FOR DELETE USING (public.is_member(workspace_id));

-- Add comments for documentation
COMMENT ON TABLE contact_entities IS 'Normalized contact methods (phones/emails) for people records, parsed from skip trace or manually added';
COMMENT ON COLUMN contact_entities.contact_type IS 'Type of contact: phone or email';
COMMENT ON COLUMN contact_entities.value IS 'The actual phone number or email address';
COMMENT ON COLUMN contact_entities.subtype IS 'Classification: mobile, landline, work, personal, etc.';
COMMENT ON COLUMN contact_entities.source IS 'Where this contact came from: skip_trace, manual, or main_record';
COMMENT ON COLUMN contact_entities.is_active IS 'Whether this contact method is still active/valid';
COMMENT ON COLUMN contact_entities.is_primary IS 'Whether this is the primary contact method';

-- Update contact_logs to reference contact_entities
ALTER TABLE contact_logs
  ADD COLUMN IF NOT EXISTS contact_entity_id UUID REFERENCES contact_entities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contact_logs_contact_entity_id ON contact_logs(contact_entity_id) WHERE contact_entity_id IS NOT NULL;

COMMENT ON COLUMN contact_logs.contact_entity_id IS 'Link to contact_entities table for normalized contact tracking (alternative to contact_phone/contact_email)';

