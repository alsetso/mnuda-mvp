-- Improve posts RLS policies with LinkedIn-style social networking security
-- Uses SECURITY DEFINER helper function to bypass RLS on accounts table
-- Fixes permission denied errors when creating posts

-- ============================================================================
-- STEP 1: Note on 'archived' enum value
-- The 'archived' value should already exist from migration 140.
-- If it doesn't exist, policies will still work (archived posts just won't be accessible).
-- ============================================================================

-- ============================================================================
-- STEP 2: Ensure user_owns_account helper function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER runs with postgres privileges, bypassing RLS
  -- This allows us to check account ownership even if accounts table has RLS
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = account_id
    AND accounts.user_id = auth.uid()
  );
END;
$$;

-- Ensure function is owned by postgres (required for SECURITY DEFINER)
ALTER FUNCTION public.user_owns_account(UUID) OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_account(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 3: Drop existing posts RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- ============================================================================
-- STEP 4: Create improved SELECT policies (LinkedIn-style visibility)
-- ============================================================================

-- Anonymous: Can view public posts and published articles only
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (
    -- General posts: only public
    (post_type != 'article' AND visibility = 'public') OR
    -- Articles: only published public articles
    (post_type = 'article' AND visibility = 'public' AND published_at IS NOT NULL)
  );

-- Authenticated: Can view public/members_only posts and published articles + own drafts
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    -- General posts: public and members_only (social feed)
    (post_type != 'article' AND visibility IN ('public', 'members_only')) OR
    -- Articles: published public OR own drafts
    (post_type = 'article' AND (
      -- Published public articles
      (visibility = 'public' AND published_at IS NOT NULL) OR
      -- Own drafts (archived handled separately if enum value exists)
      (visibility = 'draft' AND public.user_owns_account(account_id)) OR
      -- Own archived articles (only if enum value exists)
      (visibility::text = 'archived' AND public.user_owns_account(account_id))
    ))
  );

-- ============================================================================
-- STEP 5: Create improved INSERT policy (fixes permission denied)
-- ============================================================================

-- Authenticated: Can insert posts for own account
-- Uses SECURITY DEFINER function to bypass accounts table RLS
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the account (uses SECURITY DEFINER function)
    AND public.user_owns_account(account_id)
    -- Post type must be valid
    AND post_type IN ('general', 'article', 'ad', 'job', 'listing')
    -- Visibility must be valid (check as text to handle enum values that might not exist yet)
    AND (
      visibility IN ('public', 'members_only', 'draft') OR
      visibility::text = 'archived'
    )
    -- Articles must have slug if published
    AND (
      post_type != 'article' OR
      (post_type = 'article' AND (visibility != 'public' OR slug IS NOT NULL))
    )
  );

-- ============================================================================
-- STEP 6: Create improved UPDATE policy
-- ============================================================================

-- Authenticated: Can update own posts
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  )
  WITH CHECK (
    -- Must still own the account after update
    public.user_owns_account(account_id)
    -- Post type must remain valid
    AND post_type IN ('general', 'article', 'ad', 'job', 'listing')
    -- Visibility must remain valid (check as text for archived to handle if enum value doesn't exist)
    AND (
      visibility IN ('public', 'members_only', 'draft') OR
      visibility::text = 'archived'
    )
    -- Articles must have slug if published
    AND (
      post_type != 'article' OR
      (post_type = 'article' AND (visibility != 'public' OR slug IS NOT NULL))
    )
  );

-- ============================================================================
-- STEP 7: Create improved DELETE policy
-- ============================================================================

-- Authenticated: Can delete own posts
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON POLICY "posts_select_anon" ON public.posts IS 
  'Anonymous users can view public posts and published articles only';

COMMENT ON POLICY "posts_select_authenticated" ON public.posts IS 
  'Authenticated users can view public/members_only posts, published articles, and own drafts';

COMMENT ON POLICY "posts_insert" ON public.posts IS 
  'Authenticated users can create posts for their own account. Uses SECURITY DEFINER function to bypass accounts RLS.';

COMMENT ON POLICY "posts_update" ON public.posts IS 
  'Authenticated users can update their own posts';

COMMENT ON POLICY "posts_delete" ON public.posts IS 
  'Authenticated users can delete their own posts';

