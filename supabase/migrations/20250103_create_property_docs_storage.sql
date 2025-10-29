-- Create storage bucket for property documents
-- This bucket will store PDF files uploaded for properties

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-docs',
  'property-docs',
  false, -- Private bucket - access controlled by RLS
  52428800, -- 50MB limit for PDFs
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for property-docs bucket
-- Allow authenticated users to upload files if they're workspace members
CREATE POLICY "Members can upload property docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-docs' AND
  -- File must be in properties folder structure
  (storage.foldername(name))[1] = 'properties' AND
  -- User must be a member of the workspace (workspace_id extracted from path)
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND public.is_member(p.workspace_id)
  )
);

-- Allow workspace members to view/download docs
CREATE POLICY "Members can view property docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-docs' AND
  -- Extract property_id from path and check workspace membership
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND public.is_member(p.workspace_id)
  )
);

-- Allow workspace members to update docs
CREATE POLICY "Members can update property docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-docs' AND
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND public.is_member(p.workspace_id)
  )
)
WITH CHECK (
  bucket_id = 'property-docs' AND
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND public.is_member(p.workspace_id)
  )
);

-- Allow workspace members to delete docs
CREATE POLICY "Members can delete property docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-docs' AND
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND public.is_member(p.workspace_id)
  )
);
