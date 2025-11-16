-- Add approval system for group membership
-- Supports customizable intake questions (up to 3) and approval workflow

-- Add approval_status to group_members
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
CHECK (approval_status IN ('pending', 'approved', 'denied'));

-- Add requires_approval flag to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

-- Create intake questions table
CREATE TABLE IF NOT EXISTS public.group_intake_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (char_length(question_text) >= 3 AND char_length(question_text) <= 200),
  question_order INTEGER NOT NULL CHECK (question_order >= 1 AND question_order <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (group_id, question_order)
);

-- Create intake responses table
CREATE TABLE IF NOT EXISTS public.group_intake_responses (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.group_intake_questions(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL CHECK (char_length(response_text) > 0 AND char_length(response_text) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_intake_questions_group_id ON public.group_intake_questions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_intake_responses_group_user ON public.group_intake_responses(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_intake_responses_question ON public.group_intake_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_group_members_approval_status ON public.group_members(group_id, approval_status);

-- Update member_count trigger to only count approved members
DROP TRIGGER IF EXISTS update_group_member_count_trigger ON public.group_members;
DROP FUNCTION IF EXISTS public.update_group_member_count();

CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only increment if approved
    IF NEW.approval_status = 'approved' THEN
      UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.approval_status != 'approved' AND NEW.approval_status = 'approved' THEN
      UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF OLD.approval_status = 'approved' AND NEW.approval_status != 'approved' THEN
      UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement if was approved
    IF OLD.approval_status = 'approved' THEN
      UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Update existing members to approved status
UPDATE public.group_members SET approval_status = 'approved' WHERE approval_status IS NULL;

-- RLS Policies for intake questions
ALTER TABLE public.group_intake_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_intake_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can view intake questions for groups they can see
CREATE POLICY "Anyone can view intake questions"
  ON public.group_intake_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_intake_questions.group_id
      AND (group_visibility IN ('public', 'unlisted') OR EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = groups.id AND user_id = auth.uid()
      ))
    )
  );

-- Owners can manage intake questions
CREATE POLICY "Owners can manage intake questions"
  ON public.group_intake_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_questions.group_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_questions.group_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
  ON public.group_intake_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owners can view all responses for their groups
CREATE POLICY "Owners can view all responses"
  ON public.group_intake_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_responses.group_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

-- Users can create responses when joining
CREATE POLICY "Users can create responses"
  ON public.group_intake_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_responses.group_id
      AND user_id = auth.uid()
      AND approval_status = 'pending'
    )
  );

-- Update group_members policies to handle approval status
DROP POLICY IF EXISTS "Users can join public/unlisted groups" ON public.group_members;

-- Users can request to join (creates pending membership)
CREATE POLICY "Users can request to join groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND approval_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id
      AND group_visibility IN ('public', 'unlisted')
    )
  );

-- Owners can approve/deny members
CREATE POLICY "Owners can update member status"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_owner = true
    )
  );

-- Update posts policy to only allow approved members
DROP POLICY IF EXISTS "Members can create posts" ON public.group_posts;

CREATE POLICY "Approved members can create posts"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_posts.group_id
      AND user_id = auth.uid()
      AND approval_status = 'approved'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_intake_questions TO authenticated;
GRANT SELECT, INSERT ON public.group_intake_responses TO authenticated;

