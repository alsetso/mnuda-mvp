-- Fix Groups RLS Policies
-- Consolidates and fixes all RLS contradictions based on user experience requirements
-- See GROUPS_RLS_SPEC.md for detailed requirements

-- ============================================================================
-- DROP ALL EXISTING POLICIES (Clean Slate)
-- ============================================================================

-- Groups policies
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view discoverable groups or their groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can update groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can delete groups" ON public.groups;

-- Group members policies
DROP POLICY IF EXISTS "Anyone can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join public/unlisted groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can request to join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Owners can update member status" ON public.group_members;

-- Group posts policies
DROP POLICY IF EXISTS "Anyone can view group posts" ON public.group_posts;
DROP POLICY IF EXISTS "Users can view posts if feed is public or they are members" ON public.group_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.group_posts;
DROP POLICY IF EXISTS "Approved members can create posts" ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.group_posts;

-- Intake questions policies
DROP POLICY IF EXISTS "Anyone can view intake questions" ON public.group_intake_questions;
DROP POLICY IF EXISTS "Owners can manage intake questions" ON public.group_intake_questions;

-- Intake responses policies
DROP POLICY IF EXISTS "Users can view own responses" ON public.group_intake_responses;
DROP POLICY IF EXISTS "Owners can view all responses" ON public.group_intake_responses;
DROP POLICY IF EXISTS "Users can create responses" ON public.group_intake_responses;

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- SELECT: Viewable if public/unlisted OR user is member
CREATE POLICY "Users can view discoverable groups or their groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    group_visibility IN ('public', 'unlisted') OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid()
      AND approval_status = 'approved'
    )
  );

-- INSERT: Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only owners can update
CREATE POLICY "Owners can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND is_owner = true
      AND approval_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND is_owner = true
      AND approval_status = 'approved'
    )
  );

-- DELETE: Only owners can delete
CREATE POLICY "Owners can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND is_owner = true
      AND approval_status = 'approved'
    )
  );

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

-- SELECT: Viewable if group is public/unlisted OR user is member OR user is owner
-- Owners can see all members (pending, approved, denied)
-- Regular users can see approved members of viewable groups
CREATE POLICY "Users can view members of viewable groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    -- Owner can see all members of their groups
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_owner = true
      AND gm.approval_status = 'approved'
    )
    OR
    -- User can see approved members if group is viewable
    (
      approval_status = 'approved'
      AND (
        EXISTS (
          SELECT 1 FROM public.groups
          WHERE id = group_members.group_id
          AND group_visibility IN ('public', 'unlisted')
        )
        OR
        EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.approval_status = 'approved'
        )
      )
    )
    OR
    -- User can see their own membership regardless of status
    user_id = auth.uid()
  );

-- INSERT: Users can join public/unlisted groups
-- If requires_approval = false: approval_status must be 'approved'
-- If requires_approval = true: approval_status must be 'pending'
CREATE POLICY "Users can join public/unlisted groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
      AND g.group_visibility IN ('public', 'unlisted')
      AND (
        -- If no approval required, must be approved
        (g.requires_approval = false AND group_members.approval_status = 'approved')
        OR
        -- If approval required, must be pending
        (g.requires_approval = true AND group_members.approval_status = 'pending')
      )
    )
  );

-- UPDATE: Only owners can update (for approval workflow)
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
      AND gm.approval_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_owner = true
      AND gm.approval_status = 'approved'
    )
  );

-- DELETE: Users can leave groups (delete own membership)
CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- GROUP_POSTS TABLE POLICIES
-- ============================================================================

-- SELECT: Viewable if feed is public OR user is approved member
CREATE POLICY "Users can view posts if feed is public or they are approved members"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_posts.group_id
      AND (
        feed_visibility = 'public'
        OR
        EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_id = group_posts.group_id
          AND user_id = auth.uid()
          AND approval_status = 'approved'
        )
      )
    )
  );

-- INSERT: Only approved members can create posts
CREATE POLICY "Approved members can create posts"
  ON public.group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_posts.group_id
      AND user_id = auth.uid()
      AND approval_status = 'approved'
    )
  );

-- DELETE: Users can delete own posts
CREATE POLICY "Users can delete own posts"
  ON public.group_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- GROUP_INTAKE_QUESTIONS TABLE POLICIES
-- ============================================================================

-- SELECT: Viewable if group is viewable
CREATE POLICY "Users can view intake questions for viewable groups"
  ON public.group_intake_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_intake_questions.group_id
      AND (
        group_visibility IN ('public', 'unlisted')
        OR
        EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_id = group_intake_questions.group_id
          AND user_id = auth.uid()
          AND approval_status = 'approved'
        )
      )
    )
  );

-- INSERT/UPDATE/DELETE: Only owners can manage
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
      AND approval_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_questions.group_id
      AND user_id = auth.uid()
      AND is_owner = true
      AND approval_status = 'approved'
    )
  );

-- ============================================================================
-- GROUP_INTAKE_RESPONSES TABLE POLICIES
-- ============================================================================

-- SELECT: Users can view own responses OR owners can view all
CREATE POLICY "Users can view own responses or owners can view all"
  ON public.group_intake_responses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_intake_responses.group_id
      AND user_id = auth.uid()
      AND is_owner = true
      AND approval_status = 'approved'
    )
  );

-- INSERT: Users can create responses when they have pending membership
CREATE POLICY "Users can create responses when joining"
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
    AND EXISTS (
      SELECT 1 FROM public.group_intake_questions
      WHERE id = group_intake_responses.question_id
      AND group_id = group_intake_responses.group_id
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS (Ensure all necessary permissions are granted)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_intake_questions TO authenticated;
GRANT SELECT, INSERT ON public.group_intake_responses TO authenticated;

