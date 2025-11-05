-- Create pins table for managing member pins on the map
-- Members can create pins with emoji, name, visibility, description, address, and coordinates

CREATE TYPE public.pin_visibility AS ENUM ('public', 'private');

CREATE TABLE IF NOT EXISTS public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  visibility public.pin_visibility NOT NULL DEFAULT 'public'::public.pin_visibility,
  description TEXT,
  address TEXT NOT NULL,
  lat NUMERIC(10, 8) NOT NULL,
  long NUMERIC(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON public.pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_visibility ON public.pins(visibility);
CREATE INDEX IF NOT EXISTS idx_pins_coordinates ON public.pins(lat, long);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_pins_updated_at 
    BEFORE UPDATE ON public.pins 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;

-- Enable RLS
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Members can view public pins OR their own pins
CREATE POLICY "Members can view public pins or own pins"
  ON public.pins
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'::public.pin_visibility OR 
    auth.uid() = user_id
  );

-- Members can insert their own pins
CREATE POLICY "Members can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Members can update their own pins
CREATE POLICY "Members can update own pins"
  ON public.pins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Members can delete their own pins
CREATE POLICY "Members can delete own pins"
  ON public.pins
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

