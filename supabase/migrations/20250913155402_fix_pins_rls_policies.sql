-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own pins" ON pins;
DROP POLICY IF EXISTS "Users can insert their own pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;

-- Create corrected RLS policies
-- For SELECT: users can only see their own pins
CREATE POLICY "Users can view their own pins" ON pins
    FOR SELECT USING (auth.uid() = user_id);

-- For INSERT: users can insert pins, and user_id will be set automatically
-- We need to allow the insert and then set user_id via trigger or default
CREATE POLICY "Users can insert pins" ON pins
    FOR INSERT WITH CHECK (true);

-- For UPDATE: users can only update their own pins
CREATE POLICY "Users can update their own pins" ON pins
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- For DELETE: users can only delete their own pins
CREATE POLICY "Users can delete their own pins" ON pins
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to automatically set user_id on insert
CREATE TRIGGER set_pins_user_id
    BEFORE INSERT ON pins
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();
