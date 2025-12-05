-- Fix feed-images bucket access issues
-- This ensures the bucket is public and policies are correctly set

-- ============================================================================
-- STEP 1: Ensure bucket is public
-- ============================================================================

-- Note: This requires service role. If it fails, set bucket to public in Dashboard:
-- Storage > feed-images > Settings > Public bucket: ON

UPDATE storage.buckets
SET public = true
WHERE id = 'feed-images';

-- ============================================================================
-- STEP 2: Verify and create SELECT policy (Public Read)
-- ============================================================================

-- Drop if exists to recreate
DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- ============================================================================
-- STEP 3: Verify bucket settings
-- ============================================================================

-- Check if bucket exists and is public
-- Run this query to verify:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'feed-images';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- If files still don't load after policies are created:
--
-- 1. Verify bucket is public:
--    - Go to Dashboard > Storage > feed-images > Settings
--    - Ensure "Public bucket" is ON
--
-- 2. Verify policies exist:
--    - Go to Dashboard > Storage > feed-images > Policies
--    - Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)
--
-- 3. Check file URLs:
--    - Public URLs should be: https://[project].supabase.co/storage/v1/object/public/feed-images/[path]
--    - If using signed URLs, they expire after the time limit
--
-- 4. CORS:
--    - Supabase public buckets handle CORS automatically
--    - If CORS errors persist, check browser console for specific error
--
-- 5. File path format:
--    - Should match: {user_id}/{post_id}/{filename}
--    - Or: {user_id}/feed/{post_id}/{filename} (if using old structure)







