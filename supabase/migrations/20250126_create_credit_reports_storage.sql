-- Create storage bucket for credit reports
-- Stores PDF credit reports from Experian, Equifax, and TransUnion

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credit-reports',
  'credit-reports',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for credit-reports bucket
-- Users can upload their own files
CREATE POLICY "Users can upload own credit reports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'credit-reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own files
CREATE POLICY "Users can view own credit reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'credit-reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own credit reports"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'credit-reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

