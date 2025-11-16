-- Add foreign key relationship from community_feed to members
-- This allows PostgREST to understand the relationship and enables automatic joins if needed
-- Both community_feed.user_id and members.id reference auth.users(id), so this FK is valid

-- First, ensure all existing users in community_feed have member records
-- (This should already be handled by the trigger, but we'll ensure it)
-- Use the default role value from the table definition
INSERT INTO public.members (id, email, name)
SELECT DISTINCT 
  cf.user_id, 
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM public.community_feed cf
JOIN auth.users au ON au.id = cf.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.members m WHERE m.id = cf.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraint
ALTER TABLE public.community_feed
ADD CONSTRAINT community_feed_user_id_members_fk 
FOREIGN KEY (user_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT community_feed_user_id_members_fk ON public.community_feed IS 
'Foreign key to members table. Ensures that only users with member records can post messages.';

