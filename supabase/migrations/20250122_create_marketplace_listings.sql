-- Create marketplace listings table
-- Allows users to create listings (free or paid, physical or digital) selling across Minnesota
-- Listings can be connected to pins for locational data

CREATE TYPE public.listing_type AS ENUM ('physical', 'digital');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'expired', 'draft');

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  listing_type public.listing_type NOT NULL DEFAULT 'physical'::public.listing_type,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  is_free BOOLEAN NOT NULL DEFAULT false,
  status public.listing_status NOT NULL DEFAULT 'active'::public.listing_status,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  pin_id UUID REFERENCES public.pins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to members table for PostgREST joins
ALTER TABLE public.marketplace_listings
ADD CONSTRAINT marketplace_listings_created_by_members_fk 
FOREIGN KEY (created_by) REFERENCES public.members(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_by ON public.marketplace_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_listing_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_pin_id ON public.marketplace_listings(pin_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON public.marketplace_listings(price);

-- Trigger to update updated_at
CREATE TRIGGER update_marketplace_listings_updated_at 
    BEFORE UPDATE ON public.marketplace_listings 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Marketplace Listings
CREATE POLICY "Anyone can view active listings"
  ON public.marketplace_listings
  FOR SELECT
  TO authenticated
  USING (status = 'active'::public.listing_status);

CREATE POLICY "Users can view their own listings"
  ON public.marketplace_listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create listings"
  ON public.marketplace_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own listings"
  ON public.marketplace_listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own listings"
  ON public.marketplace_listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow anonymous users to view active listings
GRANT SELECT ON public.marketplace_listings TO anon;

CREATE POLICY "Anonymous users can view active listings"
  ON public.marketplace_listings
  FOR SELECT
  TO anon
  USING (status = 'active'::public.listing_status);

