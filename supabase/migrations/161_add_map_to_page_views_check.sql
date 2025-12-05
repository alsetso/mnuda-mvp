-- Add 'map' to page_views entity_type check constraint
-- This allows tracking views of the map page

-- ============================================================================
-- STEP 1: Update page_views table CHECK constraint to include 'map'
-- ============================================================================

ALTER TABLE public.page_views
  DROP CONSTRAINT IF EXISTS page_views_entity_type_check;

ALTER TABLE public.page_views
  ADD CONSTRAINT page_views_entity_type_check 
  CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business', 'page', 'feed', 'map'));

