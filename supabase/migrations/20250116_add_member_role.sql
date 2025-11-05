-- Add role to members table
-- Creates enum type and adds role column with default value

-- Create role enum type
CREATE TYPE public.member_role AS ENUM ('general', 'investor', 'admin');

-- Add role column to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS role public.member_role NOT NULL DEFAULT 'general';

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_members_role ON public.members(role);

-- Update handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'general'::public.member_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

