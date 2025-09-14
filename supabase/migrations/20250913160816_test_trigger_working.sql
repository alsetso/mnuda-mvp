-- Test and verify the trigger is working correctly
-- This will help us debug the RLS issue

-- Create a test function that simulates what happens when a user tries to insert
CREATE OR REPLACE FUNCTION test_pin_insert()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    test_id UUID;
BEGIN
    -- This simulates what happens when the frontend tries to insert
    -- The trigger should automatically set the user_id
    
    -- First, let's check if we have a valid auth context
    IF auth.uid() IS NULL THEN
        RETURN 'Error: No authenticated user (auth.uid() is NULL)';
    END IF;
    
    -- Try to insert a test pin
    INSERT INTO pins (name, lat, lng, full_address) 
    VALUES ('Test Pin from Function', 44.9778, -93.2650, 'Test Address, Minneapolis, MN')
    RETURNING id INTO test_id;
    
    -- Check if the user_id was set correctly
    SELECT user_id::TEXT INTO result FROM pins WHERE id = test_id;
    
    -- Clean up the test record
    DELETE FROM pins WHERE id = test_id;
    
    RETURN 'Success: user_id set to ' || result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Also create a function to check RLS policies
CREATE OR REPLACE FUNCTION check_rls_policies()
RETURNS TABLE(policy_name TEXT, policy_cmd TEXT, policy_qual TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.policyname::TEXT,
        p.cmd::TEXT,
        p.qual::TEXT
    FROM pg_policies p
    WHERE p.tablename = 'pins'
    ORDER BY p.policyname;
END;
$$ language 'plpgsql' SECURITY DEFINER;
