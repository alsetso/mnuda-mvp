-- Add market_radius column to members table
-- Radius in miles (1-99) around primary market area

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS market_radius INTEGER CHECK (market_radius >= 1 AND market_radius <= 99);

-- Create index for market radius queries
CREATE INDEX IF NOT EXISTS idx_members_market_radius ON public.members(market_radius) WHERE market_radius IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.members.market_radius IS 'Market radius in miles (1-99) around primary market area';

