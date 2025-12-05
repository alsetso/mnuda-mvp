-- Add storage policies for feed-images bucket
-- Run this via Supabase Dashboard SQL Editor or CLI with service role

-- Public read access
CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own feed images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update files in their own folder
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

-- Authenticated users can delete files in their own folder
CREATE POLICY "Users can delete own feed images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );







