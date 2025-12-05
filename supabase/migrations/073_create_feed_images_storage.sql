-- Create storage bucket for feed media (images and videos)
-- This bucket stores images and videos associated with feed posts
-- Path structure: {user_id}/feed/{feed_id}/{filename}

-- ============================================================================
-- STEP 1: Create feed-images bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-images',
  'feed-images',
  true,
  104857600, -- 100MB limit (for videos)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    -- Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Storage Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

-- Allow authenticated users to upload feed media (images/videos) for their own feed posts
-- Path structure: {user_id}/feed/{feed_id}/{filename}
-- Policy checks that first folder matches auth.uid() and feed post belongs to user
CREATE POLICY "Users can upload own feed images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    -- Verify the feed post belongs to the user
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id::text = (storage.foldername(name))[3]
      AND feed.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to update their own feed media (images/videos)
CREATE POLICY "Users can update own feed images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id::text = (storage.foldername(name))[3]
      AND feed.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id::text = (storage.foldername(name))[3]
      AND feed.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to delete their own feed media (images/videos)
CREATE POLICY "Users can delete own feed images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'feed' AND
    EXISTS (
      SELECT 1 FROM public.feed
      WHERE feed.id::text = (storage.foldername(name))[3]
      AND feed.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow public read access to feed media (images/videos)
CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

