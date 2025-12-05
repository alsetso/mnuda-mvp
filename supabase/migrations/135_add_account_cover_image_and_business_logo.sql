-- Add cover_image_url to accounts table and logo_url to businesses table
-- Ensure storage buckets are set up for logos and cover-photos

-- ============================================================================
-- STEP 1: Add cover_image_url to accounts table
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE INDEX IF NOT EXISTS accounts_cover_image_url_idx
  ON public.accounts (cover_image_url)
  WHERE cover_image_url IS NOT NULL;

COMMENT ON COLUMN public.accounts.cover_image_url IS
  'URL to account cover/banner image';

-- ============================================================================
-- STEP 2: Add logo_url to businesses table
-- ============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS businesses_logo_url_idx
  ON public.businesses (logo_url)
  WHERE logo_url IS NOT NULL;

COMMENT ON COLUMN public.businesses.logo_url IS
  'URL to business logo image';

-- ============================================================================
-- STEP 3: Ensure cover-photos storage bucket exists
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-photos',
  'cover-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STEP 4: Ensure logos storage bucket exists
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STEP 5: Create storage policies for cover-photos bucket
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view cover photos" ON storage.objects;

-- Allow authenticated users to upload their own cover photos
-- Path structure: {user_id}/{table}/{column}/{filename}
-- Policy checks that first folder matches auth.uid()
CREATE POLICY "Users can upload own cover photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own cover photos
CREATE POLICY "Users can update own cover photos"
  ON storage.objects
  FOR UPDATE
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
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to cover photos
CREATE POLICY "Public can view cover photos"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'cover-photos');

-- ============================================================================
-- STEP 6: Create storage policies for logos bucket
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- Allow authenticated users to upload their own logos
-- Path structure: {user_id}/{table}/{column}/{filename}
-- Policy checks that first folder matches auth.uid()
CREATE POLICY "Users can upload own logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update own logos"
  ON storage.objects
  FOR UPDATE
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
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to logos
CREATE POLICY "Public can view logos"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'logos');



