-- Create feed table for Minnesota community feed
-- Feed posts are visible to all authenticated users and represent community content

-- ============================================================================
-- STEP 1: Create feed_status enum
-- ============================================================================

CREATE TYPE public.feed_status AS ENUM (
  'published',
  'draft',
  'archived'
);

-- ============================================================================
-- STEP 2: Create feed table
-- ============================================================================

CREATE TABLE public.feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT, -- Short summary for previews
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb, -- Array of media objects (images/videos): [{url, filename, type, uploaded_at, ...}]
  
  -- Location (Minnesota-focused)
  city TEXT,
  county TEXT,
  zip_code TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Status and visibility
  status public.feed_status NOT NULL DEFAULT 'published'::public.feed_status,
  
  -- Engagement metrics
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT feed_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT feed_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT feed_excerpt_length CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  CONSTRAINT feed_likes_count_non_negative CHECK (likes_count >= 0),
  CONSTRAINT feed_comments_count_non_negative CHECK (comments_count >= 0),
  CONSTRAINT feed_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT feed_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX feed_profile_id_idx
  ON public.feed (profile_id);

CREATE INDEX feed_status_idx
  ON public.feed (status);

CREATE INDEX feed_created_at_idx
  ON public.feed (created_at DESC);

CREATE INDEX feed_city_idx
  ON public.feed (city) WHERE city IS NOT NULL;

CREATE INDEX feed_county_idx
  ON public.feed (county) WHERE county IS NOT NULL;

CREATE INDEX feed_location_idx
  ON public.feed (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- STEP 4: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_feed_updated_at
  BEFORE UPDATE ON public.feed
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies
-- ============================================================================

-- All authenticated users can view published feed posts
CREATE POLICY "Users can view published feed posts"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (status = 'published'::public.feed_status);

-- Users can view their own feed posts (including drafts)
CREATE POLICY "Users can view own feed posts"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can insert their own feed posts
CREATE POLICY "Users can insert own feed posts"
  ON public.feed
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can update their own feed posts
CREATE POLICY "Users can update own feed posts"
  ON public.feed
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own feed posts
CREATE POLICY "Users can delete own feed posts"
  ON public.feed
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = feed.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all feed posts
CREATE POLICY "Admins can view all feed posts"
  ON public.feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Admins can update all feed posts
CREATE POLICY "Admins can update all feed posts"
  ON public.feed
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Admins can delete all feed posts
CREATE POLICY "Admins can delete all feed posts"
  ON public.feed
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON TABLE public.feed IS 'Community feed posts for Minnesota real estate development and acquisition platform';
COMMENT ON COLUMN public.feed.profile_id IS 'References profiles.id - the profile that created this feed post';
COMMENT ON COLUMN public.feed.title IS 'Post title (1-200 characters)';
COMMENT ON COLUMN public.feed.content IS 'Post content/body (1-10000 characters)';
COMMENT ON COLUMN public.feed.excerpt IS 'Short summary for previews (max 500 characters)';
COMMENT ON COLUMN public.feed.images IS 'Array of media objects (images/videos) stored in feed-images bucket';
COMMENT ON COLUMN public.feed.city IS 'City in Minnesota where post is relevant';
COMMENT ON COLUMN public.feed.county IS 'County in Minnesota where post is relevant';
COMMENT ON COLUMN public.feed.zip_code IS 'ZIP code in Minnesota';
COMMENT ON COLUMN public.feed.latitude IS 'Latitude coordinate for location';
COMMENT ON COLUMN public.feed.longitude IS 'Longitude coordinate for location';
COMMENT ON COLUMN public.feed.status IS 'Post status: published (visible to all), draft (only creator), archived (hidden)';
COMMENT ON COLUMN public.feed.likes_count IS 'Number of likes on this post';
COMMENT ON COLUMN public.feed.comments_count IS 'Number of comments on this post';

