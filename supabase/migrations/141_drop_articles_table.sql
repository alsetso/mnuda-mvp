-- Drop articles table after migration to posts
-- This migration should be run after 140_consolidate_articles_into_posts.sql

-- ============================================================================
-- STEP 1: Drop articles table and related objects
-- ============================================================================

DROP TABLE IF EXISTS public.articles CASCADE;

-- ============================================================================
-- STEP 2: Drop article-specific functions if they exist
-- ============================================================================

DROP FUNCTION IF EXISTS public.calculate_reading_time(TEXT);


