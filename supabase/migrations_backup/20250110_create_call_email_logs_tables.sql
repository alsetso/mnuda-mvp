-- Create call_logs and email_logs tables for simplified activity tracking
-- These tables reference phone_numbers and email_addresses directly

-- Create call_logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Call details
  direction TEXT CHECK (direction IN ('outbound', 'inbound')) NOT NULL,
  call_duration INTEGER, -- Duration in seconds
  call_outcome TEXT CHECK (call_outcome IN ('connected', 'voicemail', 'no_answer', 'busy', 'wrong_number')),
  
  -- Outcome and notes
  outcome TEXT CHECK (outcome IN ('interested', 'not_interested', 'follow_up_needed', 'do_not_contact', 'callback_requested', 'information_provided', 'no_response', 'other')),
  notes TEXT,
  follow_up_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_address_id UUID REFERENCES email_addresses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Email details
  direction TEXT CHECK (direction IN ('outbound', 'inbound')) NOT NULL,
  subject TEXT,
  email_body TEXT,
  email_status TEXT CHECK (email_status IN ('sent', 'opened', 'clicked', 'bounced', 'replied')),
  
  -- Outcome and notes
  outcome TEXT CHECK (outcome IN ('interested', 'not_interested', 'follow_up_needed', 'do_not_contact', 'callback_requested', 'information_provided', 'no_response', 'other')),
  notes TEXT,
  follow_up_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_people_record_id ON call_logs(people_record_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_workspace_id ON call_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number_id ON call_logs(phone_number_id) WHERE phone_number_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_created_by ON call_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_follow_up_date ON call_logs(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Create indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_people_record_id ON email_logs(people_record_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_workspace_id ON email_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_address_id ON email_logs(email_address_id) WHERE email_address_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_created_by ON email_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_follow_up_date ON email_logs(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Create updated_at triggers
CREATE TRIGGER update_call_logs_updated_at 
    BEFORE UPDATE ON call_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at 
    BEFORE UPDATE ON email_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_logs
CREATE POLICY "Users can view call logs from their workspaces" ON call_logs
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert call logs in their workspaces" ON call_logs
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update call logs in their workspaces" ON call_logs
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete call logs in their workspaces" ON call_logs
    FOR DELETE USING (public.is_member(workspace_id));

-- RLS policies for email_logs
CREATE POLICY "Users can view email logs from their workspaces" ON email_logs
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert email logs in their workspaces" ON email_logs
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update email logs in their workspaces" ON email_logs
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete email logs in their workspaces" ON email_logs
    FOR DELETE USING (public.is_member(workspace_id));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON call_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_logs TO authenticated;

-- Add comments
COMMENT ON TABLE call_logs IS 'Simplified call activity logs for tracking phone interactions';
COMMENT ON TABLE email_logs IS 'Simplified email activity logs for tracking email interactions';
COMMENT ON COLUMN call_logs.phone_number_id IS 'Reference to phone_numbers table for tracking which number was called';
COMMENT ON COLUMN email_logs.email_address_id IS 'Reference to email_addresses table for tracking which email was used';

