-- Add visibility enum and column to feed table
-- Visibility options: 'public' (anyone can view), 'members_only' (authenticated users only), 'draft' (creator only)

-- ============================================================================
-- STEP 1: Create feed_visibility enum
-- ============================================================================

CREATE TYPE public.feed_visibility AS ENUM (
  'public',
  'members_only',
  'draft'
);

-- ============================================================================
-- STEP 2: Add visibility column to feed table
-- ============================================================================

ALTER TABLE public.feed
  ADD COLUMN visibility public.feed_visibility NOT NULL DEFAULT 'members_only'::public.feed_visibility;

-- ============================================================================
-- STEP 3: Update existing posts to have appropriate visibility
-- ============================================================================

-- Set published posts to members_only (was the old behavior)
UPDATE public.feed
SET visibility = 'members_only'::public.feed_visibility
WHERE status = 'published'::public.feed_status;

-- Set draft posts to draft visibility
UPDATE public.feed
SET visibility = 'draft'::public.feed_visibility
WHERE status = 'draft'::public.feed_status;

-- ============================================================================
-- STEP 4: Create index for visibility queries
-- ============================================================================

CREATE INDEX feed_visibility_idx
  ON public.feed (visibility);

CREATE INDEX feed_visibility_status_idx
  ON public.feed (visibility, status);

-- ============================================================================
-- STEP 5: Drop old RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view published feed posts" ON public.feed;
DROP POLICY IF EXISTS "Users can view own feed posts" ON public.feed;

-- ============================================================================
-- STEP 6: Create new RLS policies with visibility support
-- ============================================================================

-- Anonymous users can view public feed posts
CREATE POLICY "Anonymous can view public feed posts"
  ON public.feed
  FOR SELECT
  TO anon
  USING (visibility = 'public'::public.feed_visibility);

-- Authenticated users can view public and members_only feed posts
CREATE POLICY "Authenticated users can view public and members_only posts"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.feed_visibility OR
    visibility = 'members_only'::public.feed_visibility
  );

-- Users can view their own feed posts (including drafts)
CREATE POLICY "Users can view own feed posts"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all feed posts
-- (Keep existing admin policy)

-- ============================================================================
-- STEP 7: Update comments
-- ============================================================================

COMMENT ON TYPE public.feed_visibility IS 'Feed post visibility: public (anyone), members_only (authenticated users), draft (creator only)';
COMMENT ON COLUMN public.feed.visibility IS 'Post visibility level: public (anyone can view), members_only (authenticated users only), draft (creator only)';

