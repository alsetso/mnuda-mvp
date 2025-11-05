-- Create contact_logs table for tracking team actions on people records
-- Supports calls, emails, notes, meetings, and other interaction types

CREATE TABLE IF NOT EXISTS contact_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  people_record_id UUID NOT NULL REFERENCES people_records(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Action type and timestamp
  action_type TEXT NOT NULL CHECK (action_type IN ('call', 'email', 'note', 'meeting', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Direction (applies to calls and emails)
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  
  -- Contact information (which phone/email was used)
  contact_phone TEXT, -- Phone number that was called (for calls)
  contact_email TEXT, -- Email address that was contacted (for emails)
  
  -- Call-specific fields (only populated for action_type = 'call')
  call_duration INTEGER, -- Duration in seconds
  call_outcome TEXT CHECK (call_outcome IN ('connected', 'voicemail', 'no_answer', 'busy', 'wrong_number')),
  
  -- Email-specific fields (only populated for action_type = 'email')
  email_subject TEXT,
  email_body TEXT,
  email_status TEXT CHECK (email_status IN ('sent', 'opened', 'clicked', 'bounced', 'replied')),
  email_template_id TEXT, -- Optional template reference
  
  -- General fields
  notes TEXT, -- General notes field for all action types
  outcome TEXT CHECK (outcome IN ('interested', 'not_interested', 'follow_up_needed', 'do_not_contact', 'callback_requested', 'information_provided', 'no_response', 'other')),
  follow_up_date DATE, -- For scheduling future actions
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_logs_people_record_id ON contact_logs(people_record_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_workspace_id ON contact_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_created_by ON contact_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_logs_action_type ON contact_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_contact_logs_created_at ON contact_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_logs_follow_up_date ON contact_logs(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Create updated_at trigger
CREATE TRIGGER update_contact_logs_updated_at 
    BEFORE UPDATE ON contact_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the is_member function
-- Users can only see contact logs from workspaces they belong to
CREATE POLICY "Users can view contact logs from their workspaces" ON contact_logs
    FOR SELECT USING (public.is_member(workspace_id));

-- Users can insert contact logs in workspaces they belong to
CREATE POLICY "Users can insert contact logs in their workspaces" ON contact_logs
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

-- Users can update contact logs in workspaces they belong to
CREATE POLICY "Users can update contact logs in their workspaces" ON contact_logs
    FOR UPDATE USING (public.is_member(workspace_id));

-- Users can delete contact logs in workspaces they belong to
CREATE POLICY "Users can delete contact logs in their workspaces" ON contact_logs
    FOR DELETE USING (public.is_member(workspace_id));

-- Add comments for documentation
COMMENT ON TABLE contact_logs IS 'Tracks all contact actions (calls, emails, notes, meetings) taken by team members on people records';
COMMENT ON COLUMN contact_logs.action_type IS 'Type of action: call, email, note, meeting, or other';
COMMENT ON COLUMN contact_logs.direction IS 'Direction of contact: outbound (initiated by team) or inbound (initiated by contact)';
COMMENT ON COLUMN contact_logs.call_duration IS 'Call duration in seconds (only for action_type = call)';
COMMENT ON COLUMN contact_logs.call_outcome IS 'Call outcome: connected, voicemail, no_answer, busy, wrong_number (only for action_type = call)';
COMMENT ON COLUMN contact_logs.email_subject IS 'Email subject line (only for action_type = email)';
COMMENT ON COLUMN contact_logs.email_body IS 'Email body content (only for action_type = email)';
COMMENT ON COLUMN contact_logs.email_status IS 'Email status: sent, opened, clicked, bounced, replied (only for action_type = email)';
COMMENT ON COLUMN contact_logs.email_template_id IS 'Optional reference to email template used';
COMMENT ON COLUMN contact_logs.contact_phone IS 'Phone number that was called (for tracking which number from skip trace was used)';
COMMENT ON COLUMN contact_logs.contact_email IS 'Email address that was contacted (for tracking which email from skip trace was used)';
COMMENT ON COLUMN contact_logs.notes IS 'General notes field for any additional information';
COMMENT ON COLUMN contact_logs.outcome IS 'Categorization of the contact result: interested, not_interested, follow_up_needed, do_not_contact, etc.';
COMMENT ON COLUMN contact_logs.follow_up_date IS 'Scheduled date for future follow-up action';

