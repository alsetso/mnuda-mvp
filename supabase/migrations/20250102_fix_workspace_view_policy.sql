-- Fix workspace view policy to restrict access to owners and members only
-- This migration drops the overly permissive "workspaces_all" policy
-- and ensures only workspace owners and members can view workspaces

-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "workspaces_all" ON public.workspaces;

-- Ensure the correct restrictive policy exists (drop and recreate to be sure)
DROP POLICY IF EXISTS "members_can_view_workspaces" ON public.workspaces;

-- Recreate the restrictive policy that only allows members to view
CREATE POLICY "members_can_view_workspaces"
ON public.workspaces 
FOR SELECT
TO authenticated
USING (
  -- User must be a member of the workspace (checks both profile_id and email)
  public.is_member(id) OR
  -- OR user is the creator (fallback for edge cases where creator might not be in members table)
  created_by = auth.uid()
);

-- Verification
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND policyname = 'members_can_view_workspaces'
  ) INTO policy_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACE VIEW POLICY FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dropped: workspaces_all (if existed)';
  RAISE NOTICE 'Created: members_can_view_workspaces';
  RAISE NOTICE 'Policy exists: %', policy_exists;
  RAISE NOTICE 'Only owners and members can now view workspaces';
  RAISE NOTICE '========================================';
END $$;

