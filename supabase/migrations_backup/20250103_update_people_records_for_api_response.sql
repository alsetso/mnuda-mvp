-- Update people_records table to store all API response fields
-- Add fields from Skip Trace API response and raw_response JSONB field

ALTER TABLE people_records
  -- Add API response fields
  ADD COLUMN IF NOT EXISTS person_id TEXT,
  ADD COLUMN IF NOT EXISTS person_link TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS lives_in TEXT,
  ADD COLUMN IF NOT EXISTS used_to_live_in TEXT,
  ADD COLUMN IF NOT EXISTS related_to TEXT,
  
  -- Store complete raw API response as JSONB
  ADD COLUMN IF NOT EXISTS raw_response JSONB;

-- Create index on person_id for API lookups
CREATE INDEX IF NOT EXISTS idx_people_records_person_id ON people_records(person_id) WHERE person_id IS NOT NULL;

-- Create index on raw_response for JSON queries
CREATE INDEX IF NOT EXISTS idx_people_records_raw_response ON people_records USING GIN(raw_response);

-- Update comment
COMMENT ON TABLE people_records IS 'People records linked to properties, populated via Skip Trace API calls with full response data';
COMMENT ON COLUMN people_records.person_id IS 'External API person ID (from Skip Trace API)';
COMMENT ON COLUMN people_records.raw_response IS 'Complete raw API response for this person record, stored as JSONB';

