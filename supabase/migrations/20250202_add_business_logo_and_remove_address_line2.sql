-- Add logo_url column and remove address_line2 from businesses table

-- Add logo_url column
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Remove address_line2 column
ALTER TABLE public.businesses
DROP COLUMN IF EXISTS address_line2;

