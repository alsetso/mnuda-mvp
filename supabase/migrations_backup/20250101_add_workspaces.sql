-- Add Workspaces System
-- This migration adds workspace functionality to existing profiles

-- Workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace memberships table
CREATE TABLE public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','admin','editor','viewer')) DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, profile_id)
);

-- Enable RLS on workspace tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS Helper function for workspace membership
CREATE OR REPLACE FUNCTION public.is_member(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace AND profile_id = auth.uid()
  );
$$;

-- Workspaces RLS policies
CREATE POLICY "members_can_view_workspaces"
ON public.workspaces 
FOR SELECT
USING (public.is_member(id));

CREATE POLICY "authenticated_can_create_workspaces"
ON public.workspaces 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "owners_can_manage_workspaces"
ON public.workspaces 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = id AND profile_id = auth.uid() AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = id AND profile_id = auth.uid() AND role = 'owner'
  )
);

-- Workspace members RLS policies
CREATE POLICY "authenticated_can_create_memberships"
ON public.workspace_members 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "members_can_manage_memberships"
ON public.workspace_members 
FOR ALL
USING (public.is_member(workspace_id))
WITH CHECK (public.is_member(workspace_id));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_profile_id ON workspace_members(profile_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;

-- Verification
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN ('workspaces', 'workspace_members');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACES SYSTEM ADDED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Tables: workspaces, workspace_members';
  RAISE NOTICE 'RLS Enabled: YES';
  RAISE NOTICE 'Functions: is_member';
  RAISE NOTICE 'Policies: members_can_view_workspaces, owners_can_manage_workspaces, members_can_manage_memberships';
  RAISE NOTICE '========================================';
END $$;
