-- Drop all groups-related tables, functions, triggers, and policies
-- This removes the entire groups feature from the database

-- Drop triggers first (they depend on tables)
DROP TRIGGER IF EXISTS update_group_member_count_trigger ON public.group_members;
DROP TRIGGER IF EXISTS add_group_creator_as_owner_trigger ON public.groups;
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_group_member_count() CASCADE;
DROP FUNCTION IF EXISTS public.add_group_creator_as_owner() CASCADE;

-- Remove from realtime publication (if table exists in publication)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'group_posts' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.group_posts;
  END IF;
END $$;

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS public.group_intake_responses CASCADE;
DROP TABLE IF EXISTS public.group_intake_questions CASCADE;
DROP TABLE IF EXISTS public.group_posts CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS public.group_visibility CASCADE;
DROP TYPE IF EXISTS public.feed_visibility CASCADE;
DROP TYPE IF EXISTS public.approval_status CASCADE;

