-- Make post title optional (nullable)
-- Posts can be created without a title - title will be auto-generated from content if not provided

-- ============================================================================
-- STEP 1: Make title column nullable
-- ============================================================================

ALTER TABLE public.posts 
  ALTER COLUMN title DROP NOT NULL;

-- ============================================================================
-- STEP 2: Update constraint to allow empty title (but if provided, must be 1-200 chars)
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_title_length;

-- Add new constraint that allows NULL or 1-200 chars
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_title_length CHECK (
    title IS NULL OR (char_length(title) >= 1 AND char_length(title) <= 200)
  );

-- ============================================================================
-- STEP 3: Add comment
-- ============================================================================

COMMENT ON COLUMN public.posts.title IS 
  'Post title (optional). If not provided, will be auto-generated from first line of content.';


