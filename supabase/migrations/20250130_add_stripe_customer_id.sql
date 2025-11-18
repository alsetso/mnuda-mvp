-- Add Stripe customer ID to members table
-- Used for payment method management and subscriptions

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_members_stripe_customer_id ON public.members(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.members.stripe_customer_id IS 'Stripe customer ID for payment method and subscription management';

