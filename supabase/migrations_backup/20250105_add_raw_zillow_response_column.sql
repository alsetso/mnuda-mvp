-- Add raw_zillow_response column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS raw_zillow_response JSONB;

-- Add index for queries that might filter on zillow data
CREATE INDEX IF NOT EXISTS idx_properties_has_zillow_data ON properties(id) WHERE raw_zillow_response IS NOT NULL;

