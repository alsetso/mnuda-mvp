-- Create articles table for long-form, SEO-driven content
-- Articles can be created by accounts or businesses

-- ============================================================================
-- STEP 1: Create article status enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.article_status AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Create articles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Author (either account_id OR business_id, not both)
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL, -- Long-form content, no length limit
  excerpt TEXT, -- SEO meta description / excerpt
  
  -- SEO fields
  meta_title TEXT, -- Custom SEO title (defaults to title)
  meta_description TEXT, -- SEO meta description
  canonical_url TEXT, -- Canonical URL for SEO
  og_image TEXT, -- Open Graph image URL
  
  -- Media
  featured_image TEXT, -- Main featured image URL
  
  -- Metadata
  status public.article_status NOT NULL DEFAULT 'draft'::public.article_status,
  published_at TIMESTAMP WITH TIME ZONE, -- When article was published
  reading_time_minutes INTEGER, -- Calculated reading time
  
  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT articles_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT articles_slug_length CHECK (char_length(slug) >= 1 AND char_length(slug) <= 200),
  CONSTRAINT articles_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  CONSTRAINT articles_meta_title_length CHECK (meta_title IS NULL OR char_length(meta_title) <= 70),
  CONSTRAINT articles_meta_description_length CHECK (meta_description IS NULL OR char_length(meta_description) <= 160),
  CONSTRAINT articles_view_count_non_negative CHECK (view_count >= 0),
  CONSTRAINT articles_reading_time_non_negative CHECK (reading_time_minutes IS NULL OR reading_time_minutes >= 0),
  CONSTRAINT articles_author_check CHECK (
    (account_id IS NOT NULL AND business_id IS NULL) OR 
    (account_id IS NULL AND business_id IS NOT NULL)
  )
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS articles_account_id_idx ON public.articles(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_business_id_idx ON public.articles(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_slug_idx ON public.articles(slug);
CREATE INDEX IF NOT EXISTS articles_status_idx ON public.articles(status);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_status_published_at_idx ON public.articles(status, published_at DESC) WHERE status = 'published' AND published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON public.articles(created_at DESC);

-- Full-text search index for title and content
CREATE INDEX IF NOT EXISTS articles_search_idx ON public.articles USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
);

-- ============================================================================
-- STEP 4: Create function to calculate reading time
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  -- Count words (split by whitespace)
  RETURN GREATEST(1, ROUND(
    array_length(string_to_array(trim(content_text), ' '), 1) / 200.0
  )::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 5: Create trigger to auto-update reading_time and published_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_article_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reading time when content changes
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.reading_time_minutes := public.calculate_reading_time(NEW.content);
  END IF;
  
  -- Set published_at when status changes to published
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;
  
  -- Clear published_at if status changes from published
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_article_metadata ON public.articles;
CREATE TRIGGER update_article_metadata
  BEFORE INSERT OR UPDATE OF content, status ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_metadata();

-- ============================================================================
-- STEP 6: Create trigger to update updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Create RLS policies
-- ============================================================================

-- Anonymous: Can view published articles
DROP POLICY IF EXISTS "articles_select_anon" ON public.articles;
CREATE POLICY "articles_select_anon"
  ON public.articles FOR SELECT
  TO anon
  USING (status = 'published' AND published_at IS NOT NULL);

-- Authenticated: Can view published articles and own drafts
DROP POLICY IF EXISTS "articles_select_authenticated" ON public.articles;
CREATE POLICY "articles_select_authenticated"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    status = 'published' AND published_at IS NOT NULL
    OR (
      account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
      )
    )
    OR (
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Authenticated: Can insert articles for their account or business
DROP POLICY IF EXISTS "articles_insert" ON public.articles;
CREATE POLICY "articles_insert"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      account_id IS NOT NULL AND
      account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
      )
    )
    OR (
      business_id IS NOT NULL AND
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Authenticated: Can update own articles
DROP POLICY IF EXISTS "articles_update" ON public.articles;
CREATE POLICY "articles_update"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
    OR (
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Authenticated: Can delete own articles
DROP POLICY IF EXISTS "articles_delete" ON public.articles;
CREATE POLICY "articles_delete"
  ON public.articles FOR DELETE
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
    OR (
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;

-- ============================================================================
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE public.articles IS 
  'Long-form, SEO-driven articles. Can be authored by accounts or businesses.';

COMMENT ON COLUMN public.articles.account_id IS 
  'References accounts.id - the account that authored this article (if not a business article)';

COMMENT ON COLUMN public.articles.business_id IS 
  'References businesses.id - the business that authored this article (if not an account article)';

COMMENT ON COLUMN public.articles.slug IS 
  'Unique, SEO-friendly URL slug for the article';

COMMENT ON COLUMN public.articles.content IS 
  'Long-form article content (no length limit)';

COMMENT ON COLUMN public.articles.meta_title IS 
  'Custom SEO title (defaults to title if not set)';

COMMENT ON COLUMN public.articles.meta_description IS 
  'SEO meta description (used for search results and social sharing)';

COMMENT ON COLUMN public.articles.canonical_url IS 
  'Canonical URL for SEO (prevents duplicate content issues)';

COMMENT ON COLUMN public.articles.og_image IS 
  'Open Graph image URL for social media sharing';

COMMENT ON COLUMN public.articles.reading_time_minutes IS 
  'Calculated reading time in minutes (auto-updated based on content length)';

COMMENT ON COLUMN public.articles.published_at IS 
  'Timestamp when article was published (auto-set when status changes to published)';



