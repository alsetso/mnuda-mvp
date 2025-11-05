-- Migration to split contact_entities into separate phone_numbers and email_addresses tables
-- This provides better type-specific fields and constraints for automation features

-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Phone number (normalized format, e.g., E.164)
  phone_number TEXT NOT NULL,
  
  -- Type and classification
  phone_type TEXT CHECK (phone_type IN ('mobile', 'landline', 'voip', 'toll_free', 'wireless', 'other')),
  
  -- Provider information
  carrier TEXT, -- Carrier name (e.g., "Verizon", "AT&T")
  provider TEXT, -- Data provider (e.g., skip trace source)
  
  -- Location and capabilities
  country_code TEXT,
  timezone TEXT, -- For optimal calling times
  is_sms_capable BOOLEAN DEFAULT true,
  
  -- Compliance and status
  is_dnc BOOLEAN DEFAULT false, -- Do Not Call list
  verification_status TEXT CHECK (verification_status IN ('verified', 'unverified', 'invalid', 'pending')) DEFAULT 'unverified',
  
  -- Source tracking
  source TEXT CHECK (source IN ('skip_trace', 'manual', 'main_record')) DEFAULT 'manual',
  last_reported TEXT, -- Last time reported in skip trace
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_addresses table
CREATE TABLE IF NOT EXISTS email_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Email address (normalized lowercase)
  email TEXT NOT NULL,
  
  -- Type classification
  email_type TEXT CHECK (email_type IN ('personal', 'work', 'disposable', 'other')),
  
  -- Domain and provider info
  domain TEXT, -- Extracted domain (e.g., "gmail.com")
  provider TEXT, -- Email provider (e.g., "Gmail", "Outlook")
  
  -- Verification and deliverability
  verification_status TEXT CHECK (verification_status IN ('verified', 'unverified', 'bounced', 'invalid', 'pending')) DEFAULT 'unverified',
  bounce_count INTEGER DEFAULT 0,
  last_bounced_at TIMESTAMP WITH TIME ZONE,
  deliverability_score DECIMAL(5, 2), -- 0-100 score
  
  -- Source tracking
  source TEXT CHECK (source IN ('skip_trace', 'manual', 'main_record')) DEFAULT 'manual',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for phone_numbers
CREATE INDEX IF NOT EXISTS idx_phone_numbers_people_record_id ON phone_numbers(people_record_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_workspace_id ON phone_numbers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_is_active ON phone_numbers(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_numbers_unique ON phone_numbers(people_record_id, phone_number);

-- Create indexes for email_addresses
CREATE INDEX IF NOT EXISTS idx_email_addresses_people_record_id ON email_addresses(people_record_id);
CREATE INDEX IF NOT EXISTS idx_email_addresses_workspace_id ON email_addresses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_addresses_email ON email_addresses(email);
CREATE INDEX IF NOT EXISTS idx_email_addresses_domain ON email_addresses(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_addresses_is_active ON email_addresses(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_addresses_unique ON email_addresses(people_record_id, email);

-- Create updated_at triggers
CREATE TRIGGER update_phone_numbers_updated_at 
    BEFORE UPDATE ON phone_numbers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_addresses_updated_at 
    BEFORE UPDATE ON email_addresses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for phone_numbers
CREATE POLICY "Users can view phone numbers from their workspaces" ON phone_numbers
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert phone numbers in their workspaces" ON phone_numbers
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update phone numbers in their workspaces" ON phone_numbers
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete phone numbers in their workspaces" ON phone_numbers
    FOR DELETE USING (public.is_member(workspace_id));

-- RLS policies for email_addresses
CREATE POLICY "Users can view email addresses from their workspaces" ON email_addresses
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert email addresses in their workspaces" ON email_addresses
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update email addresses in their workspaces" ON email_addresses
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete email addresses in their workspaces" ON email_addresses
    FOR DELETE USING (public.is_member(workspace_id));

-- Add comments
COMMENT ON TABLE phone_numbers IS 'Phone numbers for people records with automation-ready fields';
COMMENT ON TABLE email_addresses IS 'Email addresses for people records with automation-ready fields';
COMMENT ON COLUMN phone_numbers.is_sms_capable IS 'Whether this phone number can receive SMS messages';
COMMENT ON COLUMN phone_numbers.is_dnc IS 'Whether this number is on Do Not Call list';
COMMENT ON COLUMN phone_numbers.verification_status IS 'Verification status: verified, unverified, invalid, pending';
COMMENT ON COLUMN email_addresses.verification_status IS 'Verification status: verified, unverified, bounced, invalid, pending';
COMMENT ON COLUMN email_addresses.deliverability_score IS 'Email deliverability score (0-100) based on domain reputation and history';

-- Note: Auto-migration removed. If you need to migrate from contact_entities,
-- you'll need to manually map phone_type values (e.g., 'Wireless' -> 'wireless' or 'mobile')

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON phone_numbers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_addresses TO authenticated;

-- Helper function to normalize phone_type (handles capitalization from skip trace APIs)
CREATE OR REPLACE FUNCTION normalize_phone_type(phone_type_input TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  IF phone_type_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  normalized := LOWER(TRIM(phone_type_input));
  
  -- First check if it's already a valid value (case-insensitive match)
  IF normalized IN ('mobile', 'landline', 'voip', 'toll_free', 'wireless', 'other') THEN
    RETURN normalized;
  END IF;
  
  -- Map common variations to standard values
  IF normalized IN ('cell', 'cellular', 'cellphone') THEN
    RETURN 'mobile';
  ELSIF normalized IN ('home', 'fixed') THEN
    RETURN 'landline';
  ELSIF normalized IN ('internet', 'voice over ip') THEN
    RETURN 'voip';
  ELSIF normalized IN ('toll free', '1-800', '1800', 'tollfree') THEN
    RETURN 'toll_free';
  ELSE
    -- Unknown value, default to 'other'
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to extract domain from email
CREATE OR REPLACE FUNCTION extract_email_domain(email_address TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email_address, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate domain and extract provider from email
CREATE OR REPLACE FUNCTION set_email_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract domain
  NEW.domain := extract_email_domain(NEW.email);
  
  -- Extract provider (simple mapping)
  IF NEW.domain LIKE '%gmail%' THEN
    NEW.provider := 'Gmail';
  ELSIF NEW.domain LIKE '%outlook%' OR NEW.domain LIKE '%hotmail%' OR NEW.domain LIKE '%live%' THEN
    NEW.provider := 'Outlook';
  ELSIF NEW.domain LIKE '%yahoo%' THEN
    NEW.provider := 'Yahoo';
  ELSIF NEW.domain LIKE '%icloud%' OR NEW.domain LIKE '%me.com%' THEN
    NEW.provider := 'iCloud';
  ELSE
    NEW.provider := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_email_metadata_trigger
  BEFORE INSERT OR UPDATE OF email ON email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION set_email_metadata();

-- Trigger to normalize phone_type on insert/update
CREATE OR REPLACE FUNCTION normalize_phone_type_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_type := normalize_phone_type(NEW.phone_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_phone_type_trigger
  BEFORE INSERT OR UPDATE OF phone_type ON phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_phone_type_trigger();

