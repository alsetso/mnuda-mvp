-- Remove slug column and add logo_image_url, cover_image_url, website columns
-- Replace slug-based URLs with ID-based URLs

-- Drop slug-related objects first (if they exist from previous migration)
DROP TRIGGER IF EXISTS generate_group_slug_trigger ON public.groups;
DROP FUNCTION IF EXISTS public.generate_group_slug();

-- Remove slug column and index (if they exist)
DROP INDEX IF EXISTS idx_groups_slug;
ALTER TABLE public.groups DROP COLUMN IF EXISTS slug;

-- Add new columns (if they don't already exist from updated initial migration)
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS logo_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

-- Add check constraint for website URL format (basic validation)
-- Drop constraint first if it exists
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_website_url_check;
ALTER TABLE public.groups
  ADD CONSTRAINT groups_website_url_check 
  CHECK (website IS NULL OR website ~ '^https?://');

