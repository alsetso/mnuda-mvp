-- ================================================================
-- Migration: Fix Billing Schema Exposure to PostgREST API
-- Created: 2025-10-23
-- Purpose: Resolve 404 errors when querying billing tables from client
-- ================================================================

-- PART 1: GRANT SCHEMA-LEVEL PERMISSIONS
-- ================================================================
-- Allow authenticated and anon users to access the billing schema
-- This is CRITICAL for PostgREST to expose the schema in the API
GRANT USAGE ON SCHEMA billing TO anon, authenticated, service_role;

-- PART 2: GRANT TABLE-LEVEL PERMISSIONS
-- ================================================================

-- Plans table (read-only for all users)
-- Plans are public information that users need to see when selecting subscriptions
GRANT SELECT ON billing.plans TO authenticated, anon;

-- Subscriptions table (authenticated users can read/write their own)
-- Users need to view and manage their subscriptions
GRANT SELECT, INSERT, UPDATE ON billing.subscriptions TO authenticated;

-- Credit Balance table (authenticated users can read/write their own)
-- Users need to check their credit balance and the system needs to update it
GRANT SELECT, INSERT, UPDATE ON billing.credit_balance TO authenticated;

-- Credit Transactions table (authenticated users can read/insert their own)
-- Users need to view their transaction history
GRANT SELECT, INSERT ON billing.credit_transactions TO authenticated;

-- API Types table (read-only for authenticated users)
-- Users need to see what API types are available and their costs
GRANT SELECT ON billing.api_types TO authenticated, anon;

-- Usage Events table (authenticated users can read/insert their own)
-- Users need to view their usage history and the system needs to log events
GRANT SELECT, INSERT ON billing.usage_events TO authenticated;

-- PART 3: FIX RLS POLICIES WITH EXPLICIT ROLE ASSIGNMENT
-- ================================================================
-- The TO authenticated clause is REQUIRED for RLS policies to work properly
-- with the PostgREST API. Without it, the policies apply to all roles including
-- service_role, which can cause unexpected behavior.

-- Profiles table policies
-- ================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Credit Balance table policies
-- ================================================================
DROP POLICY IF EXISTS "credit_balance_select_policy" ON billing.credit_balance;
CREATE POLICY "credit_balance_select_policy" ON billing.credit_balance
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_balance_insert_policy" ON billing.credit_balance;
CREATE POLICY "credit_balance_insert_policy" ON billing.credit_balance
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_balance_update_policy" ON billing.credit_balance;
CREATE POLICY "credit_balance_update_policy" ON billing.credit_balance
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions table policies
-- ================================================================
DROP POLICY IF EXISTS "subscriptions_select_policy" ON billing.subscriptions;
CREATE POLICY "subscriptions_select_policy" ON billing.subscriptions
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_policy" ON billing.subscriptions;
CREATE POLICY "subscriptions_insert_policy" ON billing.subscriptions
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_policy" ON billing.subscriptions;
CREATE POLICY "subscriptions_update_policy" ON billing.subscriptions
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usage Events table policies
-- ================================================================
DROP POLICY IF EXISTS "usage_events_select_policy" ON billing.usage_events;
CREATE POLICY "usage_events_select_policy" ON billing.usage_events
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_events_insert_policy" ON billing.usage_events;
CREATE POLICY "usage_events_insert_policy" ON billing.usage_events
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Credit Transactions table policies
-- ================================================================
DROP POLICY IF EXISTS "credit_transactions_select_policy" ON billing.credit_transactions;
CREATE POLICY "credit_transactions_select_policy" ON billing.credit_transactions
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_transactions_insert_policy" ON billing.credit_transactions;
CREATE POLICY "credit_transactions_insert_policy" ON billing.credit_transactions
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Plans table policies (read-only for all)
-- ================================================================
DROP POLICY IF EXISTS "plans_select_policy" ON billing.plans;
CREATE POLICY "plans_select_policy" ON billing.plans
  FOR SELECT 
  TO authenticated, anon
  USING (is_active = true);

-- API Types table policies (read-only for all)
-- ================================================================
DROP POLICY IF EXISTS "api_types_select_policy" ON billing.api_types;
CREATE POLICY "api_types_select_policy" ON billing.api_types
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- PART 4: NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
-- ================================================================
-- PostgREST maintains a cache of the database schema. When we change
-- permissions or add new schemas, we need to tell PostgREST to reload.
-- Both methods are included for compatibility with different Supabase versions.

-- Method 1: NOTIFY command
NOTIFY pgrst, 'reload schema';

-- Method 2: pg_notify function
SELECT pg_notify('pgrst', 'reload schema');

-- PART 5: VERIFICATION QUERIES (Optional - for manual testing)
-- ================================================================
-- Uncomment these to verify the changes manually in Supabase SQL Editor

-- -- Check that billing schema is accessible
-- SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'billing';

-- -- Check table permissions
-- SELECT 
--   grantee, 
--   table_schema, 
--   table_name, 
--   privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'billing' 
-- ORDER BY table_name, grantee, privilege_type;

-- -- Check RLS policies
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE schemaname IN ('billing', 'public')
-- ORDER BY schemaname, tablename, policyname;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- After running this migration, you MUST also:
-- 1. Go to Supabase Dashboard → Settings → API → Exposed schemas
-- 2. Add 'billing' to the list (should be: public, billing)
-- 3. Save changes
-- 4. Optionally restart the PostgREST service
-- ================================================================

