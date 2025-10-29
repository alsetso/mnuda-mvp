-- Add column to store raw Skip Trace person detail response

ALTER TABLE people_records
  ADD COLUMN IF NOT EXISTS raw_skip_trace_response JSONB;

-- GIN index to speed up JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_people_records_raw_skip_trace_response
  ON people_records USING GIN (raw_skip_trace_response);

COMMENT ON COLUMN people_records.raw_skip_trace_response IS 'Full raw response from Skip Trace person-details API';


