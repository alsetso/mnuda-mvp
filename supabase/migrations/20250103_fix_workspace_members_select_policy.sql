-- Fix workspace_members SELECT policy to break circular dependency
-- The is_member() function queries workspace_members, so we need a direct SELECT policy
-- that doesn't depend on is_member() itself

-- Drop existing SELECT policies that use is_member (they cause circular dependency)
DROP POLICY IF EXISTS "members_can_view_their_memberships" ON workspace_members;

-- Create a direct SELECT policy that allows users to see their own memberships
-- This breaks the circular dependency with is_member()
CREATE POLICY "members_can_view_their_memberships" ON workspace_members
    FOR SELECT
    TO authenticated
    USING (
        profile_id = auth.uid() OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Also ensure the is_member function can work by making it SECURITY DEFINER
-- This allows it to bypass RLS when checking membership (required for RLS policies)
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

