-- Create members table
-- Extends auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identity
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT NOT NULL, -- Denormalized from auth.users for easier queries
  
  -- Professional
  company TEXT,
  job_title TEXT,
  
  -- Additional
  bio TEXT,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_username ON public.members(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON public.members 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create member record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create member when user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own member record
CREATE POLICY "Users can view own member record"
  ON public.members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own member record
CREATE POLICY "Users can update own member record"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own member record (for manual creation if needed)
CREATE POLICY "Users can insert own member record"
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: Users cannot delete their own member record (handled by CASCADE on auth.users deletion)

