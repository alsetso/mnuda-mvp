-- Add text message support to call_logs table
-- Allows tracking both phone calls and text messages in the same table

-- Add communication_type column to distinguish between calls and text messages
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS communication_type TEXT;

-- Set default value for existing and new rows
UPDATE call_logs 
SET communication_type = 'call' 
WHERE communication_type IS NULL;

-- Add default and constraint
ALTER TABLE call_logs 
ALTER COLUMN communication_type SET DEFAULT 'call';

-- Add check constraint (drop first if exists)
ALTER TABLE call_logs 
DROP CONSTRAINT IF EXISTS call_logs_communication_type_check;

ALTER TABLE call_logs 
ADD CONSTRAINT call_logs_communication_type_check 
CHECK (communication_type IN ('call', 'text'));

-- Make it NOT NULL after ensuring all rows have a value
ALTER TABLE call_logs 
ALTER COLUMN communication_type SET NOT NULL;

-- Add text_message field for storing the text message content
ALTER TABLE call_logs
ADD COLUMN IF NOT EXISTS text_message TEXT;

-- Update comment for call_logs table
COMMENT ON COLUMN call_logs.communication_type IS 'Type of communication: call or text message';
COMMENT ON COLUMN call_logs.text_message IS 'Text message content (only populated for communication_type = text)';
COMMENT ON COLUMN call_logs.call_duration IS 'Call duration in seconds (only for communication_type = call)';
COMMENT ON COLUMN call_logs.call_outcome IS 'Call outcome: connected, voicemail, no_answer, busy, wrong_number (only for communication_type = call)';

-- Update existing comments
COMMENT ON TABLE call_logs IS 'Activity logs for tracking phone calls and text messages';

