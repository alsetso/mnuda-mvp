-- Add group visibility and feed visibility controls
-- Allows groups to be public or unlisted
-- Allows feeds to be public or members-only

-- Create ENUM types
CREATE TYPE public.group_visibility AS ENUM ('public', 'unlisted');
CREATE TYPE public.feed_visibility AS ENUM ('public', 'members_only');

-- Add visibility columns to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS group_visibility public.group_visibility NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS feed_visibility public.feed_visibility NOT NULL DEFAULT 'public';

-- Create index for filtering by visibility
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(group_visibility);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Anyone can view group posts" ON public.group_posts;

-- RLS Policy: Groups - View
-- Users can view: 
--   - public groups (visible in listings)
--   - unlisted groups (accessible via direct link only, not in listings)
--   - any group they are a member of
CREATE POLICY "Users can view discoverable groups or their groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    group_visibility IN ('public', 'unlisted') OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Note: Unlisted groups are accessible via direct link (frontend handles hiding from listings)
-- All authenticated users can view unlisted groups if they have the URL

-- RLS Policy: Group Members - Join
-- Users can join: 
--   - public groups (anyone can join)
--   - unlisted groups (anyone with link can join)
CREATE POLICY "Users can join public/unlisted groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id 
      AND group_visibility IN ('public', 'unlisted')
    )
  );

-- RLS Policy: Group Posts - View
-- Users can view posts if: feed is public OR they are a member
CREATE POLICY "Users can view posts if feed is public or they are members"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_posts.group_id
      AND (
        feed_visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_id = group_posts.group_id AND user_id = auth.uid()
        )
      )
    )
  );


