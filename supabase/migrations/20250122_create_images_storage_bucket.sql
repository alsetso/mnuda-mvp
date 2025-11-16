-- Create storage buckets for different image types
-- Separate buckets allow for better organization, granular permissions, and easier management

-- 1. Logos bucket (for group logos, profile logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Public bucket - logos are publicly accessible
  2097152, -- 2MB limit for logos (smaller files)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Cover photos bucket (for group covers, profile covers, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-photos',
  'cover-photos',
  true, -- Public bucket - cover photos are publicly accessible
  5242880, -- 5MB limit for cover photos
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Marketplace images bucket (for marketplace listing images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true, -- Public bucket - marketplace images are publicly accessible
  5242880, -- 5MB limit for marketplace images
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for logos bucket
-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  auth.role() = 'authenticated'
);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS Policies for cover-photos bucket
-- Allow authenticated users to upload cover photos
CREATE POLICY "Authenticated users can upload cover photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cover-photos' AND
  auth.role() = 'authenticated'
);

-- Allow anyone to view cover photos (public bucket)
CREATE POLICY "Anyone can view cover photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cover-photos');

-- Allow authenticated users to update their own cover photos
CREATE POLICY "Users can update own cover photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cover-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'cover-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own cover photos
CREATE POLICY "Users can delete own cover photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cover-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS Policies for marketplace-images bucket
-- Allow authenticated users to upload marketplace images
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  auth.role() = 'authenticated'
);

-- Allow anyone to view marketplace images (public bucket)
CREATE POLICY "Anyone can view marketplace images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');

-- Allow authenticated users to update their own marketplace images
CREATE POLICY "Users can update own marketplace images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own marketplace images
CREATE POLICY "Users can delete own marketplace images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

