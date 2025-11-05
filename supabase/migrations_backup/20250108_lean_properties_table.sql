-- Lean out properties table: remove unused deal management columns and add foreclosure auction fields
-- This migration removes columns that don't match the foreclosure auction data collection needs

-- Drop indexes for columns being removed
DROP INDEX IF EXISTS idx_properties_deal_status;
DROP INDEX IF EXISTS idx_properties_opportunity_type;
DROP INDEX IF EXISTS idx_properties_assigned_to;
DROP INDEX IF EXISTS idx_properties_contract_date;
DROP INDEX IF EXISTS idx_properties_closing_date;
DROP INDEX IF EXISTS idx_properties_expires_date;
DROP INDEX IF EXISTS idx_properties_next_action_date;

-- Remove deal management columns
ALTER TABLE properties
  DROP COLUMN IF EXISTS deal_status,
  DROP COLUMN IF EXISTS opportunity_type,
  DROP COLUMN IF EXISTS property_value,
  DROP COLUMN IF EXISTS loan_amount,
  DROP COLUMN IF EXISTS repair_cost,
  DROP COLUMN IF EXISTS opportunity_value,
  DROP COLUMN IF EXISTS estimated_contract_value,
  DROP COLUMN IF EXISTS contract_price,
  DROP COLUMN IF EXISTS after_repair_value,
  DROP COLUMN IF EXISTS earnest_money_deposit,
  DROP COLUMN IF EXISTS commission_amount,
  DROP COLUMN IF EXISTS commission_percentage,
  DROP COLUMN IF EXISTS assignment_fee,
  DROP COLUMN IF EXISTS assignment_fee_percentage,
  DROP COLUMN IF EXISTS foreclosure_notice_date,
  DROP COLUMN IF EXISTS contract_date,
  DROP COLUMN IF EXISTS closing_date,
  DROP COLUMN IF EXISTS expires_date,
  DROP COLUMN IF EXISTS commission_paid_date,
  DROP COLUMN IF EXISTS next_action_date,
  DROP COLUMN IF EXISTS contract_number,
  DROP COLUMN IF EXISTS buyer_name,
  DROP COLUMN IF EXISTS buyer_contact,
  DROP COLUMN IF EXISTS seller_name,
  DROP COLUMN IF EXISTS end_buyer_name,
  DROP COLUMN IF EXISTS assigned_to,
  DROP COLUMN IF EXISTS deal_source,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS deal_notes;

-- Add foreclosure auction fields based on actual data collection needs
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS sale_record_number TEXT,
  ADD COLUMN IF NOT EXISTS mortgage_document_number TEXT,
  ADD COLUMN IF NOT EXISTS date_of_sale DATE,
  ADD COLUMN IF NOT EXISTS type_of_sale TEXT,
  ADD COLUMN IF NOT EXISTS mortgagors TEXT,
  ADD COLUMN IF NOT EXISTS mortgagee TEXT,
  ADD COLUMN IF NOT EXISTS to_whom_sold TEXT,
  ADD COLUMN IF NOT EXISTS final_bid_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS redemption_expiration_date DATE,
  ADD COLUMN IF NOT EXISTS law_firm_attorney TEXT,
  ADD COLUMN IF NOT EXISTS unverified_common_address TEXT,
  ADD COLUMN IF NOT EXISTS comments TEXT;

-- Create indexes for new fields that will be queried
CREATE INDEX IF NOT EXISTS idx_properties_sale_record_number ON properties(sale_record_number) WHERE sale_record_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_mortgage_document_number ON properties(mortgage_document_number) WHERE mortgage_document_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_date_of_sale ON properties(date_of_sale) WHERE date_of_sale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_redemption_expiration_date ON properties(redemption_expiration_date) WHERE redemption_expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_type_of_sale ON properties(type_of_sale) WHERE type_of_sale IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN properties.sale_record_number IS 'Sale record number from foreclosure auction';
COMMENT ON COLUMN properties.mortgage_document_number IS 'Mortgage document number';
COMMENT ON COLUMN properties.date_of_sale IS 'Date of sale/auction';
COMMENT ON COLUMN properties.type_of_sale IS 'Type of sale (e.g., Mortgage, Tax Sale, etc.)';
COMMENT ON COLUMN properties.mortgagors IS 'Mortgagor names (property owners)';
COMMENT ON COLUMN properties.mortgagee IS 'Mortgagee/lender name';
COMMENT ON COLUMN properties.to_whom_sold IS 'Buyer/purchaser name from auction';
COMMENT ON COLUMN properties.final_bid_amount IS 'Final bid amount at auction';
COMMENT ON COLUMN properties.redemption_expiration_date IS 'Redemption period expiration date';
COMMENT ON COLUMN properties.law_firm_attorney IS 'Law firm or attorney handling the foreclosure';
COMMENT ON COLUMN properties.unverified_common_address IS 'Unverified common address from source data';
COMMENT ON COLUMN properties.comments IS 'Optional comments/notes';

-- Update contract_type constraint if it still exists (keep it but allow more values)
DO $$
BEGIN
  -- Check if contract_type column exists and update its constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'contract_type'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_contract_type_check;
    -- Add new constraint allowing more values or make it nullable text
    ALTER TABLE properties ALTER COLUMN contract_type TYPE TEXT;
  END IF;
END $$;

