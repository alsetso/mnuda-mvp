-- Fix RLS policies for location_searches table
-- Ensure all authenticated users can insert their own location searches

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own location searches" ON public.location_searches;
DROP POLICY IF EXISTS "Users can view own location searches" ON public.location_searches;

-- Simple policy: Any authenticated user can insert their own searches
-- Only requirement is that user_id matches auth.uid()
CREATE POLICY "Users can insert own location searches"
  ON public.location_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Simple policy: Users can view their own searches
CREATE POLICY "Users can view own location searches"
  ON public.location_searches
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY "Users can insert own location searches" ON public.location_searches IS 
  'Allows any authenticated user to insert location searches. Only requirement is user_id matches auth.uid(). Profile_id is optional and can be null.';


