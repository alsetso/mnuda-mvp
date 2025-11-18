-- Create admin_articles table for managing article content and view metrics
-- Only admins can create/edit articles, but published articles are viewable by all

CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.admin_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Article content
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  
  -- Metadata
  author_name TEXT DEFAULT 'MNUDA Editorial',
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status public.article_status NOT NULL DEFAULT 'draft'::public.article_status,
  
  -- View metrics
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to members table for PostgREST joins
ALTER TABLE public.admin_articles
ADD CONSTRAINT admin_articles_created_by_members_fk 
FOREIGN KEY (created_by) REFERENCES public.members(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_articles_created_by ON public.admin_articles(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_articles_status ON public.admin_articles(status);
CREATE INDEX IF NOT EXISTS idx_admin_articles_slug ON public.admin_articles(slug);
CREATE INDEX IF NOT EXISTS idx_admin_articles_published_at ON public.admin_articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_articles_created_at ON public.admin_articles(created_at DESC);

-- Composite index for published articles query
CREATE INDEX IF NOT EXISTS idx_admin_articles_published ON public.admin_articles(status, published_at DESC) 
WHERE status = 'published'::public.article_status;

-- Trigger to update updated_at
CREATE TRIGGER update_admin_articles_updated_at 
    BEFORE UPDATE ON public.admin_articles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_articles TO authenticated;

-- Enable RLS
ALTER TABLE public.admin_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin Articles

-- Public can view published articles
CREATE POLICY "Public can view published articles"
  ON public.admin_articles
  FOR SELECT
  TO anon
  USING (status = 'published'::public.article_status);

-- Authenticated users can view published articles
CREATE POLICY "Authenticated users can view published articles"
  ON public.admin_articles
  FOR SELECT
  TO authenticated
  USING (status = 'published'::public.article_status);

-- Admins can view all articles
CREATE POLICY "Admins can view all articles"
  ON public.admin_articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'::public.member_role
    )
  );

-- Admins can create articles
CREATE POLICY "Admins can create articles"
  ON public.admin_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'::public.member_role
    )
  );

-- Admins can update articles
CREATE POLICY "Admins can update articles"
  ON public.admin_articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'::public.member_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'::public.member_role
    )
  );

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
  ON public.admin_articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'::public.member_role
    )
  );

-- Grant SELECT to anon for public viewing
GRANT SELECT ON public.admin_articles TO anon;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_article_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.admin_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment unique view count
CREATE OR REPLACE FUNCTION public.increment_article_unique_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.admin_articles
  SET unique_view_count = unique_view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

