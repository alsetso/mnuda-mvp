-- Create pins_categories table for pin categorization
-- This table stores categories that pins can be assigned to

CREATE TABLE IF NOT EXISTS public.pins_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active categories
CREATE INDEX IF NOT EXISTS idx_pins_categories_is_active ON public.pins_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_pins_categories_display_order ON public.pins_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_pins_categories_slug ON public.pins_categories(slug);

-- Create trigger to auto-update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_pins_categories_updated_at ON public.pins_categories;
CREATE TRIGGER update_pins_categories_updated_at 
    BEFORE UPDATE ON public.pins_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add category_id to pins table
ALTER TABLE public.pins
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.pins_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pins_category_id ON public.pins(category_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.pins_categories TO authenticated;
GRANT SELECT ON public.pins_categories TO anon;

-- Enable RLS
ALTER TABLE public.pins_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Categories are read-only for all users
CREATE POLICY "Anyone can view active categories"
  ON public.pins_categories
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Insert default categories: 'project', 'listing', and 'public_concern'
INSERT INTO public.pins_categories (slug, label, emoji, description, display_order, is_active)
VALUES 
  ('project', 'Open Project', '🏗️', 'Active construction, renovation, or job opening (Under Development)', 1, true),
  ('listing', 'Active Listing', '🏠', 'Property for sale (owner or under contract) (Acquisition)', 2, true),
  ('public_concern', 'Public Concern', '⚠️', 'Community issues, safety concerns, or public infrastructure needs', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.pins_categories IS 'Categories for pins. Used to classify pins as projects (under development) or listings (acquisition).';
COMMENT ON COLUMN public.pins.category_id IS 'Reference to pins_categories table. Used to classify pins as projects or listings.';

