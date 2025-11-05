-- Add email column to workspace_members table (simplified version)
-- This allows storing invitations for users who don't have profiles yet

-- Add email column to workspace_members
ALTER TABLE public.workspace_members 
ADD COLUMN email TEXT;

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

-- Add policy to allow workspace owners to add members by email
CREATE POLICY "owners_can_add_members_by_email"
ON public.workspace_members 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if adding yourself by profile_id
  auth.uid() = profile_id OR
  -- Allow if you're a workspace owner adding by email
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id 
    AND wm.profile_id = auth.uid() 
    AND wm.role = 'owner'
  )
);

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
  RAISE NOTICE 'Updated is_member function to check email';
  RAISE NOTICE 'Added policy for owners to add by email';
  RAISE NOTICE '========================================';
END $$;
