-- Drop old view tracking functions that only incremented counters
-- These are replaced by record_page_view which tracks individual visits

-- ============================================================================
-- STEP 1: Drop old increment functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.increment_view_count(TEXT, UUID);
DROP FUNCTION IF EXISTS public.increment_view_count_by_slug(TEXT, TEXT);

-- ============================================================================
-- STEP 2: Add comments explaining the change
-- ============================================================================

COMMENT ON TABLE public.page_views IS
  'Replaced simple view_count increment functions with detailed visitor tracking. Use record_page_view() to track visits with account_id.';



