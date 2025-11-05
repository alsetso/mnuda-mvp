-- Add deal management fields to properties table
-- These fields support the full lifecycle of foreclosure property deals

-- Deal Status & Type
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deal_status TEXT CHECK (deal_status IN (
    'identified', 'contacted', 'negotiating', 'under_contract', 'closing', 
    'closed', 'commission_paid', 'expired', 'cancelled', 'lost'
  )),
  ADD COLUMN IF NOT EXISTS opportunity_type TEXT CHECK (opportunity_type IN (
    'fix_and_flip', 'assignment', 'buy_to_own'
  )),
  ADD COLUMN IF NOT EXISTS contract_type TEXT CHECK (contract_type IS NULL OR contract_type = 'Right of Redemption');

-- Financial Fields
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_value DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS opportunity_value DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS estimated_contract_value DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS contract_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS after_repair_value DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS earnest_money_deposit DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS assignment_fee DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS assignment_fee_percentage DECIMAL(5, 2);

-- Important Dates
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS foreclosure_notice_date DATE,
  ADD COLUMN IF NOT EXISTS contract_date DATE,
  ADD COLUMN IF NOT EXISTS closing_date DATE,
  ADD COLUMN IF NOT EXISTS expires_date DATE,
  ADD COLUMN IF NOT EXISTS commission_paid_date DATE,
  ADD COLUMN IF NOT EXISTS next_action_date DATE;

-- Contract & Party Details
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS contract_number TEXT,
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_contact TEXT,
  ADD COLUMN IF NOT EXISTS seller_name TEXT,
  ADD COLUMN IF NOT EXISTS end_buyer_name TEXT;

-- Team & Tracking
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_source TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS deal_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_deal_status ON properties(deal_status);
CREATE INDEX IF NOT EXISTS idx_properties_opportunity_type ON properties(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_to ON properties(assigned_to);
CREATE INDEX IF NOT EXISTS idx_properties_contract_date ON properties(contract_date);
CREATE INDEX IF NOT EXISTS idx_properties_closing_date ON properties(closing_date);
CREATE INDEX IF NOT EXISTS idx_properties_expires_date ON properties(expires_date);
CREATE INDEX IF NOT EXISTS idx_properties_next_action_date ON properties(next_action_date);

-- Add comments for documentation
COMMENT ON COLUMN properties.deal_status IS 'Current stage of the deal lifecycle';
COMMENT ON COLUMN properties.opportunity_type IS 'Type of opportunity: fix_and_flip, assignment, or buy_to_own';
COMMENT ON COLUMN properties.contract_type IS 'Type of contract (currently only Right of Redemption)';
COMMENT ON COLUMN properties.property_value IS 'Current estimated property value';
COMMENT ON COLUMN properties.loan_amount IS 'Outstanding loan amount';
COMMENT ON COLUMN properties.repair_cost IS 'Estimated repair costs';
COMMENT ON COLUMN properties.opportunity_value IS 'Calculated opportunity value';
COMMENT ON COLUMN properties.estimated_contract_value IS 'Estimated contract value';
COMMENT ON COLUMN properties.contract_price IS 'Actual contract price';
COMMENT ON COLUMN properties.after_repair_value IS 'Estimated value after repairs (ARV)';
COMMENT ON COLUMN properties.earnest_money_deposit IS 'Earnest money deposit amount';
COMMENT ON COLUMN properties.commission_amount IS 'Actual commission amount earned';
COMMENT ON COLUMN properties.commission_percentage IS 'Commission percentage rate';
COMMENT ON COLUMN properties.assignment_fee IS 'Assignment fee amount';
COMMENT ON COLUMN properties.assignment_fee_percentage IS 'Assignment fee as percentage';
COMMENT ON COLUMN properties.foreclosure_notice_date IS 'Date foreclosure was filed';
COMMENT ON COLUMN properties.contract_date IS 'Date contract was signed';
COMMENT ON COLUMN properties.closing_date IS 'Actual closing date';
COMMENT ON COLUMN properties.expires_date IS 'Contract expiration date';
COMMENT ON COLUMN properties.commission_paid_date IS 'Date commission was received';
COMMENT ON COLUMN properties.next_action_date IS 'Next action/follow-up date';
COMMENT ON COLUMN properties.contract_number IS 'Contract reference number';
COMMENT ON COLUMN properties.buyer_name IS 'Buyer name (for assignment/buy to own)';
COMMENT ON COLUMN properties.buyer_contact IS 'Buyer contact information';
COMMENT ON COLUMN properties.seller_name IS 'Property owner/seller name';
COMMENT ON COLUMN properties.end_buyer_name IS 'Final buyer name (for assignment deals)';
COMMENT ON COLUMN properties.assigned_to IS 'Team member assigned to manage this deal';
COMMENT ON COLUMN properties.deal_source IS 'Source/referral source of the deal';
COMMENT ON COLUMN properties.next_action IS 'Description of next action required';
COMMENT ON COLUMN properties.deal_notes IS 'Notes specific to the deal management';

