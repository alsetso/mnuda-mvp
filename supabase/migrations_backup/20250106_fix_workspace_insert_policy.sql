-- Fix workspace INSERT policy conflict
-- Problem: owners_can_manage_workspaces uses FOR ALL which includes INSERT
-- This conflicts with authenticated_can_create_workspaces because during INSERT,
-- the workspace doesn't exist yet so the owner check fails
-- Solution: Change owners_can_manage_workspaces to only apply to UPDATE and DELETE

-- Drop ALL potentially conflicting policies first (idempotent)
DROP POLICY IF EXISTS "owners_can_manage_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "owners_can_update_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "owners_can_delete_workspaces" ON public.workspaces;

-- Ensure authenticated_can_create_workspaces exists and is correct
DROP POLICY IF EXISTS "authenticated_can_create_workspaces" ON public.workspaces;
CREATE POLICY "authenticated_can_create_workspaces"
ON public.workspaces 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create separate policies for UPDATE and DELETE operations
CREATE POLICY "owners_can_update_workspaces"
ON public.workspaces 
FOR UPDATE
TO authenticated
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

CREATE POLICY "owners_can_delete_workspaces"
ON public.workspaces 
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = id AND profile_id = auth.uid() AND role = 'owner'
  )
);

-- Verification
DO $$
DECLARE
  insert_policy_exists BOOLEAN;
  update_policy_exists BOOLEAN;
  delete_policy_exists BOOLEAN;
  old_policy_exists BOOLEAN;
BEGIN
  -- Check all policies
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND policyname = 'authenticated_can_create_workspaces'
  ) INTO insert_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND policyname = 'owners_can_update_workspaces'
  ) INTO update_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND policyname = 'owners_can_delete_workspaces'
  ) INTO delete_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces'
    AND policyname = 'owners_can_manage_workspaces'
  ) INTO old_policy_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACE INSERT POLICY FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dropped: owners_can_manage_workspaces (FOR ALL): %', NOT old_policy_exists;
  RAISE NOTICE 'INSERT policy exists: %', insert_policy_exists;
  RAISE NOTICE 'UPDATE policy exists: %', update_policy_exists;
  RAISE NOTICE 'DELETE policy exists: %', delete_policy_exists;
  IF old_policy_exists THEN
    RAISE WARNING 'OLD POLICY STILL EXISTS! This will cause conflicts.';
  END IF;
  RAISE NOTICE '========================================';
END $$;

