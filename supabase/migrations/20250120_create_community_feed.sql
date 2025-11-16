-- Create community_feed table for public text chat feed
-- Streams publicly to all authenticated members

CREATE TABLE IF NOT EXISTS public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_feed_user_id ON public.community_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_created_at ON public.community_feed(created_at DESC);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.community_feed TO authenticated;

-- Enable RLS
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- All authenticated users can view all messages (public feed)
CREATE POLICY "Authenticated users can view all messages"
  ON public.community_feed
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert own messages"
  ON public.community_feed
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for community_feed table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_feed;

