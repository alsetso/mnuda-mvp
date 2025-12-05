-- Storage RLS for Posts - Supabase Engineer's Recommended Approach
-- Based on Supabase best practices for public media buckets
--
-- IMPORTANT: Storage policies require SERVICE ROLE permissions
-- If you get "must be owner of relation objects" error:
-- 1. Run via Supabase Dashboard: Storage > feed-images > Policies > New Policy
-- 2. Or run via CLI with service role: supabase db execute --file 097_supabase_engineer_storage_rls.sql --service-role
-- 3. Or create policies manually in Dashboard (recommended for storage)

-- ============================================================================
-- CURRENT STATE ANALYSIS
-- ============================================================================
-- 
-- Current Path Structure: {user_id}/feed/{post_id}/{filename}
-- Current Issues:
-- 1. INSERT policy requires post to exist first (chicken-and-egg problem)
-- 2. Complex nested EXISTS checks in storage policies (slow, error-prone)
-- 3. Redundant ownership checks (posts RLS already handles this)
-- 4. Path structure has unnecessary 'feed' folder
--
-- ============================================================================
-- SUPABASE ENGINEER'S RECOMMENDATION
-- ============================================================================
--
-- Principle: Storage RLS should be SIMPLE and FAST
-- - Public buckets: Simple SELECT policy (bucket check only)
-- - Private operations: Check folder ownership (user_id match)
-- - Don't duplicate business logic (post ownership) in storage policies
-- - Posts table RLS already enforces ownership - trust it
--
-- Recommended Path: {user_id}/{post_id}/{filename}
-- - Simpler (one less folder level)
-- - Still organized by user and post
-- - Easier to manage and query
--
-- ============================================================================
-- STEP 1: Public SELECT Policy (Simplest Possible)
-- ============================================================================
-- Note: Bucket should already exist from previous migrations
-- If bucket doesn't exist, create it via Supabase Dashboard or CLI:
-- supabase storage create feed-images --public
-- For public buckets, SELECT should be trivial - just check bucket
-- No need for complex checks - if it's in the bucket, allow read

DROP POLICY IF EXISTS "Public can view feed images" ON storage.objects;

CREATE POLICY "Public can view feed images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'feed-images');

-- ============================================================================
-- STEP 3: INSERT Policy (Simplified - Match Posts RLS)
-- ============================================================================
-- Supabase Engineer's Approach:
-- - Posts RLS allows any authenticated user to create posts with any profile_id
-- - Storage should match: any authenticated user can upload media
-- - Path structure: {user_id}/{post_id}/{filename} or {profile_id}/{post_id}/{filename}
-- - Since posts RLS doesn't check profile ownership, storage doesn't either
-- - Simple check: authenticated user can upload to their own folder
--
-- This solves the chicken-and-egg: upload during post creation

DROP POLICY IF EXISTS "Users can upload own feed images" ON storage.objects;

CREATE POLICY "Users can upload own feed images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feed-images' AND
    -- Allow authenticated users to upload to their own folder
    -- Path: {user_id}/{post_id}/{filename}
    -- Matches posts RLS: any authenticated user can create posts
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STEP 4: UPDATE Policy (Simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own feed images" ON storage.objects;

CREATE POLICY "Users can update own feed images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STEP 5: DELETE Policy (Simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;

CREATE POLICY "Users can delete own feed images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feed-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- RATIONALE: Why This Approach
-- ============================================================================
--
-- 1. **Separation of Concerns**
--    - Storage RLS: Handles file access (who can read/write files)
--    - Posts RLS: Handles data access (who can read/write posts)
--    - Don't mix them - each should be simple
--
-- 2. **Performance**
--    - Simple folder checks are fast (no EXISTS subqueries)
--    - No joins to posts/profiles/accounts tables
--    - Storage policies execute on every file access - keep them fast
--
-- 3. **Flexibility**
--    - Users can upload media during post creation (no chicken-and-egg)
--    - Application logic handles post ownership validation
--    - Storage just enforces "users can only manage files in their folder"
--
-- 4. **Security**
--    - Users can only upload to their own folder ({user_id}/...)
--    - Public read is safe because bucket is public by design
--    - Posts RLS prevents unauthorized post creation
--    - Combined: Only users who can create posts can upload media
--
-- 5. **Maintainability**
--    - Simple policies are easy to understand and debug
--    - No complex nested queries that can break
--    - Clear separation: storage = file access, posts = data access
--
-- ============================================================================
-- PATH STRUCTURE RECOMMENDATION
-- ============================================================================
--
-- Recommended: {user_id}/{post_id}/{filename}
-- Example: 9146722b-15dc-4d5b-ac5a-8de99fd8abdc/abc123-def456/image.jpg
--
-- Benefits:
-- - Simpler than {user_id}/feed/{post_id}/{filename}
-- - Still organized and queryable
-- - Works with simplified RLS policies
--
-- Migration Note: Existing files in {user_id}/feed/{post_id}/ will still work
-- because SELECT policy allows all files in bucket. Only new uploads need
-- to use the new structure.

COMMENT ON POLICY "Public can view feed images" ON storage.objects IS 
  'Public read access for feed-images bucket. Simple bucket check - no complex logic needed for public media.';

COMMENT ON POLICY "Users can upload own feed images" ON storage.objects IS 
  'Authenticated users can upload to their own folder ({user_id}/{post_id}/filename). No post existence check - handled by application logic and posts RLS.';

