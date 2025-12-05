-- Allow anonymous users to view basic account info for accounts with public posts
-- This enables displaying post author names and images in the feed
-- Only exposes safe, public-facing fields: id, first_name, last_name, image_url

-- ============================================================================
-- STEP 1: Grant column-level SELECT permission to anon role (SECURE)
-- Only grant access to safe, public-facing columns
-- ============================================================================

-- Revoke any existing full table access
REVOKE SELECT ON public.accounts FROM anon;

-- Grant access only to specific safe columns
GRANT SELECT (id, first_name, last_name, image_url) ON public.accounts TO anon;

-- ============================================================================
-- STEP 2: Allow anonymous users to view basic account info for accounts with public posts
-- ============================================================================

CREATE POLICY "Anonymous users can view accounts with public posts"
  ON public.accounts FOR SELECT
  TO anon
  USING (
    -- Only allow viewing accounts that have at least one public post
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.account_id = accounts.id
      AND posts.visibility = 'public'
    )
  );

-- ============================================================================
-- STEP 2: Add comment explaining the policy
-- ============================================================================

COMMENT ON POLICY "Anonymous users can view accounts with public posts" ON public.accounts IS 
  'Allows anonymous users to view ONLY safe columns (id, first_name, last_name, image_url) for accounts that have public posts. Column-level GRANT ensures sensitive fields (email, user_id, stripe_customer_id, etc.) are never exposed. This enables displaying post author information in the feed securely.';

