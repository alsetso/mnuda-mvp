-- Add subcategory column to pins table
-- Stores the scale (for projects) or type (for listings) selected by the user

ALTER TABLE public.pins
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Create index for subcategory queries
CREATE INDEX IF NOT EXISTS idx_pins_subcategory ON public.pins(subcategory);

-- Add comment
COMMENT ON COLUMN public.pins.subcategory IS 'Subcategory for the pin. For projects: home-repair, renovation, new-construction, commercial, mixed-use, city-development. For listings: residential, multi-family, commercial, land, other.';

