-- Add contact_phone and contact_email columns to contact_logs table
-- Run this if you already ran the initial contact_logs migration

ALTER TABLE contact_logs
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add comments for documentation
COMMENT ON COLUMN contact_logs.contact_phone IS 'Phone number that was called (for tracking which number from skip trace was used)';
COMMENT ON COLUMN contact_logs.contact_email IS 'Email address that was contacted (for tracking which email from skip trace was used)';
