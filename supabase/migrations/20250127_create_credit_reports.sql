-- Create credit_reports table
-- Stores physical credit report documents (Experian, TransUnion, Equifax) linked to credit profiles

CREATE TABLE IF NOT EXISTS public.credit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_profile_id UUID NOT NULL REFERENCES public.credit_profiles(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('experian', 'equifax', 'transunion')),
  
  -- File Information
  storage_path TEXT NOT NULL, -- Path in credit-reports storage bucket
  file_name TEXT NOT NULL,
  file_size BIGINT,
  
  -- Upload & Parsing Status
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_at TIMESTAMP WITH TIME ZONE,
  parsing_status TEXT NOT NULL DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'parsing', 'completed', 'failed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One report per bureau per profile
  UNIQUE(credit_profile_id, bureau)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_reports_profile_id ON public.credit_reports(credit_profile_id);
CREATE INDEX IF NOT EXISTS idx_credit_reports_bureau ON public.credit_reports(bureau);
CREATE INDEX IF NOT EXISTS idx_credit_reports_parsing_status ON public.credit_reports(parsing_status);
CREATE INDEX IF NOT EXISTS idx_credit_reports_uploaded_at ON public.credit_reports(uploaded_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_credit_reports_updated_at 
    BEFORE UPDATE ON public.credit_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.credit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view credit reports for their own profile
CREATE POLICY "Users can view own credit reports"
  ON public.credit_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_reports.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can create credit reports for their own profile
CREATE POLICY "Users can create own credit reports"
  ON public.credit_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_reports.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can update credit reports for their own profile
CREATE POLICY "Users can update own credit reports"
  ON public.credit_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_reports.credit_profile_id
      AND m.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_reports.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.credit_reports TO authenticated;

