-- Add is_public column to pins_categories table
-- This column controls which categories appear in the map filters

ALTER TABLE public.pins_categories
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Create index for public categories
CREATE INDEX IF NOT EXISTS idx_pins_categories_is_public ON public.pins_categories(is_public);

-- Update the three default categories to be public
UPDATE public.pins_categories
SET is_public = true
WHERE slug IN ('project', 'listing', 'public_concern');

-- Grant UPDATE permission to authenticated users (for admin updates)
GRANT UPDATE ON public.pins_categories TO authenticated;

-- Update RLS policy to allow viewing active categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.pins_categories;

CREATE POLICY "Anyone can view active categories"
  ON public.pins_categories
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admins can update categories
CREATE POLICY "Admins can update categories"
  ON public.pins_categories
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

-- Add comment
COMMENT ON COLUMN public.pins_categories.is_public IS 'Controls whether this category appears in the map filters. Only categories with is_public = true will be shown to users in the filter UI.';

