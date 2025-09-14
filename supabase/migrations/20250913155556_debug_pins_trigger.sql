-- Debug and fix the user_id trigger
-- First, let's make sure the function is properly defined with SECURITY DEFINER
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

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS set_pins_user_id ON pins;
CREATE TRIGGER set_pins_user_id
    BEFORE INSERT ON pins
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Also, let's make sure the RLS policies are correct
-- Drop and recreate with more explicit policies
DROP POLICY IF EXISTS "Users can insert pins" ON pins;
CREATE POLICY "Users can insert pins" ON pins
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Test the trigger by creating a test function
CREATE OR REPLACE FUNCTION test_pins_insert()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- This will test if the trigger works
    INSERT INTO pins (name, lat, lng, full_address) 
    VALUES ('Test Pin', 44.9778, -93.2650, 'Test Address, Minneapolis, MN')
    RETURNING id::TEXT INTO result;
    
    RETURN 'Success: ' || result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ language 'plpgsql' SECURITY DEFINER;
