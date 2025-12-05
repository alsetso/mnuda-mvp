-- Create feed engagement tables (likes and comments) for social media interactions
-- Users can like and comment on published feed posts

-- ============================================================================
-- STEP 1: Create feed_likes table
-- ============================================================================

CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL
    REFERENCES public.feed(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT feed_likes_unique_like UNIQUE (feed_id, profile_id)
);

-- ============================================================================
-- STEP 2: Create feed_comments table
-- ============================================================================

CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL
    REFERENCES public.feed(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Parent comment for threading (nullable for top-level comments)
  parent_comment_id UUID
    REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT feed_comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

-- Feed likes indexes
CREATE INDEX feed_likes_feed_id_idx
  ON public.feed_likes (feed_id);

CREATE INDEX feed_likes_profile_id_idx
  ON public.feed_likes (profile_id);

CREATE INDEX feed_likes_created_at_idx
  ON public.feed_likes (created_at DESC);

-- Feed comments indexes
CREATE INDEX feed_comments_feed_id_idx
  ON public.feed_comments (feed_id);

CREATE INDEX feed_comments_profile_id_idx
  ON public.feed_comments (profile_id);

CREATE INDEX feed_comments_parent_comment_id_idx
  ON public.feed_comments (parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE INDEX feed_comments_created_at_idx
  ON public.feed_comments (created_at DESC);

-- ============================================================================
-- STEP 4: Create triggers
-- ============================================================================

-- Trigger to update updated_at for comments
CREATE TRIGGER update_feed_comments_updated_at
  BEFORE UPDATE ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update feed.likes_count when likes are added/removed
CREATE OR REPLACE FUNCTION public.update_feed_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed
    SET likes_count = likes_count + 1
    WHERE id = NEW.feed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.feed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_feed_likes_count_on_insert
  AFTER INSERT ON public.feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_likes_count();

CREATE TRIGGER update_feed_likes_count_on_delete
  AFTER DELETE ON public.feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_likes_count();

-- Trigger to update feed.comments_count when comments are added/removed
CREATE OR REPLACE FUNCTION public.update_feed_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed
    SET comments_count = comments_count + 1
    WHERE id = NEW.feed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.feed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_feed_comments_count_on_insert
  AFTER INSERT ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_comments_count();

CREATE TRIGGER update_feed_comments_count_on_delete
  AFTER DELETE ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_comments_count();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies for feed_likes
-- ============================================================================

-- Users can view all likes on published feed posts
CREATE POLICY "Users can view likes on published posts"
  ON public.feed_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND feed.status = 'published'::public.feed_status
    )
  );

-- Users can like published feed posts
CREATE POLICY "Users can like published posts"
  ON public.feed_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the feed post is published
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_likes.feed_id
      AND feed.status = 'published'::public.feed_status
    )
    AND
    -- Verify the profile belongs to the authenticated user
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_likes.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can unlike their own likes
CREATE POLICY "Users can unlike own likes"
  ON public.feed_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_likes.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all likes
CREATE POLICY "Admins can view all likes"
  ON public.feed_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Admins can delete any like
CREATE POLICY "Admins can delete any like"
  ON public.feed_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 7: Create RLS policies for feed_comments
-- ============================================================================

-- Users can view all comments on published feed posts
CREATE POLICY "Users can view comments on published posts"
  ON public.feed_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND feed.status = 'published'::public.feed_status
    )
  );

-- Users can comment on published feed posts
CREATE POLICY "Users can comment on published posts"
  ON public.feed_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the feed post is published
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_comments.feed_id
      AND feed.status = 'published'::public.feed_status
    )
    AND
    -- Verify the profile belongs to the authenticated user
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_comments.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
    AND
    -- If replying to a comment, verify parent comment exists on same post
    (
      feed_comments.parent_comment_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM public.feed_comments AS parent
        WHERE parent.id = feed_comments.parent_comment_id
        AND parent.feed_id = feed_comments.feed_id
      )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.feed_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_comments.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.feed_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed_comments.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
  ON public.feed_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Admins can update all comments
CREATE POLICY "Admins can update all comments"
  ON public.feed_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Admins can delete all comments
CREATE POLICY "Admins can delete all comments"
  ON public.feed_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON public.feed_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_comments TO authenticated;

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================

COMMENT ON TABLE public.feed_likes IS 'Tracks which users liked which feed posts. One like per user per post.';
COMMENT ON COLUMN public.feed_likes.feed_id IS 'References feed.id - the post that was liked';
COMMENT ON COLUMN public.feed_likes.profile_id IS 'References profiles.id - the profile that liked the post';

COMMENT ON TABLE public.feed_comments IS 'Comments on feed posts. Supports threading via parent_comment_id.';
COMMENT ON COLUMN public.feed_comments.feed_id IS 'References feed.id - the post this comment is on';
COMMENT ON COLUMN public.feed_comments.profile_id IS 'References profiles.id - the profile that created this comment';
COMMENT ON COLUMN public.feed_comments.content IS 'Comment text (1-2000 characters)';
COMMENT ON COLUMN public.feed_comments.parent_comment_id IS 'References feed_comments.id - parent comment for threading (null for top-level comments)';

