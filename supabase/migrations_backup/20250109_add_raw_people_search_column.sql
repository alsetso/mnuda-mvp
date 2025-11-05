-- Add raw_people_search column to properties table
-- This stores the complete response from the Skip Trace API Get People call
ALTER TABLE properties ADD COLUMN IF NOT EXISTS raw_people_search JSONB;

-- Add index for queries that might filter on people search data
CREATE INDEX IF NOT EXISTS idx_properties_has_people_search ON properties(id) WHERE raw_people_search IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN properties.raw_people_search IS 'Complete raw response from Skip Trace API Get People search, stored as JSONB';

