-- Ensure storage policies exist for feed-images bucket (used for posts media)
-- This ensures public read access works for images and videos

-- ============================================================================
-- STEP 1: Ensure bucket exists and is public
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-images',
  'feed-images',
  true, -- Public bucket - anyone can read
  104857600, -- 100MB limit (for videos)
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- ============================================================================
-- STEP 2: Ensure public read policy exists
-- ============================================================================

-- Drop existing policy if it exists (to recreate cleanly)
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

-- Create public read policy - allows anyone (authenticated or anonymous) to read from feed-images bucket
CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- ============================================================================
-- STEP 3: Ensure upload policy exists (for authenticated users)
-- ============================================================================

-- Drop existing upload policy
DROP POLICY IF EXISTS "Users can upload own feed images" ON storage.objects;

-- Create upload policy - allows authenticated users to upload to their own folder
-- Path structure: {user_id}/feed/{post_id}/{filename}
CREATE POLICY "Users can upload own feed images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STEP 4: Ensure update policy exists
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own feed images" ON storage.objects;

CREATE POLICY "Users can update own feed images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STEP 5: Ensure delete policy exists
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;

CREATE POLICY "Users can delete own feed images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Public can view feed images" ON storage.objects IS 
  'Allows public read access to feed-images bucket. Anyone (authenticated or anonymous) can view images and videos stored in this bucket.';







