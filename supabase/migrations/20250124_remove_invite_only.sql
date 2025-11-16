-- Remove invite_only from group_visibility enum
-- Must drop all policies that reference group_visibility before altering column type
DROP POLICY IF EXISTS "Users can view discoverable groups or their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can join public/unlisted groups" ON public.group_members;
UPDATE public.groups SET group_visibility = 'public' WHERE group_visibility = 'invite_only';
ALTER TABLE public.groups ALTER COLUMN group_visibility DROP DEFAULT;
ALTER TABLE public.groups ALTER COLUMN group_visibility TYPE TEXT;
DROP TYPE public.group_visibility;
CREATE TYPE public.group_visibility AS ENUM ('public', 'unlisted');
ALTER TABLE public.groups ALTER COLUMN group_visibility TYPE public.group_visibility USING group_visibility::public.group_visibility;
ALTER TABLE public.groups ALTER COLUMN group_visibility SET DEFAULT 'public';
CREATE POLICY "Users can view discoverable groups or their groups"
  ON public.groups FOR SELECT TO authenticated
  USING (group_visibility IN ('public', 'unlisted') OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid()));
CREATE POLICY "Users can join public/unlisted groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_members.group_id AND group_visibility IN ('public', 'unlisted')));

