-- Create storage bucket for business logos
-- Stores logo images for user businesses

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'members_business_logo',
  'members_business_logo',
  true, -- Public bucket for logos
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for members_business_logo bucket
-- Users can upload their own business logos
CREATE POLICY "Users can upload own business logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'members_business_logo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own business logos
CREATE POLICY "Users can view own business logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'members_business_logo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public can view business logos (for public display)
CREATE POLICY "Public can view business logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'members_business_logo');

-- Users can delete their own business logos
CREATE POLICY "Users can delete own business logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'members_business_logo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own business logos
CREATE POLICY "Users can update own business logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'members_business_logo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'members_business_logo'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


