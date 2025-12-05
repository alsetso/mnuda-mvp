-- Create proper visitor tracking system with account-level tracking
-- Replaces simple view_count increment with detailed visitor records
-- Premium feature: Users can see who visited their profile (pro plan only)

-- ============================================================================
-- STEP 1: Create page_views table for detailed visitor tracking
-- ============================================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS public.page_views CASCADE;

CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity identification
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business')),
  entity_id UUID, -- For UUID-based entities
  entity_slug TEXT, -- For slug-based entities (articles, accounts via username)
  
  -- Visitor information
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- NULL for anonymous visitors
  ip_address INET, -- Optional: for anonymous visitor tracking
  
  -- Metadata
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT, -- Optional: browser info
  
  -- Constraints
  CONSTRAINT page_views_entity_check CHECK (
    (entity_id IS NOT NULL) OR (entity_slug IS NOT NULL)
  )
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS page_views_entity_type_id_idx
  ON public.page_views (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX page_views_entity_type_slug_idx
  ON public.page_views (entity_type, entity_slug)
  WHERE entity_slug IS NOT NULL;

CREATE INDEX page_views_account_id_idx
  ON public.page_views (account_id)
  WHERE account_id IS NOT NULL;

CREATE INDEX page_views_viewed_at_idx
  ON public.page_views (viewed_at DESC);

-- Index for querying visitors of a specific entity
CREATE INDEX page_views_entity_visitors_idx
  ON public.page_views (entity_type, entity_id, viewed_at DESC)
  WHERE entity_id IS NOT NULL AND account_id IS NOT NULL;

CREATE INDEX page_views_entity_visitors_slug_idx
  ON public.page_views (entity_type, entity_slug, viewed_at DESC)
  WHERE entity_slug IS NOT NULL AND account_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Create function to record page view and update view_count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_page_view(
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
  v_table_name TEXT;
  v_entity_id_for_update UUID;
BEGIN
  -- Validate entity_type
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'business') THEN
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;
  
  -- Map entity_type to table name
  v_table_name := CASE p_entity_type
    WHEN 'post' THEN 'posts'
    WHEN 'article' THEN 'articles'
    WHEN 'city' THEN 'cities'
    WHEN 'county' THEN 'counties'
    WHEN 'account' THEN 'accounts'
    WHEN 'business' THEN 'businesses'
    ELSE NULL
  END;
  
  -- Resolve entity_id based on entity_type and provided identifiers
  IF p_entity_id IS NOT NULL THEN
    -- Direct entity_id provided - use it
    v_entity_id_for_update := p_entity_id;
  ELSIF p_entity_slug IS NOT NULL THEN
    -- Need to resolve slug to entity_id based on entity_type
    IF p_entity_type = 'account' THEN
      -- Resolve username to account ID
      SELECT id INTO v_entity_id_for_update
      FROM public.accounts
      WHERE username = p_entity_slug
      LIMIT 1;
      
      IF v_entity_id_for_update IS NULL THEN
        RAISE EXCEPTION 'Account not found for username: %', p_entity_slug;
      END IF;
    ELSIF p_entity_type IN ('post', 'article') THEN
      -- Resolve slug to entity ID for posts/articles
      EXECUTE format(
        'SELECT id FROM public.%I WHERE slug = $1 LIMIT 1',
        v_table_name
      )
      USING p_entity_slug
      INTO v_entity_id_for_update;
      
      IF v_entity_id_for_update IS NULL THEN
        RAISE EXCEPTION '% not found for slug: %', p_entity_type, p_entity_slug;
      END IF;
    ELSE
      -- For other entity types, slug resolution not supported
      RAISE EXCEPTION 'Slug lookup not supported for entity_type: %', p_entity_type;
    END IF;
  ELSE
    RAISE EXCEPTION 'Either entity_id or entity_slug must be provided';
  END IF;
  
  -- Insert page view record
  INSERT INTO public.page_views (
    entity_type,
    entity_id,
    entity_slug,
    account_id,
    ip_address,
    viewed_at
  )
  VALUES (
    p_entity_type,
    v_entity_id_for_update,
    CASE 
      WHEN p_entity_type = 'account' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      WHEN p_entity_type IN ('post', 'article') AND p_entity_slug IS NOT NULL THEN p_entity_slug
      ELSE NULL
    END,
    p_account_id,
    p_ip_address,
    NOW()
  );
  
  -- Update view_count on entity table (always use entity_id now that it's resolved)
  IF v_entity_id_for_update IS NOT NULL AND v_table_name IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.%I SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
      v_table_name
    )
    USING v_entity_id_for_update
    INTO v_view_count;
  END IF;
  
  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create function to get visitors for an entity
-- ============================================================================

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.get_entity_visitors(TEXT, UUID, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_entity_visitors(
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  account_id UUID,
  account_username TEXT,
  account_first_name TEXT,
  account_last_name TEXT,
  account_image_url TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER
) AS $$
DECLARE
  v_entity_id_resolved UUID;
BEGIN
  -- Validate entity_type
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'business') THEN
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;
  
  -- Resolve entity_id if slug provided
  IF p_entity_type = 'account' AND p_entity_slug IS NOT NULL AND p_entity_id IS NULL THEN
    SELECT id INTO v_entity_id_resolved
    FROM public.accounts
    WHERE username = p_entity_slug
    LIMIT 1;
  ELSE
    v_entity_id_resolved := p_entity_id;
  END IF;
  
  -- Return visitors with account info
  RETURN QUERY
  SELECT DISTINCT ON (pv.account_id)
    a.id AS account_id,
    a.username AS account_username,
    a.first_name AS account_first_name,
    a.last_name AS account_last_name,
    a.image_url AS account_image_url,
    MAX(pv.viewed_at) AS viewed_at,
    COUNT(*)::INTEGER AS view_count
  FROM public.page_views pv
  INNER JOIN public.accounts a ON pv.account_id = a.id
  WHERE pv.entity_type = p_entity_type
    AND (
      (v_entity_id_resolved IS NOT NULL AND pv.entity_id = v_entity_id_resolved) OR
      (p_entity_slug IS NOT NULL AND pv.entity_slug = p_entity_slug)
    )
    AND pv.account_id IS NOT NULL
  GROUP BY a.id, a.username, a.first_name, a.last_name, a.image_url, pv.account_id
  ORDER BY pv.account_id, MAX(pv.viewed_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: RLS Policies
-- ============================================================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can record page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view own page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view visitors to own content" ON public.page_views;

-- Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can record page views"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own page views (where they are the visitor)
CREATE POLICY "Users can view own page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (
    account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
  );

-- Users can view visitors to their own content
CREATE POLICY "Users can view visitors to own content"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (
    -- For account profiles, check if viewing own profile's visitors
    (entity_type = 'account' AND entity_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)) OR
    -- For posts/articles, check ownership via account_id
    (entity_type IN ('post', 'article') AND EXISTS (
      SELECT 1 FROM public.posts WHERE id = page_views.entity_id AND profile_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
      UNION
      SELECT 1 FROM public.articles WHERE id = page_views.entity_id AND account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
    ))
  );

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_page_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_visitors TO authenticated;

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.page_views IS
  'Detailed visitor tracking system. Records individual page views with account_id for authenticated users.';

COMMENT ON COLUMN public.page_views.account_id IS
  'Account ID of the visitor. NULL for anonymous visitors.';

COMMENT ON COLUMN public.page_views.entity_type IS
  'Type of entity being viewed: post, article, city, county, account, or business';

COMMENT ON FUNCTION public.record_page_view IS
  'Records a page view and increments the entity view_count. Returns the new view_count.';

COMMENT ON FUNCTION public.get_entity_visitors IS
  'Returns list of visitors to an entity with account information.';

