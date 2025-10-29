-- Add email column to workspace_members table
-- This allows storing invitations for users who don't have profiles yet

-- Add email column to workspace_members
ALTER TABLE public.workspace_members 
ADD COLUMN email TEXT;

-- Update the primary key constraint to allow multiple entries per workspace
-- (since we can have both profile_id and email for the same workspace)
ALTER TABLE public.workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_pkey;

-- Create a new unique constraint that allows either profile_id OR email per workspace
CREATE UNIQUE INDEX workspace_members_unique_member 
ON public.workspace_members (workspace_id, COALESCE(profile_id::text, email));

-- Add constraint to ensure either profile_id or email is provided
ALTER TABLE public.workspace_members 
ADD CONSTRAINT workspace_members_profile_or_email_check 
CHECK (
  (profile_id IS NOT NULL AND email IS NULL) OR 
  (profile_id IS NULL AND email IS NOT NULL)
);

-- Update RLS policies to handle email-based memberships
CREATE POLICY "authenticated_can_create_memberships_by_email"
ON public.workspace_members 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if adding yourself by profile_id
  auth.uid() = profile_id OR
  -- Allow if you're a workspace owner adding by email
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    JOIN public.workspaces w ON wm.workspace_id = w.id
    WHERE wm.workspace_id = workspace_id 
    AND wm.profile_id = auth.uid() 
    AND wm.role = 'owner'
  )
);

-- Update the is_member function to check both profile_id and email
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
DECLARE
  email_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'workspace_members' 
    AND column_name = 'email'
  ) INTO email_column_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMAIL COLUMN ADDED TO WORKSPACE_MEMBERS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email column exists: %', email_column_exists;
  RAISE NOTICE 'Constraint: profile_id OR email required';
  RAISE NOTICE 'Unique constraint: workspace + (profile_id OR email)';
  RAISE NOTICE '========================================';
END $$;
