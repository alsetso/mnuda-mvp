-- Fix RLS Policies and Ensure Tables Exist
-- This migration ensures all billing tables exist with proper RLS policies

-- ============================================================================
-- ENSURE ALL TABLES EXIST
-- ============================================================================

-- Create billing schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS billing;

-- 1. PROFILES TABLE (public schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  active_subscription_id UUID,
  subscription_status TEXT DEFAULT 'free',
  user_type TEXT DEFAULT 'buyer',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BILLING.PLANS
CREATE TABLE IF NOT EXISTS billing.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  credits_per_period INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BILLING.SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS billing.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BILLING.CREDIT_BALANCE
CREATE TABLE IF NOT EXISTS billing.credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing.plans(id),
  remaining_credits NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_credits_allocated NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BILLING.CREDIT_TRANSACTIONS
CREATE TABLE IF NOT EXISTS billing.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BILLING.API_TYPES
CREATE TABLE IF NOT EXISTS billing.api_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cost_credits NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BILLING.USAGE_EVENTS
CREATE TABLE IF NOT EXISTS billing.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  api_type_id UUID NOT NULL REFERENCES billing.api_types(id),
  credits_consumed NUMERIC(10,2) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.api_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.usage_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Plans policies (read-only for users)
DROP POLICY IF EXISTS "Users can view active plans" ON billing.plans;
CREATE POLICY "Users can view active plans" ON billing.plans
  FOR SELECT USING (is_active = true);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON billing.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON billing.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON billing.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON billing.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON billing.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON billing.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit balance policies
DROP POLICY IF EXISTS "Users can view own credit balance" ON billing.credit_balance;
CREATE POLICY "Users can view own credit balance" ON billing.credit_balance
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit balance" ON billing.credit_balance;
CREATE POLICY "Users can insert own credit balance" ON billing.credit_balance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credit balance" ON billing.credit_balance;
CREATE POLICY "Users can update own credit balance" ON billing.credit_balance
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit transactions policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON billing.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON billing.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit transactions" ON billing.credit_transactions;
CREATE POLICY "Users can insert own credit transactions" ON billing.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API types policies (read-only for users)
DROP POLICY IF EXISTS "Users can view active api types" ON billing.api_types;
CREATE POLICY "Users can view active api types" ON billing.api_types
  FOR SELECT USING (is_active = true);

-- Usage events policies
DROP POLICY IF EXISTS "Users can view own usage events" ON billing.usage_events;
CREATE POLICY "Users can view own usage events" ON billing.usage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage events" ON billing.usage_events;
CREATE POLICY "Users can insert own usage events" ON billing.usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON billing.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON billing.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON billing.subscriptions(status);

-- Credit balance indexes
CREATE INDEX IF NOT EXISTS idx_credit_balance_user_id ON billing.credit_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_balance_created_at ON billing.credit_balance(created_at);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON billing.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON billing.credit_transactions(created_at);

-- Usage events indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON billing.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON billing.usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_api_type_id ON billing.usage_events(api_type_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans if they don't exist
INSERT INTO billing.plans (name, description, price_cents, billing_interval, credits_per_period, stripe_price_id, is_active)
VALUES 
  ('Free', 'Free tier with limited daily credits', 0, 'daily', 5, 'price_free', true),
  ('Basic', 'Basic plan with more credits', 999, 'monthly', 100, 'price_basic', true),
  ('Pro', 'Professional plan with unlimited credits', 2999, 'monthly', 1000, 'price_pro', true)
ON CONFLICT (name) DO NOTHING;

-- Insert API types if they don't exist
INSERT INTO billing.api_types (api_key, name, description, cost_credits, is_active)
VALUES 
  ('address', 'Address Search', 'Search by street address', 1.00, true),
  ('name', 'Name Search', 'Search by person name', 1.00, true),
  ('email', 'Email Search', 'Search by email address', 1.00, true),
  ('phone', 'Phone Search', 'Search by phone number', 1.00, true),
  ('zillow', 'Zillow Search', 'Search property data', 1.00, true)
ON CONFLICT (api_key) DO NOTHING;

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get user credits
CREATE OR REPLACE FUNCTION public.get_user_credits(user_uuid UUID)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  credit_balance NUMERIC(10,2);
BEGIN
  SELECT remaining_credits INTO credit_balance
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(credit_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct user credits
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  user_uuid UUID,
  credits_to_deduct NUMERIC(10,2),
  description TEXT DEFAULT 'API usage'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  credit_balance_id UUID;
BEGIN
  -- Get current balance
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < credits_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - credits_to_deduct;
  
  -- Update credit balance
  UPDATE billing.credit_balance
  SET remaining_credits = new_balance,
      updated_at = NOW()
  WHERE id = credit_balance_id;
  
  -- Insert transaction record
  INSERT INTO billing.credit_transactions (
    user_id, amount, transaction_type, description, balance_before, balance_after
  ) VALUES (
    user_uuid, -credits_to_deduct, 'usage', description, current_balance, new_balance
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
