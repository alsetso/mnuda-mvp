-- Create get_feed_stats function
-- Extracted from migration 155 for standalone execution
-- Drop existing function first if it exists with different signature

DROP FUNCTION IF EXISTS public.get_feed_stats(INTEGER);
DROP FUNCTION IF EXISTS public.get_feed_stats();

CREATE OR REPLACE FUNCTION public.get_feed_stats(
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
    -- Total loads: count of all page views for feed within time period
    COUNT(*)::BIGINT AS total_loads,
    
    -- Unique visitors: distinct accounts + distinct IPs (for anonymous)
    (
      COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL) +
      COUNT(DISTINCT ip_address) FILTER (WHERE account_id IS NULL AND ip_address IS NOT NULL)
    )::BIGINT AS unique_visitors,
    
    -- Accounts active: distinct accounts that viewed feed
    COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL)::BIGINT AS accounts_active
  FROM public.page_views
  WHERE entity_type = 'feed'
    AND viewed_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_feed_stats TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_feed_stats IS
  'Returns feed statistics: total_loads (all views), unique_visitors (distinct accounts + IPs), and accounts_active (distinct accounts only). p_hours parameter filters to last N hours (default 24).';

