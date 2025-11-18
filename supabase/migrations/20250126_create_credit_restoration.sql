-- Create credit restoration system
-- Stores user identity details and credit report uploads

-- Create credit_restoration_requests table
CREATE TABLE IF NOT EXISTS public.credit_restoration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_details JSONB NOT NULL,
  experian_report_url TEXT,
  equifax_report_url TEXT,
  transunion_report_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_restoration_requests_user_id ON public.credit_restoration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_restoration_requests_status ON public.credit_restoration_requests(status);
CREATE INDEX IF NOT EXISTS idx_credit_restoration_requests_created_at ON public.credit_restoration_requests(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_credit_restoration_requests_updated_at 
    BEFORE UPDATE ON public.credit_restoration_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.credit_restoration_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own requests
CREATE POLICY "Users can view own credit restoration requests"
  ON public.credit_restoration_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own credit restoration requests"
  ON public.credit_restoration_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update own credit restoration requests"
  ON public.credit_restoration_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.credit_restoration_requests TO authenticated;


