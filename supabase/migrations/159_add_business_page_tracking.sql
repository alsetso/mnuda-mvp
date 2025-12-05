-- Add business page tracking support
-- Enables tracking for /business, /business/directory, and individual business pages
-- Similar to feed tracking with same permissions

-- ============================================================================
-- STEP 1: Update record_page_view to support business page slugs
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
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'business', 'feed') THEN
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
      -- Accounts: resolve username to account_id
      SELECT id INTO v_entity_id_for_update
      FROM public.accounts
      WHERE username = p_entity_slug
      LIMIT 1;
    ELSIF p_entity_type IN ('post', 'article') THEN
      -- Posts/Articles: resolve slug to id
      EXECUTE format('SELECT id FROM public.%I WHERE slug = $1 LIMIT 1', v_table_name)
      USING p_entity_slug
      INTO v_entity_id_for_update;
    ELSIF p_entity_type IN ('city', 'county') THEN
      -- Cities/Counties: resolve slug to id
      EXECUTE format('SELECT id FROM public.%I WHERE slug = $1 LIMIT 1', v_table_name)
      USING p_entity_slug
      INTO v_entity_id_for_update;
    ELSIF p_entity_type = 'business' THEN
      -- Business pages: 'business' or 'directory' slugs don't resolve to entity_id
      -- These are page-level tracking, not business-specific
      v_entity_id_for_update := NULL;
    ELSE
      -- For other entity types, slug resolution not supported
      RAISE EXCEPTION 'Slug lookup not supported for entity_type: %', p_entity_type;
    END IF;
  ELSE
    -- For feed and business page slugs, allow NULL entity_id
    IF p_entity_type IN ('feed', 'business') THEN
      v_entity_id_for_update := NULL;
    ELSE
      RAISE EXCEPTION 'Either entity_id or entity_slug must be provided';
    END IF;
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
      WHEN p_entity_type = 'feed' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      WHEN p_entity_type = 'business' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      ELSE NULL
    END,
    p_account_id,
    p_ip_address,
    NOW()
  );
  
  -- Update view_count on entity table (only if table exists and has view_count column)
  IF v_entity_id_for_update IS NOT NULL AND v_table_name IS NOT NULL THEN
    BEGIN
      EXECUTE format(
        'UPDATE public.%I SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1 RETURNING view_count',
        v_table_name
      )
      USING v_entity_id_for_update
      INTO v_view_count;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip update but still record the page view
        v_view_count := 0;
        RAISE WARNING 'view_count column does not exist on table %', v_table_name;
    END;
  ELSE
    -- For feed or business page slugs, return 0 (we track in page_views table)
    v_view_count := 0;
  END IF;
  
  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Create function to get business page statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_business_page_stats(
  p_page_slug TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_loads BIGINT,
  unique_visitors BIGINT,
  accounts_active BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total loads: count of all page views for the business page within time period
    COUNT(*)::BIGINT AS total_loads,
    
    -- Unique visitors: distinct accounts + distinct IPs (for anonymous)
    (
      COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL) +
      COUNT(DISTINCT ip_address) FILTER (WHERE account_id IS NULL AND ip_address IS NOT NULL)
    )::BIGINT AS unique_visitors,
    
    -- Accounts active: distinct accounts that viewed the page
    COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL)::BIGINT AS accounts_active
  FROM public.page_views
  WHERE entity_type = 'business'
    AND entity_slug = p_page_slug
    AND viewed_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_business_page_stats TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_business_page_stats IS
  'Returns business page statistics for a specific page slug (e.g., "business", "directory"). Returns total_loads (all views), unique_visitors (distinct accounts + IPs), and accounts_active (distinct accounts only). p_hours parameter filters to last N hours (default 24).';

-- ============================================================================
-- STEP 3: Allow anonymous users to read business page stats
-- ============================================================================

-- Drop policy if it exists (for idempotency)
DROP POLICY IF EXISTS "anon_can_read_business_page_stats" ON public.page_views;

-- Add policy for anonymous users to read business page views (for stats only)
CREATE POLICY "anon_can_read_business_page_stats"
  ON public.page_views FOR SELECT
  TO anon
  USING (entity_type = 'business' AND entity_slug IN ('business', 'directory'));

-- Ensure SELECT permission is granted (should already be from migration 127)
GRANT SELECT ON public.page_views TO anon;

