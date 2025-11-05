-- Create property_notes table
CREATE TABLE IF NOT EXISTS property_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Note content
  comment TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_notes_property_id ON property_notes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_notes_profile_id ON property_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_property_notes_workspace_id ON property_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_property_notes_created_at ON property_notes(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_property_notes_updated_at 
    BEFORE UPDATE ON property_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the is_member function
-- Users can only see notes from properties in workspaces they belong to
CREATE POLICY "Users can view property notes from their workspaces" ON property_notes
    FOR SELECT USING (public.is_member(workspace_id));

-- Users can insert notes for properties in workspaces they belong to
CREATE POLICY "Users can insert property notes in their workspaces" ON property_notes
    FOR INSERT WITH CHECK (public.is_member(workspace_id) AND auth.uid() = profile_id);

-- Users can update their own notes in workspaces they belong to
CREATE POLICY "Users can update their own property notes" ON property_notes
    FOR UPDATE USING (public.is_member(workspace_id) AND auth.uid() = profile_id)
    WITH CHECK (public.is_member(workspace_id) AND auth.uid() = profile_id);

-- Users can delete their own notes in workspaces they belong to
CREATE POLICY "Users can delete their own property notes" ON property_notes
    FOR DELETE USING (public.is_member(workspace_id) AND auth.uid() = profile_id);

-- Add comment
COMMENT ON TABLE property_notes IS 'Notes/comments added by profiles to properties';

