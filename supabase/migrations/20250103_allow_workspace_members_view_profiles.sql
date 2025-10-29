-- Allow workspace members to view each other's profiles
-- This enables displaying member names, avatars, and emails in workspace settings

-- Add a new RLS policy that allows users to see profiles of other workspace members
-- Users can see profiles if they share at least one workspace together
CREATE POLICY "members_can_view_workspace_member_profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Allow viewing own profile (existing behavior)
        auth.uid() = id OR
        -- Allow viewing profiles of other users who share a workspace with you
        EXISTS (
            SELECT 1 FROM public.workspace_members wm1
            WHERE wm1.profile_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.workspace_members wm2
                WHERE wm2.workspace_id = wm1.workspace_id
                AND wm2.profile_id = profiles.id
            )
        )
    );

