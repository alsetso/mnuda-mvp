-- Fix page_views policies - drop and recreate to handle existing policies
-- This migration is idempotent and safe to run multiple times

-- ============================================================================
-- Drop existing policies if they exist
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can record page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view own page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view visitors to own content" ON public.page_views;

-- ============================================================================
-- Recreate policies
-- ============================================================================

-- Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can record page views"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own page views (where they are the visitor)
CREATE POLICY "Users can view own page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (
    account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
  );

-- Users can view visitors to their own content
CREATE POLICY "Users can view visitors to own content"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (
    -- For account profiles, check if viewing own profile's visitors
    (entity_type = 'account' AND entity_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)) OR
    -- For posts/articles, check ownership via account_id
    (entity_type IN ('post', 'article') AND EXISTS (
      SELECT 1 FROM public.posts WHERE id = page_views.entity_id AND profile_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
      UNION
      SELECT 1 FROM public.articles WHERE id = page_views.entity_id AND account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
    ))
  );



