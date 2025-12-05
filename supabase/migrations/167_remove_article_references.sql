-- Remove all article references from the database
-- This migration removes article references from page_views policies, drops the article_status enum, and ensures articles table is dropped

-- ============================================================================
-- STEP 1: Drop articles table if it still exists (should already be dropped by migration 141, but ensure it's gone)
-- ============================================================================

DROP TABLE IF EXISTS public.articles CASCADE;

-- ============================================================================
-- STEP 2: Update page_views policies to remove article references
-- ============================================================================

-- Drop and recreate the policy that references articles
DROP POLICY IF EXISTS "page_views_select_own" ON public.page_views;

CREATE POLICY "page_views_select_own" ON public.page_views
  FOR SELECT
  USING (
    -- For account profiles, check if viewing own profile's visitors
    (entity_type = 'account' AND entity_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)) OR
    -- For posts, check ownership via account_id
    (entity_type = 'post' AND EXISTS (
      SELECT 1 FROM public.posts WHERE id = page_views.entity_id AND account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
    )) OR
    -- For pages, check ownership via account_id
    (entity_type = 'page' AND EXISTS (
      SELECT 1 FROM public.pages WHERE id = page_views.entity_id AND account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
    ))
  );

-- ============================================================================
-- STEP 3: Drop article-specific functions if they exist
-- ============================================================================

DROP FUNCTION IF EXISTS public.calculate_reading_time(TEXT);

-- ============================================================================
-- STEP 4: Drop article_status enum if it exists
-- ============================================================================

DROP TYPE IF EXISTS public.article_status CASCADE;

-- ============================================================================
-- STEP 5: Drop posts_backup, pages, and categories tables
-- ============================================================================

DROP TABLE IF EXISTS public.posts_backup CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================================
-- STEP 6: Drop onboarding_questions table
-- ============================================================================

DROP TABLE IF EXISTS public.onboarding_questions CASCADE;

-- ============================================================================
-- STEP 7: Remove foreign key constraint from accounts.city_id
-- Keep the column and index, but make cities table standalone
-- ============================================================================

-- Drop the foreign key constraint (PostgreSQL auto-names it accounts_city_id_fkey)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the foreign key constraint name
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.accounts'::regclass
    AND conname LIKE '%city_id%'
    AND contype = 'f';
  
  -- Drop the constraint if it exists
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;
