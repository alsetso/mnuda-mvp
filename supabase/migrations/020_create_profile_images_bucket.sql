-- Create storage bucket for profile images
-- This bucket stores profile images separately from account logos
-- 
-- NOTE: Storage policies must be created through the Supabase Dashboard
-- or using the service role key. Run this migration first, then create
-- the policies manually or use the Supabase CLI with service role.

-- ============================================================================
-- STEP 1: Create profile-images bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Storage Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Allow authenticated users to upload their own profile images
-- Path structure: {user_id}/{table}/{column}/{filename}
-- Policy checks that first folder matches auth.uid()
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

