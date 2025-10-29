-- Create property_docs table
CREATE TABLE IF NOT EXISTS property_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Document info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT NOT NULL, -- Size in bytes
  mime_type TEXT DEFAULT 'application/pdf',
  
  -- Optional description
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_docs_property_id ON property_docs(property_id);
CREATE INDEX IF NOT EXISTS idx_property_docs_profile_id ON property_docs(profile_id);
CREATE INDEX IF NOT EXISTS idx_property_docs_workspace_id ON property_docs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_property_docs_created_at ON property_docs(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_property_docs_updated_at 
    BEFORE UPDATE ON property_docs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE property_docs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - same permissions as property_notes
-- SELECT: Any workspace member can view all docs in their workspace
CREATE POLICY "Members can view property docs from their workspaces" ON property_docs
    FOR SELECT 
    USING (public.is_member(workspace_id));

-- INSERT: Any workspace member can create docs
-- Profile_id must match the authenticated user (set by service)
CREATE POLICY "Members can insert property docs in their workspaces" ON property_docs
    FOR INSERT 
    WITH CHECK (
        public.is_member(workspace_id) 
        AND profile_id = auth.uid()
    );

-- UPDATE: Any workspace member can update any doc in their workspace
CREATE POLICY "Members can update property docs in their workspaces" ON property_docs
    FOR UPDATE 
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

-- DELETE: Any workspace member can delete any doc in their workspace
CREATE POLICY "Members can delete property docs in their workspaces" ON property_docs
    FOR DELETE 
    USING (public.is_member(workspace_id));

-- Add GRANT permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_docs TO authenticated;

-- Add comment
COMMENT ON TABLE property_docs IS 'PDF documents attached to properties by workspace members';

