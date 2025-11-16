-- Fix infinite recursion in group_members RLS policy
-- The policy was checking group_members to determine ownership/membership,
-- which triggered the same policy recursively.
-- Solution: Check ownership via groups.created_by instead

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of viewable groups" ON public.group_members;

-- Recreate with non-recursive checks
-- SELECT: Viewable if group is public/unlisted OR user is member OR user is owner
-- Owners can see all members (pending, approved, denied)
-- Regular users can see approved members of viewable groups
CREATE POLICY "Users can view members of viewable groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    -- Owner can see all members of their groups (check via groups.created_by to avoid recursion)
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
    OR
    -- User can see approved members if group is viewable (public/unlisted)
    -- OR if they are viewing their own membership
    (
      approval_status = 'approved'
      AND (
        EXISTS (
          SELECT 1 FROM public.groups g
          WHERE g.id = group_members.group_id
          AND g.group_visibility IN ('public', 'unlisted')
        )
        OR
        user_id = auth.uid()
      )
    )
    OR
    -- User can see their own membership regardless of status
    user_id = auth.uid()
  );

