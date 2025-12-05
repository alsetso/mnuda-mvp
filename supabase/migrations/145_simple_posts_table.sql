-- Drop and create simplest posts table with account_id
-- Minimal schema for basic functionality

-- ============================================================================
-- STEP 1: Create visibility enum if it doesn't exist
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
-- STEP 2: Drop existing posts table and dependencies
-- ============================================================================

DROP TABLE IF EXISTS public.posts CASCADE;

-- ============================================================================
-- STEP 3: Create simple posts table
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Create indexes
-- ============================================================================

CREATE INDEX posts_account_id_idx ON public.posts(account_id);
CREATE INDEX posts_visibility_idx ON public.posts(visibility);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create simple RLS policies
-- ============================================================================

-- Anonymous: can read public posts
CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Authenticated: can read public posts and own posts
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = posts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Authenticated: can insert own posts
CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = posts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Authenticated: can update own posts
CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = posts.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = posts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Authenticated: can delete own posts
CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = posts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_updated_at();

