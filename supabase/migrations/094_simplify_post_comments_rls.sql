-- Simplify post_comments RLS to match simplified posts RLS
-- Remove profile ownership requirement - allow any authenticated user to comment
-- Comments follow the same visibility rules as their parent post

-- ============================================================================
-- STEP 1: Create post_comments table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL, -- No foreign key constraint (simplified like posts)
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT post_comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_profile_id_idx ON public.post_comments(profile_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_comment_id_idx ON public.post_comments(parent_comment_id);

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_post_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_post_comments_updated_at
      BEFORE UPDATE ON public.post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create function to update posts.comments_count if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_posts_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for comments_count if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_comments_count_on_insert'
  ) THEN
    CREATE TRIGGER update_posts_comments_count_on_insert
      AFTER INSERT ON public.post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_posts_comments_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_comments_count_on_delete'
  ) THEN
    CREATE TRIGGER update_posts_comments_count_on_delete
      AFTER DELETE ON public.post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_posts_comments_count();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop foreign key constraint on profile_id if it exists (keep column for reference)
-- ============================================================================

ALTER TABLE public.post_comments 
  DROP CONSTRAINT IF EXISTS post_comments_profile_id_fkey;

-- ============================================================================
-- STEP 2: Simplify SELECT policies - follow post visibility
-- ============================================================================

-- Drop existing select policies
DROP POLICY IF EXISTS "post_comments_select_anon" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_select_authenticated" ON public.post_comments;

-- Anonymous: View comments on public posts only
CREATE POLICY "post_comments_select_anon"
  ON public.post_comments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_comments.post_id
      AND posts.visibility = 'public'::public.post_visibility
    )
  );

COMMENT ON POLICY "post_comments_select_anon" ON public.post_comments IS 
  'Anonymous users can view comments on public posts only.';

-- Authenticated: View comments on visible posts (public or members_only, not draft)
CREATE POLICY "post_comments_select_authenticated"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_comments.post_id
      AND posts.visibility IN (
        'public'::public.post_visibility,
        'members_only'::public.post_visibility
      )
    )
  );

COMMENT ON POLICY "post_comments_select_authenticated" ON public.post_comments IS 
  'Authenticated users can view comments on public and members_only posts. No profile ownership check.';

-- ============================================================================
-- STEP 3: Simplify INSERT policy - only require authentication and post visibility
-- ============================================================================

DROP POLICY IF EXISTS "post_comments_insert" ON public.post_comments;

CREATE POLICY "post_comments_insert"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only require authentication - no profile ownership check
    auth.uid() IS NOT NULL
    AND
    -- Post must be visible (public or members_only, not draft)
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_comments.post_id
      AND posts.visibility IN (
        'public'::public.post_visibility,
        'members_only'::public.post_visibility
      )
    )
    AND
    -- If parent_comment_id is provided, it must exist and be on the same post
    (
      post_comments.parent_comment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.post_comments pc
        WHERE pc.id = post_comments.parent_comment_id
        AND pc.post_id = post_comments.post_id
      )
    )
  );

COMMENT ON POLICY "post_comments_insert" ON public.post_comments IS 
  'Allows any authenticated user to comment on visible posts. No profile ownership check required.';

-- ============================================================================
-- STEP 4: Simplify UPDATE policy - any authenticated user can update
-- ============================================================================

DROP POLICY IF EXISTS "post_comments_update" ON public.post_comments;

CREATE POLICY "post_comments_update"
  ON public.post_comments FOR UPDATE
  TO authenticated
  USING (
    -- Any authenticated user can update any comment
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- After update, must still be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Content must still be valid
    char_length(post_comments.content) >= 1
    AND char_length(post_comments.content) <= 2000
  );

COMMENT ON POLICY "post_comments_update" ON public.post_comments IS 
  'Allows any authenticated user to update any comment. No ownership check.';

-- ============================================================================
-- STEP 5: Simplify DELETE policy - any authenticated user can delete
-- ============================================================================

DROP POLICY IF EXISTS "post_comments_delete" ON public.post_comments;

CREATE POLICY "post_comments_delete"
  ON public.post_comments FOR DELETE
  TO authenticated
  USING (
    -- Any authenticated user can delete any comment
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "post_comments_delete" ON public.post_comments IS 
  'Allows any authenticated user to delete any comment. No ownership check.';

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.post_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;

-- ============================================================================
-- STEP 7: Add table comments
-- ============================================================================

COMMENT ON TABLE public.post_comments IS 
  'Comments on posts. Follows same visibility rules as parent post. No profile ownership required.';

COMMENT ON COLUMN public.post_comments.post_id IS 
  'References posts.id - the post this comment is on';

COMMENT ON COLUMN public.post_comments.profile_id IS 
  'Profile that created the comment - no foreign key constraint, can reference any profile_id';

COMMENT ON COLUMN public.post_comments.parent_comment_id IS 
  'References post_comments.id - parent comment for threading (null for top-level comments)';

COMMENT ON COLUMN public.post_comments.content IS 
  'Comment text (1-2000 characters)';
