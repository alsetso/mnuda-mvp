-- Create storage bucket for project photos
-- This bucket stores photos associated with projects
-- Path structure: {user_id}/projects/{project_id}/{filename}

-- ============================================================================
-- STEP 1: Create project-photos bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true,
  10485760, -- 10MB limit (larger than profile images for project documentation)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Storage Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view project photos" ON storage.objects;

-- Allow authenticated users to upload project photos for their own projects
-- Path structure: {user_id}/projects/{project_id}/{filename}
-- Policy checks that first folder matches auth.uid() and project belongs to user
CREATE POLICY "Users can upload own project photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'projects' AND
    -- Verify the project belongs to the user
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id::text = (storage.foldername(name))[3]
      AND projects.my_home_id IN (
        SELECT my_homes.id FROM public.my_homes
        WHERE my_homes.profile_id IN (
          SELECT profiles.id FROM public.profiles
          WHERE profiles.account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Allow authenticated users to update their own project photos
CREATE POLICY "Users can update own project photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id::text = (storage.foldername(name))[3]
      AND projects.my_home_id IN (
        SELECT my_homes.id FROM public.my_homes
        WHERE my_homes.profile_id IN (
          SELECT profiles.id FROM public.profiles
          WHERE profiles.account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id::text = (storage.foldername(name))[3]
      AND projects.my_home_id IN (
        SELECT my_homes.id FROM public.my_homes
        WHERE my_homes.profile_id IN (
          SELECT profiles.id FROM public.profiles
          WHERE profiles.account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Allow authenticated users to delete their own project photos
CREATE POLICY "Users can delete own project photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (storage.foldername(name))[2] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id::text = (storage.foldername(name))[3]
      AND projects.my_home_id IN (
        SELECT my_homes.id FROM public.my_homes
        WHERE my_homes.profile_id IN (
          SELECT profiles.id FROM public.profiles
          WHERE profiles.account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Allow public read access to project photos
CREATE POLICY "Public can view project photos"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'project-photos');


