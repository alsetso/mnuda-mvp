-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  lat DECIMAL(10, 8) NOT NULL CHECK (lat >= -90 AND lat <= 90),
  lng DECIMAL(11, 8) NOT NULL CHECK (lng >= -180 AND lng <= 180),
  full_address TEXT NOT NULL CHECK (length(full_address) >= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_created_at ON pins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pins_location ON pins(lat, lng);
CREATE INDEX IF NOT EXISTS idx_pins_name ON pins USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_pins_address ON pins USING gin(to_tsvector('english', full_address));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pins_updated_at 
    BEFORE UPDATE ON pins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own pins
CREATE POLICY "Users can view their own pins" ON pins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pins" ON pins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins" ON pins
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins" ON pins
    FOR DELETE USING (auth.uid() = user_id);
