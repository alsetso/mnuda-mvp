-- Nuclear reset - drop all triggers and functions
-- Drop all triggers on pins table
DROP TRIGGER IF EXISTS set_pins_user_id ON pins;
DROP TRIGGER IF EXISTS update_pins_updated_at ON pins;

-- Drop all functions
DROP FUNCTION IF EXISTS set_user_id();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS test_pins_insert();
DROP FUNCTION IF EXISTS test_pins_auth();
DROP FUNCTION IF EXISTS test_read_pins();
DROP FUNCTION IF EXISTS check_rls_policies();

-- Drop all policies
DROP POLICY IF EXISTS "pins_select_policy" ON pins;
DROP POLICY IF EXISTS "pins_insert_policy" ON pins;
DROP POLICY IF EXISTS "pins_update_policy" ON pins;
DROP POLICY IF EXISTS "pins_delete_policy" ON pins;
DROP POLICY IF EXISTS "Users can view their own pins" ON pins;
DROP POLICY IF EXISTS "Users can insert pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;
DROP POLICY IF EXISTS "Allow authenticated users to insert pins" ON pins;
DROP POLICY IF EXISTS "Allow users to see their own pins" ON pins;
DROP POLICY IF EXISTS "Allow users to update their own pins" ON pins;
DROP POLICY IF EXISTS "Allow users to delete their own pins" ON pins;

-- Disable RLS completely
ALTER TABLE pins DISABLE ROW LEVEL SECURITY;

-- Now you can manually insert pins without any interference
