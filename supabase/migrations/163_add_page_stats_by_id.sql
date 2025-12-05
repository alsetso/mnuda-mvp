-- Add function to get page statistics by entity_id
-- Allows fetching stats for individual pages (not just page slugs)

-- ============================================================================
-- STEP 1: Create get_page_stats_by_id function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_page_stats_by_id(
  p_entity_id UUID,
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
    -- Total loads: count of all page views for the page within time period
    COUNT(*)::BIGINT AS total_loads,
    
    -- Unique visitors: distinct accounts + distinct IPs (for anonymous)
    (
      COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL) +
      COUNT(DISTINCT ip_address) FILTER (WHERE account_id IS NULL AND ip_address IS NOT NULL)
    )::BIGINT AS unique_visitors,
    
    -- Accounts active: distinct accounts that viewed the page
    COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL)::BIGINT AS accounts_active
  FROM public.page_views
  WHERE entity_type = 'page'
    AND entity_id = p_entity_id
    AND viewed_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_page_stats_by_id TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_page_stats_by_id IS
  'Returns page statistics for a specific page by entity_id. Returns total_loads (all views), unique_visitors (distinct accounts + IPs), and accounts_active (distinct accounts only). p_hours parameter filters to last N hours (default 24).';

