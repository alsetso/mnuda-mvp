-- Create groups system for public communities
-- MVP: Public groups only, basic membership, group feed

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  emoji TEXT,
  description TEXT CHECK (char_length(description) <= 500),
  logo_image_url TEXT,
  cover_image_url TEXT,
  website TEXT,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table (many-to-many)
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Group posts table (group feed)
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints to members table for PostgREST joins
-- Member records are created automatically via trigger when users sign up
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_user_id_members_fk 
FOREIGN KEY (user_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.group_posts
ADD CONSTRAINT group_posts_user_id_members_fk 
FOREIGN KEY (user_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON public.group_posts(user_id);

-- Function to update member_count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member_count
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Function to add creator as owner
CREATE OR REPLACE FUNCTION public.add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, is_owner)
  VALUES (NEW.id, NEW.created_by, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as owner
CREATE TRIGGER add_group_creator_as_owner_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_creator_as_owner();

-- Trigger to update updated_at
CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON public.groups 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_posts TO authenticated;

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Groups
CREATE POLICY "Anyone can view groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_owner = true
    )
  );

CREATE POLICY "Owners can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_owner = true
    )
  );

-- RLS Policies: Group Members
CREATE POLICY "Anyone can view group members"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies: Group Posts
CREATE POLICY "Anyone can view group posts"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can create posts"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own posts"
  ON public.group_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime for group posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;

