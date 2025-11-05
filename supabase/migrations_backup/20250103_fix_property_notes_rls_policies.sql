-- Fix RLS policies for property_notes table
-- Allow any workspace member to view and manage all notes in their workspace

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view property notes from their workspaces" ON property_notes;
DROP POLICY IF EXISTS "Users can insert property notes in their workspaces" ON property_notes;
DROP POLICY IF EXISTS "Users can update their own property notes" ON property_notes;
DROP POLICY IF EXISTS "Users can delete their own property notes" ON property_notes;
DROP POLICY IF EXISTS "Users can update property notes in their workspaces" ON property_notes;
DROP POLICY IF EXISTS "Users can delete property notes in their workspaces" ON property_notes;

-- SELECT: Any workspace member can view all notes in their workspace
CREATE POLICY "Members can view property notes from their workspaces" ON property_notes
    FOR SELECT 
    USING (public.is_member(workspace_id));

-- INSERT: Any workspace member can create notes
-- Profile_id must match the authenticated user (set by service)
CREATE POLICY "Members can insert property notes in their workspaces" ON property_notes
    FOR INSERT 
    WITH CHECK (
        public.is_member(workspace_id) 
        AND profile_id = auth.uid()
    );

-- UPDATE: Any workspace member can update any note in their workspace
CREATE POLICY "Members can update property notes in their workspaces" ON property_notes
    FOR UPDATE 
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

-- DELETE: Any workspace member can delete any note in their workspace
CREATE POLICY "Members can delete property notes in their workspaces" ON property_notes
    FOR DELETE 
    USING (public.is_member(workspace_id));
