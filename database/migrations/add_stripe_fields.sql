-- Add Stripe-related fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_tier TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS default_payment_method TEXT;

-- Create stripe_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON stripe_events(event_type);

-- Add comments for documentation
COMMENT ON COLUMN profiles.plan_tier IS 'Current subscription plan tier (e.g., basic, pro, enterprise)';
COMMENT ON COLUMN profiles.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN profiles.default_payment_method IS 'Default payment method ID from Stripe';
COMMENT ON TABLE stripe_events IS 'Tracks processed Stripe webhook events for idempotency';
