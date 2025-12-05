-- Drop the polymorphic page_views table in favor of direct view_count columns
-- This provides better performance, data integrity, and simpler queries

-- ============================================================================
-- STEP 1: Drop trigger that syncs account view_count
-- ============================================================================

DROP TRIGGER IF EXISTS sync_account_view_count_trigger ON public.page_views;
DROP FUNCTION IF EXISTS public.sync_account_view_count();

-- ============================================================================
-- STEP 2: Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.increment_page_view(public.page_entity_type, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_page_view(public.page_entity_type, UUID, TEXT);

-- ============================================================================
-- STEP 3: Drop table and enum
-- ============================================================================

DROP TABLE IF EXISTS public.page_views;
DROP TYPE IF EXISTS public.page_entity_type;



