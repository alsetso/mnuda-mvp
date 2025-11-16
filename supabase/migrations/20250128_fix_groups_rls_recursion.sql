-- Fix infinite recursion in groups RLS policy
-- The groups SELECT policy checks group_members, which checks groups, causing recursion
-- Solution: Check ownership via groups.created_by directly, avoid recursive group_members checks

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view discoverable groups or their groups" ON public.groups;

-- Recreate with non-recursive checks
-- SELECT: Viewable if public/unlisted OR user is owner (created_by)
-- Note: We removed the membership check to avoid recursion.
-- Users can still see groups they're members of if the group is public/unlisted.
-- For private groups, we rely on created_by check (ownership).
CREATE POLICY "Users can view discoverable groups or their groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    -- Public or unlisted groups are always viewable
    group_visibility IN ('public', 'unlisted')
    OR
    -- User owns the group (check created_by directly to avoid recursion)
    created_by = auth.uid()
  );

-- Also fix UPDATE and DELETE policies to use created_by instead of group_members
DROP POLICY IF EXISTS "Owners can update groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can delete groups" ON public.groups;

-- UPDATE: Only owners can update (check via created_by to avoid recursion)
CREATE POLICY "Owners can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: Only owners can delete (check via created_by to avoid recursion)
CREATE POLICY "Owners can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

