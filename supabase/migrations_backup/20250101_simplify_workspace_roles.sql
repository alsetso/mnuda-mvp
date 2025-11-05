-- Simplify workspace roles to owner/member only
-- This migration updates the workspace_members table to use simplified roles

-- Update the role constraint to only allow 'owner' and 'member'
ALTER TABLE public.workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE public.workspace_members 
ADD CONSTRAINT workspace_members_role_check 
CHECK (role IN ('owner', 'member'));

-- Update any existing 'admin', 'editor', 'viewer' roles to 'member'
UPDATE public.workspace_members 
SET role = 'member' 
WHERE role IN ('admin', 'editor', 'viewer');

-- Update default role to 'member'
ALTER TABLE public.workspace_members 
ALTER COLUMN role SET DEFAULT 'member';

-- Verification
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count 
  FROM public.workspace_members 
  WHERE role NOT IN ('owner', 'member');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WORKSPACE ROLES SIMPLIFIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Invalid roles remaining: %', role_count;
  RAISE NOTICE 'Valid roles: owner, member';
  RAISE NOTICE 'Default role: member';
  RAISE NOTICE '========================================';
END $$;
