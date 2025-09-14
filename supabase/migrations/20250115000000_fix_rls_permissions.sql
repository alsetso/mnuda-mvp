-- Fix RLS permissions for pins table
-- Re-enable RLS and create proper policies

-- Re-enable Row Level Security
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
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

-- Create proper RLS policies
-- SELECT: Users can only see their own pins
CREATE POLICY "Users can view their own pins" ON pins
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Allow authenticated users to insert pins (trigger will set user_id)
CREATE POLICY "Users can insert pins" ON pins
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Users can only update their own pins
CREATE POLICY "Users can update their own pins" ON pins
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own pins
CREATE POLICY "Users can delete their own pins" ON pins
    FOR DELETE USING (auth.uid() = user_id);

-- Create the trigger function to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create pins';
    END IF;
    
    -- Set the user_id
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS set_pins_user_id ON pins;
CREATE TRIGGER set_pins_user_id
    BEFORE INSERT ON pins
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON pins TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
