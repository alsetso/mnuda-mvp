-- Allow anonymous users to read feed stats from page_views
-- This is needed for the feed stats card to work for logged-out users

-- Add policy for anonymous users to read feed page views (for stats only)
CREATE POLICY "anon_can_read_feed_stats"
  ON public.page_views FOR SELECT
  TO anon
  USING (entity_type = 'feed');

-- Also grant SELECT permission to anon (if not already granted)
GRANT SELECT ON public.page_views TO anon;

-- Update the function to allow anonymous execution
GRANT EXECUTE ON FUNCTION public.get_feed_stats TO anon;

