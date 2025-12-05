-- Add category_id column to pages table
-- Links pages to categories table

-- ============================================================================
-- STEP 1: Add category_id column
-- ============================================================================

ALTER TABLE public.pages
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Create index on category_id
-- ============================================================================

CREATE INDEX idx_pages_category_id ON public.pages(category_id) WHERE category_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Update comments
-- ============================================================================

COMMENT ON COLUMN public.pages.category_id IS 'References categories.id - the category for this page';

