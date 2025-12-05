-- Ensure view_count column exists on pages table with proper constraints and indexes
-- Also fix page_views table constraint to include 'page' entity type
-- This fixes the issue where record_page_view function fails to update pages.view_count
-- and where page views can't be recorded for individual pages

-- ============================================================================
-- STEP 1: Fix page_views table constraint to include 'page' entity type
-- ============================================================================

-- The page_views table uses TEXT for entity_type, so we need a CHECK constraint
-- to validate values. The constraint may exist as:
-- 1. An inline constraint on the column (no name, auto-generated name)
-- 2. A named constraint 'page_views_entity_type_check'
-- We need to drop both and recreate with 'page' included

-- Drop named constraint if it exists
ALTER TABLE public.page_views
  DROP CONSTRAINT IF EXISTS page_views_entity_type_check;

-- Drop any inline constraint on entity_type column
-- (PostgreSQL auto-generates names like "page_views_entity_type_check" for inline constraints)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find and drop any constraint on entity_type column
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.page_views'::regclass
    AND contype = 'c'  -- CHECK constraint
    AND pg_get_constraintdef(oid) LIKE '%entity_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

-- Recreate constraint with 'page' included (all valid entity types)
ALTER TABLE public.page_views
  ADD CONSTRAINT page_views_entity_type_check 
  CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business', 'page', 'feed', 'map'));

-- ============================================================================
-- STEP 2: Add view_count column if it doesn't exist
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pages' 
    AND column_name = 'view_count'
  ) THEN
    ALTER TABLE public.pages
      ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    
    COMMENT ON COLUMN public.pages.view_count IS 
      'Total number of page views for this page. Updated automatically by record_page_view function.';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Rename constraint if it still has old name
-- ============================================================================

DO $$
BEGIN
  -- Check if old constraint exists and rename it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'businesses_view_count_non_negative'
    AND conrelid = 'public.pages'::regclass
  ) THEN
    ALTER TABLE public.pages
      RENAME CONSTRAINT businesses_view_count_non_negative TO pages_view_count_non_negative;
  END IF;
  
  -- If constraint doesn't exist at all, add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pages_view_count_non_negative'
    AND conrelid = 'public.pages'::regclass
  ) THEN
    ALTER TABLE public.pages
      ADD CONSTRAINT pages_view_count_non_negative CHECK (view_count >= 0);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Ensure index exists with correct name
-- ============================================================================

-- Drop old index if it exists with wrong name
DROP INDEX IF EXISTS public.businesses_view_count_idx;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS pages_view_count_idx
  ON public.pages (view_count DESC)
  WHERE view_count > 0;

-- ============================================================================
-- STEP 5: Verify the setup
-- ============================================================================

-- This will raise an error if something is wrong, helping us catch issues early
DO $$
BEGIN
  -- Verify page_views constraint includes 'page'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'page_views_entity_type_check'
    AND conrelid = 'public.page_views'::regclass
    AND pg_get_constraintdef(oid) LIKE '%''page''%'
  ) THEN
    RAISE EXCEPTION 'page_views_entity_type_check constraint does not include ''page'' entity type';
  END IF;
  
  -- Verify pages.view_count column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pages' 
    AND column_name = 'view_count'
  ) THEN
    RAISE EXCEPTION 'view_count column does not exist on pages table';
  END IF;
  
  -- Verify pages constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pages_view_count_non_negative'
    AND conrelid = 'public.pages'::regclass
  ) THEN
    RAISE EXCEPTION 'pages_view_count_non_negative constraint does not exist';
  END IF;
  
  -- Verify pages index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'pages' 
    AND indexname = 'pages_view_count_idx'
  ) THEN
    RAISE EXCEPTION 'pages_view_count_idx index does not exist';
  END IF;
END $$;

