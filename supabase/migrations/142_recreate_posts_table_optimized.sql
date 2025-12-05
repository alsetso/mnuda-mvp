-- Drop and recreate posts table with minimal, dynamic schema
-- Supports multiple post types: general, article, ad, job, listing

-- ============================================================================
-- STEP 1: Create enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM (
    'general',
    'article',
    'ad',
    'job',
    'listing'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_visibility AS ENUM (
    'public',
    'members_only',
    'draft',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_media_type AS ENUM (
    'text',
    'image',
    'video',
    'mixed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Backup existing data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts_backup AS 
SELECT 
  id, 
  profile_id,
  account_id,
  business_id,
  title, content, html_content, excerpt,
  images, featured_image, media_type,
  city_id, county_id,
  is_article, visibility, slug, published_at, reading_time_minutes, view_count,
  meta_title, meta_description, canonical_url, og_image,
  created_at, updated_at
FROM public.posts;

-- ============================================================================
-- STEP 3: Drop dependent objects
-- ============================================================================

DROP TRIGGER IF EXISTS update_article_metadata ON public.posts;
DROP TRIGGER IF EXISTS update_post_media_type ON public.posts;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;

DROP POLICY IF EXISTS "posts_select_article_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_article_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_article" ON public.posts;
DROP POLICY IF EXISTS "posts_update_article" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_article" ON public.posts;
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- ============================================================================
-- STEP 4: Drop and recreate posts table
-- ============================================================================

DROP TABLE IF EXISTS public.posts CASCADE;

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Type and content
  post_type public.post_type NOT NULL DEFAULT 'general'::public.post_type,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  excerpt TEXT,
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  media_type public.post_media_type NOT NULL DEFAULT 'text'::public.post_media_type,
  
  -- Location
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  county_id UUID REFERENCES public.counties(id) ON DELETE SET NULL,
  
  -- Metadata
  visibility public.post_visibility NOT NULL DEFAULT 'members_only'::public.post_visibility,
  slug TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- SEO (articles only, nullable)
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT posts_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  CONSTRAINT posts_meta_title_length CHECK (meta_title IS NULL OR char_length(meta_title) <= 70),
  CONSTRAINT posts_meta_description_length CHECK (meta_description IS NULL OR char_length(meta_description) <= 160),
  CONSTRAINT posts_view_count_non_negative CHECK (view_count >= 0),
  CONSTRAINT posts_reading_time_non_negative CHECK (reading_time_minutes IS NULL OR reading_time_minutes >= 0),
  CONSTRAINT posts_content_length CHECK (
    (post_type != 'article' AND char_length(content) >= 1 AND char_length(content) <= 10000) OR
    (post_type = 'article')
  ),
  CONSTRAINT posts_slug_required_articles CHECK (
    post_type != 'article' OR slug IS NOT NULL
  )
);

-- ============================================================================
-- STEP 5: Create indexes
-- ============================================================================

CREATE INDEX posts_post_type_idx ON public.posts(post_type);
CREATE INDEX posts_visibility_idx ON public.posts(visibility);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX posts_visibility_created_at_idx ON public.posts(visibility, created_at DESC);
CREATE INDEX posts_city_id_idx ON public.posts(city_id) WHERE city_id IS NOT NULL;
CREATE INDEX posts_county_id_idx ON public.posts(county_id) WHERE county_id IS NOT NULL;

-- Article-specific indexes
CREATE INDEX posts_article_public_idx ON public.posts(visibility, published_at DESC) 
  WHERE post_type = 'article' AND visibility = 'public' AND published_at IS NOT NULL;
CREATE UNIQUE INDEX posts_article_slug_idx ON public.posts(slug) 
  WHERE post_type = 'article' AND slug IS NOT NULL;

-- Full-text search for articles
CREATE INDEX posts_article_search_idx ON public.posts USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(html_content, content, ''))
) WHERE post_type = 'article';

-- ============================================================================
-- STEP 6: Create functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.determine_post_media_type(images_jsonb JSONB)
RETURNS public.post_media_type AS $$
DECLARE
  has_image BOOLEAN := false;
  has_video BOOLEAN := false;
  elem JSONB;
BEGIN
  IF images_jsonb IS NULL OR jsonb_array_length(images_jsonb) = 0 THEN
    RETURN 'text';
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(images_jsonb)
  LOOP
    IF elem->>'type' = 'image' OR (elem->>'type' IS NULL AND elem->>'mime_type' LIKE 'image/%') THEN
      has_image := true;
    ELSIF elem->>'type' = 'video' OR (elem->>'type' IS NULL AND elem->>'mime_type' LIKE 'video/%') THEN
      has_video := true;
    END IF;
  END LOOP;

  IF has_image AND has_video THEN
    RETURN 'mixed';
  ELSIF has_video THEN
    RETURN 'video';
  ELSIF has_image THEN
    RETURN 'image';
  ELSE
    RETURN 'text';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

CREATE OR REPLACE FUNCTION public.update_post_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update media_type from images
  NEW.media_type := public.determine_post_media_type(NEW.images);
  
  -- Article-specific updates
  IF NEW.post_type = 'article' THEN
    -- Calculate reading time
    IF NEW.html_content IS DISTINCT FROM OLD.html_content OR (OLD.html_content IS NULL AND NEW.html_content IS NOT NULL) THEN
      NEW.reading_time_minutes := public.calculate_reading_time(NEW.html_content);
    ELSIF NEW.content IS DISTINCT FROM OLD.content OR (OLD.content IS NULL AND NEW.content IS NOT NULL) THEN
      NEW.reading_time_minutes := public.calculate_reading_time(NEW.content);
    END IF;
    
    -- Set published_at when visibility changes to public
    IF NEW.visibility = 'public' AND (OLD.visibility IS NULL OR OLD.visibility != 'public') AND NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;
    
    -- Clear published_at when visibility changes from public
    IF NEW.visibility != 'public' AND OLD.visibility = 'public' THEN
      NEW.published_at := NULL;
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create triggers
-- ============================================================================

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_metadata
  BEFORE INSERT OR UPDATE OF images, html_content, content, visibility ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_metadata();

-- ============================================================================
-- STEP 8: Restore data from backup
-- ============================================================================

DO $$
DECLARE
  account_id_col TEXT;
  business_id_col TEXT;
BEGIN
  -- Check if account_id column exists in backup
  SELECT column_name INTO account_id_col
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'posts_backup' 
  AND column_name = 'account_id';
  
  -- Check if business_id column exists in backup
  SELECT column_name INTO business_id_col
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'posts_backup' 
  AND column_name = 'business_id';

  -- Build and execute insert query based on available columns
  IF account_id_col IS NOT NULL AND business_id_col IS NOT NULL THEN
    EXECUTE '
      INSERT INTO public.posts (
        id, account_id, post_type, title, content, html_content, excerpt,
        images, featured_image, media_type, city_id, county_id, visibility,
        slug, published_at, reading_time_minutes, view_count, meta_title,
        meta_description, canonical_url, og_image, created_at, updated_at
      )
      SELECT 
        pb.id,
        COALESCE(
          pb.account_id,
          (SELECT account_id FROM public.businesses WHERE id = pb.business_id LIMIT 1)
        ) AS account_id,
        CASE 
          WHEN COALESCE(pb.is_article, false) THEN ''article''::public.post_type
          ELSE ''general''::public.post_type
        END,
        pb.title, pb.content, pb.html_content, pb.excerpt,
        pb.images, pb.featured_image, pb.media_type, pb.city_id, pb.county_id, pb.visibility,
        pb.slug, pb.published_at, pb.reading_time_minutes, pb.view_count, pb.meta_title,
        pb.meta_description, pb.canonical_url, pb.og_image, pb.created_at, pb.updated_at
      FROM public.posts_backup pb
      WHERE COALESCE(
        pb.account_id,
        (SELECT account_id FROM public.businesses WHERE id = pb.business_id LIMIT 1)
      ) IS NOT NULL
      ON CONFLICT (id) DO NOTHING
    ';
  ELSIF account_id_col IS NOT NULL THEN
    EXECUTE '
      INSERT INTO public.posts (
        id, account_id, post_type, title, content, html_content, excerpt,
        images, featured_image, media_type, city_id, county_id, visibility,
        slug, published_at, reading_time_minutes, view_count, meta_title,
        meta_description, canonical_url, og_image, created_at, updated_at
      )
      SELECT 
        pb.id,
        pb.account_id,
        CASE 
          WHEN COALESCE(pb.is_article, false) THEN ''article''::public.post_type
          ELSE ''general''::public.post_type
        END,
        pb.title, pb.content, pb.html_content, pb.excerpt,
        pb.images, pb.featured_image, pb.media_type, pb.city_id, pb.county_id, pb.visibility,
        pb.slug, pb.published_at, pb.reading_time_minutes, pb.view_count, pb.meta_title,
        pb.meta_description, pb.canonical_url, pb.og_image, pb.created_at, pb.updated_at
      FROM public.posts_backup pb
      WHERE pb.account_id IS NOT NULL
      ON CONFLICT (id) DO NOTHING
    ';
  ELSIF business_id_col IS NOT NULL THEN
    EXECUTE '
      INSERT INTO public.posts (
        id, account_id, post_type, title, content, html_content, excerpt,
        images, featured_image, media_type, city_id, county_id, visibility,
        slug, published_at, reading_time_minutes, view_count, meta_title,
        meta_description, canonical_url, og_image, created_at, updated_at
      )
      SELECT 
        pb.id,
        (SELECT account_id FROM public.businesses WHERE id = pb.business_id LIMIT 1) AS account_id,
        CASE 
          WHEN COALESCE(pb.is_article, false) THEN ''article''::public.post_type
          ELSE ''general''::public.post_type
        END,
        pb.title, pb.content, pb.html_content, pb.excerpt,
        pb.images, pb.featured_image, pb.media_type, pb.city_id, pb.county_id, pb.visibility,
        pb.slug, pb.published_at, pb.reading_time_minutes, pb.view_count, pb.meta_title,
        pb.meta_description, pb.canonical_url, pb.og_image, pb.created_at, pb.updated_at
      FROM public.posts_backup pb
      WHERE (SELECT account_id FROM public.businesses WHERE id = pb.business_id LIMIT 1) IS NOT NULL
      ON CONFLICT (id) DO NOTHING
    ';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anonymous: Can view public posts and published articles
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (
    (post_type != 'article' AND visibility = 'public') OR
    (post_type = 'article' AND visibility = 'public' AND published_at IS NOT NULL)
  );

-- Authenticated: Can view public/members_only posts and published articles + own drafts
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    (post_type != 'article' AND visibility IN ('public', 'members_only')) OR
    (post_type = 'article' AND (
      (visibility = 'public' AND published_at IS NOT NULL) OR
      (visibility IN ('draft', 'archived') AND account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
      ))
    ))
  );

-- Authenticated: Can insert posts (must own account)
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- Authenticated: Can update own posts
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- Authenticated: Can delete own posts
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STEP 10: Grant permissions
-- ============================================================================

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- ============================================================================
-- STEP 11: Add comments
-- ============================================================================

COMMENT ON TABLE public.posts IS 
  'Unified table for all post types: general, article, ad, job, listing';

COMMENT ON COLUMN public.posts.account_id IS 
  'Account that created this post';

COMMENT ON COLUMN public.posts.post_type IS 
  'Type of post: general (social feed), article (long-form SEO content), ad, job, listing';

COMMENT ON COLUMN public.posts.html_content IS 
  'Rich HTML content (primarily for articles)';

COMMENT ON COLUMN public.posts.images IS 
  'JSONB array of media objects: [{url, filename, type, mime_type, size, width, height, duration, thumbnail_url, order, uploaded_at}]';

COMMENT ON COLUMN public.posts.media_type IS 
  'Auto-calculated: text, image, video, or mixed';

COMMENT ON COLUMN public.posts.published_at IS 
  'When article was published (auto-set when visibility changes to public)';

COMMENT ON COLUMN public.posts.reading_time_minutes IS 
  'Calculated reading time in minutes (auto-updated for articles)';

COMMENT ON COLUMN public.posts.slug IS 
  'Unique SEO-friendly URL slug (required for articles, optional for other types)';

-- ============================================================================
-- STEP 12: Cleanup backup table
-- ============================================================================

DROP TABLE IF EXISTS public.posts_backup;
