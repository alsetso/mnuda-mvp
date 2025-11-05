-- Fix contract_type default value issue
-- Remove the default value and set existing values to NULL where they were auto-populated
-- Also update CHECK constraint to allow NULL values

-- First, set all existing 'Right of Redemption' values to NULL
-- (assuming these were auto-populated and not intentionally set)
UPDATE properties
SET contract_type = NULL
WHERE contract_type = 'Right of Redemption';

-- Remove the DEFAULT constraint
ALTER TABLE properties
  ALTER COLUMN contract_type DROP DEFAULT;

-- Update CHECK constraint to allow NULL values
ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_contract_type_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_contract_type_check 
  CHECK (contract_type IS NULL OR contract_type = 'Right of Redemption');

