-- Simple, working RLS policies for pins table
-- Drop all existing policies
DROP POLICY IF EXISTS "pins_select_policy" ON pins;
DROP POLICY IF EXISTS "pins_insert_policy" ON pins;
DROP POLICY IF EXISTS "pins_update_policy" ON pins;
DROP POLICY IF EXISTS "pins_delete_policy" ON pins;
DROP POLICY IF EXISTS "Users can view their own pins" ON pins;
DROP POLICY IF EXISTS "Users can insert pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;

-- Create simple, working policies
-- Allow authenticated users to insert pins (trigger sets user_id)
CREATE POLICY "Allow authenticated users to insert pins" ON pins
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to see their own pins
CREATE POLICY "Allow users to see their own pins" ON pins
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own pins
CREATE POLICY "Allow users to update their own pins" ON pins
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own pins
CREATE POLICY "Allow users to delete their own pins" ON pins
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure the trigger function is simple and working
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_pins_user_id ON pins;
CREATE TRIGGER set_pins_user_id
    BEFORE INSERT ON pins
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();
