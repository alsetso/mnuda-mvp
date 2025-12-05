-- Add slug column to feed table for SEO-friendly URLs
-- All published posts (public and members_only) get slugs for /feed/:slug pages

-- ============================================================================
-- STEP 1: Add slug column
-- ============================================================================

ALTER TABLE public.feed
  ADD COLUMN slug TEXT;

-- ============================================================================
-- STEP 2: Create function to generate slug from title
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_feed_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(trim(title_text));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := substring(base_slug from 1 for 100); -- Limit length
  
  -- If empty after cleaning, use default
  IF base_slug = '' THEN
    base_slug := 'post';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness, append number if needed
  WHILE EXISTS (SELECT 1 FROM public.feed WHERE feed.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create trigger to auto-generate slug on insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_feed_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug for published posts (public or members_only, not draft)
  IF NEW.visibility IN ('public', 'members_only') AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := public.generate_feed_slug(NEW.title);
  END IF;
  
  -- If visibility changes to draft, clear slug (drafts don't need SEO)
  IF NEW.visibility = 'draft' THEN
    NEW.slug := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_feed_slug_on_insert
  BEFORE INSERT ON public.feed
  FOR EACH ROW
  EXECUTE FUNCTION public.set_feed_slug();

CREATE TRIGGER set_feed_slug_on_update
  BEFORE UPDATE ON public.feed
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.visibility IS DISTINCT FROM NEW.visibility)
  EXECUTE FUNCTION public.set_feed_slug();

-- ============================================================================
-- STEP 4: Generate slugs for existing published posts
-- ============================================================================

UPDATE public.feed
SET slug = public.generate_feed_slug(title)
WHERE visibility IN ('public', 'members_only')
  AND (slug IS NULL OR slug = '');

-- ============================================================================
-- STEP 5: Add unique constraint on slug
-- ============================================================================

-- Create unique index (allows NULLs, but enforces uniqueness for non-NULL values)
CREATE UNIQUE INDEX feed_slug_unique_idx
  ON public.feed (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 6: Create index for slug lookups
-- ============================================================================

CREATE INDEX feed_slug_idx
  ON public.feed (slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON COLUMN public.feed.slug IS 'SEO-friendly URL slug for /feed/:slug pages. Only generated for public and members_only posts (not drafts).';
COMMENT ON FUNCTION public.generate_feed_slug IS 'Generates a URL-friendly slug from a title, ensuring uniqueness';

