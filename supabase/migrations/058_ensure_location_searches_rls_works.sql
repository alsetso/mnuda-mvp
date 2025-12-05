-- Ensure location_searches table exists and RLS policies are correct
-- This migration ensures the table and policies are properly configured

-- First, ensure the table exists (if migration 055 hasn't run yet, this will fail gracefully)
DO $$
BEGIN
  -- Check if table exists, if not, create it
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'location_searches') THEN
    CREATE TABLE public.location_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      place_name TEXT NOT NULL,
      lat NUMERIC(10, 8) NOT NULL,
      lng NUMERIC(11, 8) NOT NULL,
      mapbox_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      search_query TEXT,
      page_source TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    CREATE INDEX idx_location_searches_user_id ON public.location_searches(user_id);
    CREATE INDEX idx_location_searches_profile_id ON public.location_searches(profile_id);
    CREATE INDEX idx_location_searches_created_at ON public.location_searches(created_at DESC);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.location_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can insert own location searches" ON public.location_searches;
DROP POLICY IF EXISTS "Users can view own location searches" ON public.location_searches;

-- Simple policy: Any authenticated user can insert their own searches
-- Only requirement is that user_id matches auth.uid()
-- Profile_id is optional and can be null
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

-- Grant necessary permissions to authenticated role
GRANT INSERT, SELECT ON public.location_searches TO authenticated;

COMMENT ON POLICY "Users can insert own location searches" ON public.location_searches IS 
  'Allows any authenticated user to insert location searches. Only requirement is user_id matches auth.uid(). Profile_id is optional and can be null.';

