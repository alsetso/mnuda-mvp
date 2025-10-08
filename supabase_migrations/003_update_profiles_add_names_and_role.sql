-- Update profiles table to include separate first_name, last_name, and role columns
-- This migration adds the new columns and migrates existing data

-- Add new columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium', 'moderator'));

-- Migrate existing full_name data to first_name and last_name
-- This will split on the first space, putting everything after in last_name
UPDATE public.profiles 
SET 
    first_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN
            CASE 
                WHEN position(' ' in full_name) > 0 THEN 
                    substring(full_name from 1 for position(' ' in full_name) - 1)
                ELSE 
                    full_name
            END
        ELSE NULL
    END,
    last_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' AND position(' ' in full_name) > 0 THEN
            substring(full_name from position(' ' in full_name) + 1)
        ELSE NULL
    END
WHERE full_name IS NOT NULL;

-- Update the trigger function to handle the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add index on email for better query performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the updated_at trigger to work with the new columns
-- (The existing trigger should already work, but let's make sure)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
