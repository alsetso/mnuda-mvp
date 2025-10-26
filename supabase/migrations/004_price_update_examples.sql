-- Price Update Examples - Easy API Cost Management
-- This file shows how to easily update API costs without affecting existing data

-- ============================================================================
-- CURRENT PRICING (All APIs at 0.75 credits)
-- ============================================================================

-- View current pricing
SELECT * FROM public.get_api_pricing();

-- ============================================================================
-- PRICE UPDATE EXAMPLES
-- ============================================================================

-- Example 1: Update a single API cost
-- UPDATE billing.api_types SET cost_credits = 1.25 WHERE api_key = 'zillow';

-- Example 2: Update multiple APIs at once
-- UPDATE billing.api_types 
-- SET cost_credits = 1.50, updated_at = NOW()
-- WHERE api_key IN ('name', 'email', 'phone');

-- Example 3: Use the admin function (recommended)
-- SELECT public.update_api_pricing('zillow', 1.25);
-- SELECT public.update_api_pricing('person-id', 2.00);

-- Example 4: Bulk update all APIs to same price
-- UPDATE billing.api_types 
-- SET cost_credits = 1.00, updated_at = NOW()
-- WHERE is_active = true;

-- ============================================================================
-- PRICING SCENARIOS
-- ============================================================================

-- Scenario 1: Premium pricing (higher costs for expensive APIs)
/*
UPDATE billing.api_types SET cost_credits = 0.50 WHERE api_key = 'address';
UPDATE billing.api_types SET cost_credits = 1.00 WHERE api_key = 'name';
UPDATE billing.api_types SET cost_credits = 1.00 WHERE api_key = 'email';
UPDATE billing.api_types SET cost_credits = 1.00 WHERE api_key = 'phone';
UPDATE billing.api_types SET cost_credits = 2.00 WHERE api_key = 'zillow';
UPDATE billing.api_types SET cost_credits = 4.00 WHERE api_key = 'person-id';
*/

-- Scenario 2: Simple pricing (all same cost)
/*
UPDATE billing.api_types SET cost_credits = 1.00 WHERE is_active = true;
*/

-- Scenario 3: Tiered pricing (cheap basic, expensive advanced)
/*
UPDATE billing.api_types SET cost_credits = 0.25 WHERE api_key IN ('address', 'name', 'email', 'phone');
UPDATE billing.api_types SET cost_credits = 1.50 WHERE api_key IN ('zillow', 'person-id');
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check current pricing
SELECT 
  api_key,
  name,
  cost_credits,
  is_active,
  updated_at
FROM billing.api_types 
ORDER BY cost_credits;

-- Check usage impact (how many users would be affected by price change)
SELECT 
  at.api_key,
  at.name,
  at.cost_credits,
  COUNT(ue.id) as total_usage_events,
  SUM(ue.credits_consumed) as total_credits_consumed
FROM billing.api_types at
LEFT JOIN billing.usage_events ue ON at.id = ue.api_type_id
GROUP BY at.id, at.api_key, at.name, at.cost_credits
ORDER BY total_usage_events DESC;

-- ============================================================================
-- NOTES
-- ============================================================================

-- ✅ All price updates are safe and don't affect existing data
-- ✅ Historical usage events keep their original cost_credits
-- ✅ Only new API calls will use the updated pricing
-- ✅ Credit balances and transactions remain accurate
-- ✅ No downtime required for price updates
-- ✅ Can update prices in real-time without affecting users
