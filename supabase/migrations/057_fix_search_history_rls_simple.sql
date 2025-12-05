-- Fix RLS policies for search_history table
-- Simple policy: Any authenticated user can insert their own searches

-- Ensure RLS is enabled
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can update own search history" ON public.search_history;

-- Simple policy: Any authenticated user can insert their own searches
-- Only requirement is that user_id matches auth.uid()
CREATE POLICY "Users can insert own search history"
  ON public.search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Simple policy: Users can view their own searches
CREATE POLICY "Users can view own search history"
  ON public.search_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY "Users can insert own search history" ON public.search_history IS 
  'Allows any authenticated user to insert location searches. Only requirement is user_id matches auth.uid(). Profile_id is optional and can be null.';


