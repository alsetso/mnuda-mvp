-- Update members table RLS to allow authenticated users to view all member records
-- This is needed for the community feed to display member names and avatars
-- Members can still only update their own records

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own member record" ON public.members;

-- Create new policy: All authenticated users can view all member records (for community feed)
CREATE POLICY "Authenticated users can view all member records"
  ON public.members
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment explaining the policy
COMMENT ON POLICY "Authenticated users can view all member records" ON public.members IS 
'Allows authenticated users to view all member records for displaying names and avatars in the community feed. Members can still only update their own records.';

-- Ensure all existing authenticated users have member records
-- This handles edge cases where users might exist without member records
-- Use the default role value from the table definition
INSERT INTO public.members (id, email, name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.members m WHERE m.id = au.id
)
ON CONFLICT (id) DO NOTHING;

