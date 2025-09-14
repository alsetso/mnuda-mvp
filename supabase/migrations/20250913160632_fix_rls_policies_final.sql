-- Fix RLS policies to work correctly with authenticated users
-- The issue is likely that the INSERT policy is too restrictive

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own pins" ON pins;
DROP POLICY IF EXISTS "Users can insert pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;

-- Create simplified, working RLS policies
-- For SELECT: users can only see their own pins
CREATE POLICY "pins_select_policy" ON pins
    FOR SELECT USING (auth.uid() = user_id);

-- For INSERT: allow authenticated users to insert, trigger will set user_id
CREATE POLICY "pins_insert_policy" ON pins
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- For UPDATE: users can only update their own pins
CREATE POLICY "pins_update_policy" ON pins
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- For DELETE: users can only delete their own pins
CREATE POLICY "pins_delete_policy" ON pins
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure the trigger function is robust
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug logging
    RAISE LOG 'set_user_id trigger called, auth.uid() = %', auth.uid();
    
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create pins';
    END IF;
    
    -- Set the user_id
    NEW.user_id = auth.uid();
    RAISE LOG 'set_user_id trigger set user_id to %', NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_pins_user_id ON pins;
CREATE TRIGGER set_pins_user_id
    BEFORE INSERT ON pins
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Test function to verify everything works
CREATE OR REPLACE FUNCTION test_pins_auth()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- This will test if the trigger and RLS work together
    INSERT INTO pins (name, lat, lng, full_address) 
    VALUES ('Test Pin', 44.9778, -93.2650, 'Test Address, Minneapolis, MN')
    RETURNING id::TEXT INTO result;
    
    RETURN 'Success: ' || result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ language 'plpgsql' SECURITY DEFINER;
