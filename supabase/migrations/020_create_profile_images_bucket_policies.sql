-- Storage policies for profile-images bucket
-- 
-- IMPORTANT: This file must be run with SERVICE ROLE permissions
-- Run using: supabase db execute --file 020_create_profile_images_bucket_policies.sql --service-role
-- Or create these policies manually in the Supabase Dashboard under Storage > profile-images > Policies

-- ============================================================================
-- Create RLS policies for profile-images bucket
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to profile images
CREATE POLICY "Public can view profile images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'profile-images');

