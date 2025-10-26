-- Complete Database Reset - Clean Slate
-- This migration sets up the entire MNUDA database schema from scratch
-- Includes: Auth, Profiles, Billing, RLS, Triggers, and Seed Data

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================

-- Create billing schema
CREATE SCHEMA IF NOT EXISTS billing;

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- 1. PUBLIC.PROFILES - User identity and billing linkage
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  active_subscription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BILLING.PLANS - Available subscription plans
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

-- 3. BILLING.SUBSCRIPTIONS - User subscription tracking
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

-- 4. BILLING.CREDIT_BALANCE - Credit allocation per billing period
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

-- 5. BILLING.CREDIT_TRANSACTIONS - Audit trail for credit usage
CREATE TABLE IF NOT EXISTS billing.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL, -- positive for credits added, negative for usage
  transaction_type TEXT NOT NULL, -- 'credit', 'usage', 'refund', 'bonus'
  description TEXT,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON billing.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON billing.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON billing.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON billing.subscriptions(stripe_subscription_id);

-- Credit balance indexes
CREATE INDEX IF NOT EXISTS idx_credit_balance_user_id ON billing.credit_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_balance_plan_id ON billing.credit_balance(plan_id);
CREATE INDEX IF NOT EXISTS idx_credit_balance_period ON billing.credit_balance(period_start, period_end);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON billing.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON billing.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON billing.credit_transactions(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Subscriptions Policies
CREATE POLICY "Users can view their subscriptions" ON billing.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their subscriptions" ON billing.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subscriptions" ON billing.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit Balance Policies
CREATE POLICY "Users can view their own credit balance" ON billing.credit_balance
  FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions Policies
CREATE POLICY "Users can view their own credit transactions" ON billing.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Plans are readable by all authenticated users
CREATE POLICY "Authenticated users can view plans" ON billing.plans
  FOR SELECT TO authenticated USING (is_active = true);

-- ============================================================================
-- AUTOMATIC PROFILE + BILLING CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
  free_plan_credits INT;
  new_subscription_id UUID;
  user_full_name TEXT;
BEGIN
  -- Extract full name from user metadata
  user_full_name := COALESCE(
    TRIM(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ),
    'User'
  );

  -- Get the free plan
  SELECT id, credits_per_period INTO free_plan_id, free_plan_credits 
  FROM billing.plans 
  WHERE name = 'Free' AND is_active = true
  LIMIT 1;

  -- If no free plan exists, create one
  IF free_plan_id IS NULL THEN
    INSERT INTO billing.plans (name, description, price_cents, billing_interval, credits_per_period, is_active)
    VALUES ('Free', 'Free tier with limited daily credits', 0, 'daily', 10, true)
    RETURNING id, credits_per_period INTO free_plan_id, free_plan_credits;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_full_name);

  -- Create free subscription
  INSERT INTO billing.subscriptions (
    user_id, 
    plan_id, 
    status, 
    current_period_start, 
    current_period_end
  )
  VALUES (
    NEW.id,
    free_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO new_subscription_id;

  -- Initialize credit balance
  INSERT INTO billing.credit_balance (
    user_id,
    plan_id,
    remaining_credits,
    total_credits_allocated,
    period_start,
    period_end,
    last_reset_at
  )
  VALUES (
    NEW.id,
    free_plan_id,
    free_plan_credits,
    free_plan_credits,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW()
  );

  -- Create initial credit transaction record
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    NEW.id,
    free_plan_credits,
    'credit',
    'Initial free tier credits',
    0,
    free_plan_credits
  );

  -- Link subscription to profile
  UPDATE public.profiles
  SET active_subscription_id = new_subscription_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically create profile and billing when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's current credit balance
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

-- Function to deduct credits from user
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
  -- Get current balance and the ID of the most recent credit balance record
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if user has enough credits
  IF current_balance < credits_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - credits_to_deduct;
  
  -- Update credit balance using the specific ID
  UPDATE billing.credit_balance
  SET 
    remaining_credits = new_balance,
    updated_at = NOW()
  WHERE id = credit_balance_id;
  
  -- Record transaction
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    user_uuid,
    -credits_to_deduct,
    'usage',
    description,
    current_balance,
    new_balance
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user
CREATE OR REPLACE FUNCTION public.add_user_credits(
  user_uuid UUID,
  credits_to_add NUMERIC(10,2),
  description TEXT DEFAULT 'Credits added'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  credit_balance_id UUID;
BEGIN
  -- Get current balance and the ID of the most recent credit balance record
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new balance
  new_balance := current_balance + credits_to_add;
  
  -- Update credit balance using the specific ID
  UPDATE billing.credit_balance
  SET 
    remaining_credits = new_balance,
    updated_at = NOW()
  WHERE id = credit_balance_id;
  
  -- Record transaction
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    user_uuid,
    credits_to_add,
    'credit',
    description,
    current_balance,
    new_balance
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans
INSERT INTO billing.plans (name, description, price_cents, billing_interval, credits_per_period, is_active)
VALUES 
  ('Free', 'Free tier with limited daily credits', 0, 'daily', 10, true),
  ('Basic', 'Basic plan with monthly credits', 999, 'monthly', 100, true),
  ('Pro', 'Professional plan with higher limits', 2999, 'monthly', 500, true),
  ('Enterprise', 'Enterprise plan with unlimited access', 9999, 'monthly', 2000, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA billing TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.credit_balance TO authenticated;
GRANT SELECT ON billing.credit_transactions TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION public.get_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(UUID, NUMERIC(10,2), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(UUID, NUMERIC(10,2), TEXT) TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- This migration is now complete!
-- The database is ready for:
-- 1. OTP/Magic Link authentication
-- 2. Automatic profile creation
-- 3. Free tier billing setup
-- 4. Credit tracking and management
-- 5. Row-level security enforcement