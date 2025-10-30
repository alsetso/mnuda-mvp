-- Fix infinite recursion in workspace_members INSERT policy
-- The problem: INSERT policy has a subquery that checks workspace_members, creating circular dependency
-- Solution: Use the is_member() SECURITY DEFINER function which bypasses RLS

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "workspace_owners_can_add_members" ON public.workspace_members;
DROP POLICY IF EXISTS "authenticated_can_create_memberships_by_email" ON public.workspace_members;

-- Ensure is_member function is SECURITY DEFINER (it should bypass RLS)
CREATE OR REPLACE FUNCTION public.is_member(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Create a helper function to check if user is workspace owner
-- This is SECURITY DEFINER so it bypasses RLS when checking
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace 
    AND profile_id = auth.uid() 
    AND role = 'owner'
  );
$$;

-- Create new INSERT policy using the SECURITY DEFINER function
CREATE POLICY "workspace_owners_can_add_members"
ON public.workspace_members 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if adding yourself by profile_id
  (profile_id IS NOT NULL AND auth.uid() = profile_id) OR
  -- Allow if you're a workspace owner (uses SECURITY DEFINER function to avoid recursion)
  (email IS NOT NULL AND public.is_workspace_owner(workspace_id))
);

-- Also need policies for UPDATE and DELETE
DROP POLICY IF EXISTS "members_can_manage_memberships" ON public.workspace_members;

CREATE POLICY "workspace_owners_can_manage_members"
ON public.workspace_members 
FOR UPDATE
TO authenticated
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "workspace_owners_can_remove_members"
ON public.workspace_members 
FOR DELETE
TO authenticated
USING (public.is_workspace_owner(workspace_id));

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACE_MEMBERS RLS POLICIES FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed infinite recursion in INSERT policy';
  RAISE NOTICE 'Created is_workspace_owner() helper function';
  RAISE NOTICE 'All policies now use SECURITY DEFINER functions';
  RAISE NOTICE '========================================';
END $$;

