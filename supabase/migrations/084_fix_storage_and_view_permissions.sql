-- Fix storage policies for public video access and feed_views INSERT permissions
-- Issues:
-- 1. Videos might not be accessible publicly even though bucket is public
-- 2. feed_views INSERT policy is too restrictive

-- ============================================================================
-- STEP 1: Fix storage policies for public read access
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

-- Create simpler public read policy - allow anyone to read from feed-images bucket
CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- ============================================================================
-- STEP 2: Fix feed_views INSERT policy - simplify for anonymous users
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can track views on visible posts" ON public.feed_views;

-- Simplified INSERT policy - allow anyone to insert views for visible posts
CREATE POLICY "Users can track views on visible posts"
  ON public.feed_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Post must be visible (public or members_only for authenticated)
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id = feed_views.feed_id
      AND (
        feed.visibility = 'public'::public.feed_visibility
        OR (
          feed.visibility = 'members_only'::public.feed_visibility
          AND auth.role() = 'authenticated'
        )
      )
    )
    AND
    (
      -- For authenticated users: if profile_id is provided, verify ownership
      -- For anonymous users: profile_id must be NULL
      (
        auth.role() = 'authenticated'
        AND (
          feed_views.profile_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = feed_views.profile_id
            AND EXISTS (
              SELECT 1 FROM public.accounts
              WHERE accounts.id = profiles.account_id
              AND accounts.user_id = auth.uid()
            )
          )
        )
        AND (
          feed_views.user_id IS NULL
          OR feed_views.user_id = auth.uid()
        )
      )
      OR
      (
        auth.role() = 'anon'
        AND feed_views.profile_id IS NULL
        AND feed_views.user_id IS NULL
      )
    )
  );

-- ============================================================================
-- STEP 3: Ensure bucket is public
-- ============================================================================

-- Use INSERT with ON CONFLICT to update bucket settings safely
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-images',
  'feed-images',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================

-- Note: Storage permissions are handled via policies, not direct GRANTs
-- The storage policies above handle access control

-- Grant INSERT permission on feed_views table
GRANT INSERT ON public.feed_views TO anon;
GRANT INSERT ON public.feed_views TO authenticated;

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON POLICY "Public can view feed images" ON storage.objects IS 'Allows public read access to feed-images bucket for displaying images and videos in posts';
COMMENT ON POLICY "Users can track views on visible posts" ON public.feed_views IS 'Allows authenticated and anonymous users to track views on visible posts. Anonymous users can only track via IP address.';

