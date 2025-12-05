-- Ensure posts table has all required columns and correct RLS policies
-- This migration fixes issues from conflicting migrations 145_*

-- ============================================================================
-- STEP 1: Ensure user_owns_account function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_account(account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER runs with postgres privileges, bypassing RLS
  -- This allows us to check account ownership even if accounts table has RLS
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = account_id
    AND accounts.user_id = auth.uid()
  );
END;
$$;

-- Ensure function is owned by postgres (required for SECURITY DEFINER)
ALTER FUNCTION public.user_owns_account(UUID) OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_account(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 2: Ensure post_visibility enum exists with correct values
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.post_visibility AS ENUM (
    'public',
    'draft'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Ensure posts table exists with all required columns
-- ============================================================================

-- Add columns that might be missing (using IF NOT EXISTS where possible)
DO $$ 
BEGIN
  -- Ensure posts table exists (should already exist from 145_simple_posts_table)
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') THEN
    CREATE TABLE public.posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      visibility public.post_visibility NOT NULL DEFAULT 'public'::public.post_visibility,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      
      CONSTRAINT posts_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
      CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000)
    );
  END IF;

  -- Add map_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'map_data'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN map_data JSONB;
    CREATE INDEX IF NOT EXISTS posts_map_data_idx ON public.posts USING GIN (map_data) WHERE map_data IS NOT NULL;
    COMMENT ON COLUMN public.posts.map_data IS 'Map data for posts: { type: "pin" | "area" | "region", geometry: GeoJSON.Point | GeoJSON.Polygon | GeoJSON.MultiPolygon, radiusKm?: number }';
  END IF;

  -- Add other optional columns that might be needed (images, city_id, county_id, etc.)
  -- These are added conditionally to support extended schema if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'images'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN images JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'city_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN city_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'county_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN county_id UUID;
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS posts_account_id_idx ON public.posts(account_id);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- ============================================================================
-- STEP 4: Drop and recreate RLS policies with correct implementation
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_select_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anonymous: Can view public posts only
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public'::public.post_visibility);

-- Authenticated: Can view public posts and own posts (including drafts)
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.post_visibility OR
    public.user_owns_account(account_id)
  );

-- Authenticated: Can insert posts for own account
-- Uses SECURITY DEFINER function to bypass accounts table RLS
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the account (uses SECURITY DEFINER function)
    AND public.user_owns_account(account_id)
  );

-- Authenticated: Can update own posts
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  )
  WITH CHECK (
    -- Must still own the account after update
    public.user_owns_account(account_id)
  );

-- Authenticated: Can delete own posts
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    -- Must own the account (uses SECURITY DEFINER function)
    public.user_owns_account(account_id)
  );

-- ============================================================================
-- STEP 5: Ensure updated_at trigger exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_updated_at();

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON POLICY "posts_select_anon" ON public.posts IS 
  'Anonymous users can view public posts only';

COMMENT ON POLICY "posts_select_authenticated" ON public.posts IS 
  'Authenticated users can view public posts and own posts (including drafts)';

COMMENT ON POLICY "posts_insert" ON public.posts IS 
  'Authenticated users can create posts for their own account. Uses SECURITY DEFINER function to bypass accounts RLS.';

COMMENT ON POLICY "posts_update" ON public.posts IS 
  'Authenticated users can update their own posts';

COMMENT ON POLICY "posts_delete" ON public.posts IS 
  'Authenticated users can delete their own posts';


