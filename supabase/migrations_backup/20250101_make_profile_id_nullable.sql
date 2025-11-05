-- Make profile_id nullable to allow email-only invitations
-- This allows inviting users who don't have accounts yet

-- Make profile_id nullable
ALTER TABLE public.workspace_members 
ALTER COLUMN profile_id DROP NOT NULL;

-- Update the primary key to allow null profile_id
-- First drop the existing primary key
ALTER TABLE public.workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_pkey;

-- Add a unique constraint that works with nullable profile_id
-- This ensures we can't have duplicate email invitations or duplicate profile_id memberships
CREATE UNIQUE INDEX workspace_members_unique_profile 
ON public.workspace_members (workspace_id, profile_id) 
WHERE profile_id IS NOT NULL;

CREATE UNIQUE INDEX workspace_members_unique_email 
ON public.workspace_members (workspace_id, email) 
WHERE email IS NOT NULL;

-- Update RLS policy to allow workspace owners to add members
DROP POLICY IF EXISTS "authenticated_can_create_memberships" ON public.workspace_members;

CREATE POLICY "workspace_owners_can_add_members"
ON public.workspace_members 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if adding yourself by profile_id
  (profile_id IS NOT NULL AND auth.uid() = profile_id) OR
  -- Allow if you're a workspace owner adding by email
  (email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id 
    AND wm.profile_id = auth.uid() 
    AND wm.role = 'owner'
  ))
);

-- Update is_member function to handle email-based memberships
CREATE OR REPLACE FUNCTION public.is_member(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACE_MEMBERS TABLE UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profile_id is now nullable';
  RAISE NOTICE 'Unique constraints added for profile_id and email';
  RAISE NOTICE 'RLS policy updated to allow owners to add by email';
  RAISE NOTICE '========================================';
END $$;
