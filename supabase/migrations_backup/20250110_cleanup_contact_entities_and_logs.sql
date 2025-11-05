-- Clean up old contact_entities and contact_logs tables
-- These are being replaced by separate phone_numbers and email_addresses tables
-- Contact logs will be recreated later with proper foreign keys to the new tables

-- Drop the unified view if it exists
DROP VIEW IF EXISTS contact_entities_unified CASCADE;

-- Drop contact_logs table and all its dependencies
DROP TABLE IF EXISTS contact_logs CASCADE;

-- Drop contact_entities table and all its dependencies
DROP TABLE IF EXISTS contact_entities CASCADE;

-- Note: CASCADE will automatically drop:
-- - All indexes on these tables
-- - All triggers on these tables
-- - All RLS policies on these tables
-- - All foreign key constraints referencing these tables
-- - All views depending on these tables

