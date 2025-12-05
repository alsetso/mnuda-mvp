-- Consolidate articles into posts table
-- Add article-specific columns and migrate existing articles

-- ============================================================================
-- STEP 1: Extend visibility enum to include archived
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE public.post_visibility ADD VALUE IF NOT EXISTS 'archived';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add article columns to posts table
-- ============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_article BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS html_content TEXT,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Make profile_id nullable for articles
ALTER TABLE public.posts
  ALTER COLUMN profile_id DROP NOT NULL;

-- Add constraints
ALTER TABLE public.posts
  ADD CONSTRAINT posts_meta_title_length CHECK (meta_title IS NULL OR char_length(meta_title) <= 70),
  ADD CONSTRAINT posts_meta_description_length CHECK (meta_description IS NULL OR char_length(meta_description) <= 160),
  ADD CONSTRAINT posts_reading_time_non_negative CHECK (reading_time_minutes IS NULL OR reading_time_minutes >= 0),
  ADD CONSTRAINT posts_article_author_check CHECK (
    (is_article = false) OR (account_id IS NOT NULL AND business_id IS NULL) OR (account_id IS NULL AND business_id IS NOT NULL) OR (account_id IS NULL AND business_id IS NULL AND profile_id IS NOT NULL)
  ),
  ADD CONSTRAINT posts_regular_post_check CHECK (
    (is_article = false AND profile_id IS NOT NULL) OR (is_article = true)
  );

-- Update content length constraint for articles
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_content_length;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_length CHECK (
    (is_article = false AND char_length(content) >= 1 AND char_length(content) <= 10000) OR
    (is_article = true)
  );

-- ============================================================================
-- STEP 3: Create indexes for article columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS posts_is_article_idx ON public.posts(is_article) WHERE is_article = true;
CREATE INDEX IF NOT EXISTS posts_account_id_idx ON public.posts(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_business_id_idx ON public.posts(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON public.posts(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_article_visibility_published_at_idx ON public.posts(visibility, published_at DESC) WHERE is_article = true AND visibility = 'public' AND published_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS posts_article_slug_idx ON public.posts(slug) WHERE is_article = true AND slug IS NOT NULL;

-- Full-text search index for articles
CREATE INDEX IF NOT EXISTS posts_article_search_idx ON public.posts USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(html_content, content, ''))
) WHERE is_article = true;

-- ============================================================================
-- STEP 4: Create function to calculate reading time
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF content_text IS NULL OR trim(content_text) = '' THEN
    RETURN 1;
  END IF;
  RETURN GREATEST(1, ROUND(
    array_length(string_to_array(trim(content_text), ' '), 1) / 200.0
  )::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 5: Create trigger to auto-update article metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_article_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_article = true THEN
    IF NEW.html_content IS DISTINCT FROM OLD.html_content OR (OLD.html_content IS NULL AND NEW.html_content IS NOT NULL) THEN
      NEW.reading_time_minutes := public.calculate_reading_time(NEW.html_content);
    ELSIF NEW.content IS DISTINCT FROM OLD.content OR (OLD.content IS NULL AND NEW.content IS NOT NULL) THEN
      NEW.reading_time_minutes := public.calculate_reading_time(NEW.content);
    END IF;
    
    IF NEW.visibility = 'public' AND (OLD.visibility IS NULL OR OLD.visibility != 'public') AND NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;
    
    IF NEW.visibility != 'public' AND OLD.visibility = 'public' THEN
      NEW.published_at := NULL;
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_article_metadata ON public.posts;
CREATE TRIGGER update_article_metadata
  BEFORE INSERT OR UPDATE OF html_content, content, visibility ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_metadata();

-- ============================================================================
-- STEP 6: Migrate existing articles to posts
-- ============================================================================

INSERT INTO public.posts (
  id,
  is_article,
  title,
  content,
  html_content,
  excerpt,
  account_id,
  business_id,
  visibility,
  published_at,
  reading_time_minutes,
  meta_title,
  meta_description,
  canonical_url,
  og_image,
  featured_image,
  slug,
  view_count,
  created_at,
  updated_at
)
SELECT 
  id,
  true,
  title,
  content,
  content,
  excerpt,
  account_id,
  business_id,
  CASE 
    WHEN status = 'published' THEN 'public'::public.post_visibility
    WHEN status = 'draft' THEN 'draft'::public.post_visibility
    WHEN status = 'archived' THEN 'archived'::public.post_visibility
    ELSE 'members_only'::public.post_visibility
  END,
  published_at,
  reading_time_minutes,
  meta_title,
  meta_description,
  canonical_url,
  og_image,
  featured_image,
  slug,
  view_count,
  created_at,
  updated_at
FROM public.articles
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 7: Update RLS policies for articles
-- ============================================================================

-- Anonymous: Can view published articles
DROP POLICY IF EXISTS "posts_select_article_anon" ON public.posts;
CREATE POLICY "posts_select_article_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (
    (is_article = false AND visibility = 'public') OR
    (is_article = true AND visibility = 'public' AND published_at IS NOT NULL)
  );

-- Authenticated: Can view published articles and own drafts
DROP POLICY IF EXISTS "posts_select_article_authenticated" ON public.posts;
CREATE POLICY "posts_select_article_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    (is_article = false AND visibility IN ('public', 'members_only')) OR
    (is_article = true AND (
      (visibility = 'public' AND published_at IS NOT NULL) OR
      (visibility IN ('draft', 'archived') AND (
        account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()) OR
        business_id IN (
          SELECT id FROM public.businesses 
          WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
        )
      ))
    ))
  );

-- Authenticated: Can insert articles
DROP POLICY IF EXISTS "posts_insert_article" ON public.posts;
CREATE POLICY "posts_insert_article"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_article = false AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )) OR
    (is_article = true AND (
      (account_id IS NOT NULL AND account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())) OR
      (business_id IS NOT NULL AND business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
      ))
    ))
  );

-- Authenticated: Can update own articles
DROP POLICY IF EXISTS "posts_update_article" ON public.posts;
CREATE POLICY "posts_update_article"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    (is_article = false AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )) OR
    (is_article = true AND (
      (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())) OR
      (business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
      ))
    ))
  );

-- Authenticated: Can delete own articles
DROP POLICY IF EXISTS "posts_delete_article" ON public.posts;
CREATE POLICY "posts_delete_article"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    (is_article = false AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.profile_id
      AND profiles.account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )) OR
    (is_article = true AND (
      (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())) OR
      (business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
      ))
    ))
  );

-- Drop old policies if they exist
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON COLUMN public.posts.is_article IS 'True if this post is an article (long-form, SEO-driven content)';
COMMENT ON COLUMN public.posts.html_content IS 'Rich HTML content for articles (uses content if not set)';
COMMENT ON COLUMN public.posts.account_id IS 'Account that authored this article (for articles only)';
COMMENT ON COLUMN public.posts.business_id IS 'Business that authored this article (for articles only)';
COMMENT ON COLUMN public.posts.published_at IS 'When article was published (auto-set when visibility changes to public)';
COMMENT ON COLUMN public.posts.reading_time_minutes IS 'Calculated reading time in minutes (auto-updated based on content length)';
COMMENT ON COLUMN public.posts.meta_title IS 'Custom SEO title (defaults to title if not set)';
COMMENT ON COLUMN public.posts.meta_description IS 'SEO meta description';
COMMENT ON COLUMN public.posts.canonical_url IS 'Canonical URL for SEO';
COMMENT ON COLUMN public.posts.og_image IS 'Open Graph image URL for social media sharing';
COMMENT ON COLUMN public.posts.featured_image IS 'Featured image URL for articles';

