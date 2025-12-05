-- Fix record_page_view function to properly handle all entity types
-- Resolves slugs to IDs for articles and posts, not just accounts

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
  -- Only update if the table has a view_count column
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
  END IF;
  
  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (ensure anon can call it)
GRANT EXECUTE ON FUNCTION public.record_page_view TO anon, authenticated;

COMMENT ON FUNCTION public.record_page_view IS
  'Records a page view and increments the entity view_count. Resolves slugs to IDs for accounts, posts, and articles. Returns the new view_count.';

