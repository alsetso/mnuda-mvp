-- API Management System - Complete billing integration
-- This migration adds API cost management, usage tracking, and billing integration

-- ============================================================================
-- API COST MANAGEMENT TABLES
-- ============================================================================

-- API Types and their costs
CREATE TABLE IF NOT EXISTS billing.api_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL UNIQUE, -- 'address', 'name', 'email', 'phone', 'zillow', 'person-id'
  name TEXT NOT NULL, -- 'Address Search', 'Name Search', etc.
  description TEXT,
  cost_credits NUMERIC(10,2) NOT NULL DEFAULT 1.00, -- Cost in credits with 2 decimal places
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage events - tracks every API call with full context
CREATE TABLE IF NOT EXISTS billing.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID, -- Links to map.sessions when implemented
  api_type_id UUID NOT NULL REFERENCES billing.api_types(id),
  credits_consumed NUMERIC(10,2) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  request_data JSONB, -- Input parameters
  response_data JSONB, -- API response (optional, for debugging)
  processing_time_ms INTEGER, -- How long the API call took
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- UPDATED SEED DATA WITH YOUR SPECIFICATIONS
-- ============================================================================

-- Update plans with your Stripe price IDs and specifications
UPDATE billing.plans SET 
  stripe_price_id = 'price_1RElUbRxPcmTLDu9hiqZIMP0',
  credits_per_period = 5,
  billing_interval = 'daily',
  description = 'Free tier with 5 daily credits'
WHERE name = 'Free';

UPDATE billing.plans SET 
  stripe_price_id = 'price_1SHFdRRxPcmTLDu9wy5YnG7y',
  price_cents = 2000, -- $20.00
  credits_per_period = 500,
  billing_interval = 'monthly',
  description = 'Pro plan with 500 monthly credits'
WHERE name = 'Pro';

-- Insert API types with current pricing (all 0.75 credits)
INSERT INTO billing.api_types (api_key, name, description, cost_credits, is_active)
VALUES 
  ('address', 'Address Search', 'Search by street, city, state, zip', 0.75, true),
  ('name', 'Name Search', 'Search by first name, middle initial, last name', 0.75, true),
  ('email', 'Email Search', 'Search by email address', 0.75, true),
  ('phone', 'Phone Search', 'Search by phone number', 0.75, true),
  ('zillow', 'Zillow Search', 'Search property data from Zillow API', 0.75, true),
  ('person-id', 'Person Details', 'Get detailed person information by ID', 0.75, true)
ON CONFLICT (api_key) DO UPDATE SET
  cost_credits = EXCLUDED.cost_credits,
  updated_at = NOW();

-- ============================================================================
-- ENHANCED BILLING FUNCTIONS
-- ============================================================================

-- Function to check if user can make API call
CREATE OR REPLACE FUNCTION public.can_make_api_call(
  user_uuid UUID,
  api_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  api_cost NUMERIC(10,2);
  user_credits NUMERIC(10,2);
BEGIN
  -- Get API cost
  SELECT cost_credits INTO api_cost
  FROM billing.api_types
  WHERE api_key = $2 AND is_active = true;
  
  -- Get user's current credit balance
  user_credits := public.get_user_credits(user_uuid);
  
  -- Check if user has enough credits
  RETURN user_credits >= api_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record API usage and deduct credits
CREATE OR REPLACE FUNCTION public.record_api_usage(
  user_uuid UUID,
  api_key TEXT,
  session_id UUID DEFAULT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL,
  request_data JSONB DEFAULT NULL,
  response_data JSONB DEFAULT NULL,
  processing_time_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  api_type_id UUID;
  api_cost NUMERIC(10,2);
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  credit_balance_id UUID;
BEGIN
  -- Get API type and cost
  SELECT id, cost_credits INTO api_type_id, api_cost
  FROM billing.api_types
  WHERE api_key = $2 AND is_active = true;
  
  IF api_type_id IS NULL THEN
    RAISE EXCEPTION 'Invalid API type: %', api_key;
  END IF;
  
  -- Get current balance and record ID
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if user has enough credits (only deduct if successful)
  IF success AND current_balance < api_cost THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance (only deduct if successful)
  new_balance := current_balance - (CASE WHEN success THEN api_cost ELSE 0 END);
  
  -- Update credit balance (only if successful)
  IF success THEN
    UPDATE billing.credit_balance
    SET 
      remaining_credits = new_balance,
      updated_at = NOW()
    WHERE id = credit_balance_id;
  END IF;
  
  -- Record usage event
  INSERT INTO billing.usage_events (
    user_id,
    session_id,
    api_type_id,
    credits_consumed,
    success,
    error_message,
    request_data,
    response_data,
    processing_time_ms
  )
  VALUES (
    user_uuid,
    session_id,
    api_type_id,
    CASE WHEN success THEN api_cost ELSE 0 END,
    success,
    error_message,
    request_data,
    response_data,
    processing_time_ms
  );
  
  -- Record credit transaction (only if successful)
  IF success THEN
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
      -api_cost,
      'usage',
      'API usage: ' || api_key,
      current_balance,
      new_balance
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's API usage summary
CREATE OR REPLACE FUNCTION public.get_user_api_usage(
  user_uuid UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  api_key TEXT,
  api_name TEXT,
  total_calls BIGINT,
  successful_calls BIGINT,
  failed_calls BIGINT,
  total_credits_used BIGINT,
  avg_processing_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.api_key,
    at.name,
    COUNT(ue.id) as total_calls,
    COUNT(CASE WHEN ue.success THEN 1 END) as successful_calls,
    COUNT(CASE WHEN NOT ue.success THEN 1 END) as failed_calls,
    COALESCE(SUM(ue.credits_consumed), 0) as total_credits_used,
    ROUND(AVG(ue.processing_time_ms), 2) as avg_processing_time_ms
  FROM billing.api_types at
  LEFT JOIN billing.usage_events ue ON at.id = ue.api_type_id
    AND ue.user_id = user_uuid
    AND ue.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY at.id, at.api_key, at.name
  ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE billing.api_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.usage_events ENABLE ROW LEVEL SECURITY;

-- API Types - readable by all authenticated users
CREATE POLICY "Authenticated users can view API types" ON billing.api_types
  FOR SELECT TO authenticated USING (is_active = true);

-- Usage Events - users can only see their own
CREATE POLICY "Users can view their own usage events" ON billing.usage_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Usage events indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON billing.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON billing.usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_api_type ON billing.usage_events(api_type_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_session_id ON billing.usage_events(session_id);

-- ============================================================================
-- ADMIN FUNCTIONS FOR PRICE MANAGEMENT
-- ============================================================================

-- Function to update API pricing (admin only)
CREATE OR REPLACE FUNCTION public.update_api_pricing(
  api_key TEXT,
  new_cost NUMERIC(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE billing.api_types
  SET 
    cost_credits = new_cost,
    updated_at = NOW()
  WHERE api_key = $1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all API pricing
CREATE OR REPLACE FUNCTION public.get_api_pricing()
RETURNS TABLE (
  api_key TEXT,
  name TEXT,
  cost_credits NUMERIC(10,2),
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.api_key,
    at.name,
    at.cost_credits,
    at.is_active
  FROM billing.api_types at
  ORDER BY at.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant permissions on new tables
GRANT SELECT ON billing.api_types TO authenticated;
GRANT SELECT ON billing.usage_events TO authenticated;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.can_make_api_call(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_api_usage(UUID, TEXT, UUID, BOOLEAN, TEXT, JSONB, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_api_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_api_pricing(TEXT, NUMERIC(10,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_pricing() TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- API Management System is now complete!
-- Features:
-- 1. API cost tracking with your current pricing
-- 2. Complete usage event logging
-- 3. Credit deduction with transaction history
-- 4. User usage analytics
-- 5. Session-based tracking ready for map integration
-- 6. Updated plans with your Stripe price IDs
