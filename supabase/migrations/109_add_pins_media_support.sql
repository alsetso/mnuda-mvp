-- Add media support to pins table and create pins-media storage bucket
-- This allows pins to have multiple images and videos

-- ============================================================================
-- STEP 1: Add media column to pins table
-- ============================================================================

-- Add media column as JSONB array to support multiple images/videos
-- Structure: [{ type: 'image' | 'video', url: string, filename: string, ... }]
ALTER TABLE public.pins 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Add index for media queries
CREATE INDEX IF NOT EXISTS idx_pins_media ON public.pins USING GIN (media) WHERE media IS NOT NULL AND jsonb_array_length(media) > 0;

-- Add comment
COMMENT ON COLUMN public.pins.media IS 'Array of media objects (images/videos). Structure: [{ type: "image"|"video", url: string, filename: string, ... }]';

-- ============================================================================
-- STEP 2: Create pins-media storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pins-media',
  'pins-media',
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
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STEP 3: Create Storage Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own pin media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own pin media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own pin media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view pin media" ON storage.objects;

-- Allow authenticated users to upload pin media (images/videos) for their own pins
-- Path structure: {user_id}/pins/{pin_id}/{filename}
-- Policy checks that first folder matches auth.uid() and pin belongs to user
CREATE POLICY "Users can upload own pin media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pins-media' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'pins' AND
    -- Verify the pin belongs to the user
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id::text = (storage.foldername(name))[3]
      AND pins.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to update their own pin media (images/videos)
CREATE POLICY "Users can update own pin media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pins-media' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'pins' AND
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id::text = (storage.foldername(name))[3]
      AND pins.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'pins-media' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'pins' AND
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id::text = (storage.foldername(name))[3]
      AND pins.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow authenticated users to delete their own pin media (images/videos)
CREATE POLICY "Users can delete own pin media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pins-media' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'pins' AND
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id::text = (storage.foldername(name))[3]
      AND pins.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Allow public read access to pin media (images/videos)
-- Respects pin visibility - public pins have public media, private pins have private media
CREATE POLICY "Public can view pin media"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (
    bucket_id = 'pins-media' AND
    -- For authenticated users, check if they own the pin or if pin is public
    (
      -- User owns the pin
      (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.pins
        WHERE pins.id::text = (storage.foldername(name))[3]
        AND pins.profile_id IN (
          SELECT profiles.id FROM public.profiles
          WHERE profiles.account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
          )
        )
      ))
      OR
      -- Pin is public
      EXISTS (
        SELECT 1 FROM public.pins
        WHERE pins.id::text = (storage.foldername(name))[3]
        AND pins.visibility = 'public'
      )
    )
  );

-- Add comments
COMMENT ON POLICY "Users can upload own pin media" ON storage.objects IS 'Allows authenticated users to upload media files for their own pins. Path: {user_id}/pins/{pin_id}/{filename}';
COMMENT ON POLICY "Users can update own pin media" ON storage.objects IS 'Allows authenticated users to update media files for their own pins';
COMMENT ON POLICY "Users can delete own pin media" ON storage.objects IS 'Allows authenticated users to delete media files for their own pins';
COMMENT ON POLICY "Public can view pin media" ON storage.objects IS 'Allows public read access to media for public pins, or private access for pin owners';







