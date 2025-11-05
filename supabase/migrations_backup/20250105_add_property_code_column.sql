-- Add code column to properties table for shareable links
ALTER TABLE properties ADD COLUMN IF NOT EXISTS code TEXT;

-- Create index for code lookups
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(code) WHERE code IS NOT NULL;

-- Grant service role necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE properties TO service_role;

