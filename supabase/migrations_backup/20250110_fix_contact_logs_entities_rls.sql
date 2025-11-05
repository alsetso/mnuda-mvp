-- Fix RLS policies for contact_logs and contact_entities tables
-- Ensure is_member function is SECURITY DEFINER and add necessary grants

-- First, ensure is_member function is SECURITY DEFINER (it should bypass RLS)
-- This matches the definition from the fix_workspace_members_infinite_recursion migration
CREATE OR REPLACE FUNCTION public.is_member(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace 
    AND (
      profile_id = auth.uid() OR
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
$$;

-- Grant necessary permissions on contact_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_logs TO authenticated;

-- Grant necessary permissions on contact_entities  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_entities TO authenticated;

-- Ensure policies exist and are correct for contact_logs
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view contact logs from their workspaces" ON contact_logs;
  DROP POLICY IF EXISTS "Users can insert contact logs in their workspaces" ON contact_logs;
  DROP POLICY IF EXISTS "Users can update contact logs in their workspaces" ON contact_logs;
  DROP POLICY IF EXISTS "Users can delete contact logs in their workspaces" ON contact_logs;
  
  -- Recreate policies
  CREATE POLICY "Users can view contact logs from their workspaces" ON contact_logs
    FOR SELECT USING (public.is_member(workspace_id));

  CREATE POLICY "Users can insert contact logs in their workspaces" ON contact_logs
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

  CREATE POLICY "Users can update contact logs in their workspaces" ON contact_logs
    FOR UPDATE USING (public.is_member(workspace_id));

  CREATE POLICY "Users can delete contact logs in their workspaces" ON contact_logs
    FOR DELETE USING (public.is_member(workspace_id));
END $$;

-- Ensure policies exist and are correct for contact_entities
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view contact entities from their workspaces" ON contact_entities;
  DROP POLICY IF EXISTS "Users can insert contact entities in their workspaces" ON contact_entities;
  DROP POLICY IF EXISTS "Users can update contact entities in their workspaces" ON contact_entities;
  DROP POLICY IF EXISTS "Users can delete contact entities in their workspaces" ON contact_entities;
  
  -- Recreate policies
  CREATE POLICY "Users can view contact entities from their workspaces" ON contact_entities
    FOR SELECT USING (public.is_member(workspace_id));

  CREATE POLICY "Users can insert contact entities in their workspaces" ON contact_entities
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

  CREATE POLICY "Users can update contact entities in their workspaces" ON contact_entities
    FOR UPDATE USING (public.is_member(workspace_id));

  CREATE POLICY "Users can delete contact entities in their workspaces" ON contact_entities
    FOR DELETE USING (public.is_member(workspace_id));
END $$;

