-- Add Stripe subscription fields to profiles table
-- This migration adds the necessary fields for Stripe subscription management

-- Add missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS default_payment_method TEXT;

-- Create stripe_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stripe_events table
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Create policy for stripe_events (service role only)
CREATE POLICY "Service role can manage stripe_events" ON public.stripe_events
FOR ALL TO service_role USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
