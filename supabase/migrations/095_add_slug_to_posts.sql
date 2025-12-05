-- Add slug column to posts table for SEO-friendly URLs
-- Similar to the feed slug implementation but for posts

-- ============================================================================
-- STEP 1: Add slug column
-- ============================================================================

ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ============================================================================
-- STEP 2: Drop existing function if it exists (handle any signature conflicts)
-- ============================================================================

-- Drop all versions of the function by querying pg_proc
DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT oid::regprocedure 
    FROM pg_proc 
    WHERE proname = 'generate_post_slug' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.oid::regprocedure || ' CASCADE';
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- STEP 3: Create function to generate SEO-friendly slug from title
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_post_slug(title_text TEXT, post_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  max_length INTEGER := 60; -- SEO best practice: keep slugs under 60 chars
  short_id TEXT;
BEGIN
  -- Convert to lowercase and normalize
  base_slug := lower(trim(title_text));
  
  -- Remove special characters, keep only alphanumeric, spaces, and hyphens
  -- Replace multiple spaces/hyphens with single hyphen
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Limit length for SEO (keep it readable and under 60 chars)
  base_slug := substring(base_slug from 1 for max_length);

  -- If empty after cleaning, use default
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'post';
  END IF;

  -- For uniqueness, append short identifier from post_id if provided
  -- This creates readable slugs like "my-post-title-a3f2" instead of "my-post-title-2"
  IF post_id IS NOT NULL THEN
    -- Use last 4 characters of UUID (hex) for uniqueness
    short_id := substring(replace(post_id::TEXT, '-', '') from length(replace(post_id::TEXT, '-', '')) - 3);
    base_slug := base_slug || '-' || short_id;
  END IF;

  -- Ensure final uniqueness (in case short_id still conflicts)
  final_slug := base_slug;
  counter := 1;
  WHILE EXISTS (SELECT 1 FROM public.posts WHERE posts.slug = final_slug) LOOP
    IF post_id IS NOT NULL THEN
      -- If we already have a short_id, replace the last part with counter
      final_slug := regexp_replace(base_slug, '-[a-f0-9]{4}$', '') || '-' || counter;
    ELSE
      -- Otherwise just append counter
      final_slug := base_slug || '-' || counter;
    END IF;
    counter := counter + 1;
    
    -- Safety limit to prevent infinite loop
    IF counter > 1000 THEN
      -- Fallback: use timestamp-based slug
      final_slug := base_slug || '-' || extract(epoch from now())::bigint;
      EXIT;
    END IF;
  END LOOP;

  -- Final length check (ensure it's not too long)
  IF length(final_slug) > 100 THEN
    final_slug := substring(final_slug from 1 for 100);
  END IF;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Create trigger to auto-generate slug on insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug for published posts (public or members_only, not draft)
  IF NEW.visibility IN ('public', 'members_only') AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    -- Pass post ID for uniqueness (use NEW.id if available, otherwise generate without it)
    NEW.slug := public.generate_post_slug(NEW.title, NEW.id);
  END IF;

  -- If visibility changes to draft, clear slug (drafts don't need SEO)
  IF NEW.visibility = 'draft' THEN
    NEW.slug := NULL;
  END IF;

  -- If visibility changes from draft to published, generate slug
  IF OLD.visibility = 'draft' AND NEW.visibility IN ('public', 'members_only') AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := public.generate_post_slug(NEW.title, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_post_slug_on_insert ON public.posts;
CREATE TRIGGER set_post_slug_on_insert
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_post_slug();

DROP TRIGGER IF EXISTS set_post_slug_on_update ON public.posts;
CREATE TRIGGER set_post_slug_on_update
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_post_slug();

-- ============================================================================
-- STEP 5: Generate slugs for existing published posts
-- ============================================================================

UPDATE public.posts
SET slug = public.generate_post_slug(title, id)
WHERE visibility IN ('public', 'members_only')
  AND (slug IS NULL OR slug = '');

-- ============================================================================
-- STEP 6: Add unique constraint on slug
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique_idx
  ON public.posts (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 7: Create index for slug lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS posts_slug_idx
  ON public.posts (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON COLUMN public.posts.slug IS 
  'SEO-friendly URL slug for /post/:slug pages. Only generated for public and members_only posts (not drafts).';

COMMENT ON FUNCTION public.generate_post_slug IS 
  'Generates a URL-friendly slug from a title, ensuring uniqueness';

