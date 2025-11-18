-- Create credit_letters table
-- Tracks letters sent/received to credit bureaus

CREATE TABLE IF NOT EXISTS public.credit_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_profile_id UUID NOT NULL REFERENCES public.credit_profiles(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('experian', 'equifax', 'transunion')),
  letter_type TEXT NOT NULL CHECK (letter_type IN ('sent', 'received')),
  
  -- Letter Content
  subject TEXT,
  content TEXT, -- Plain text or structured content
  
  -- File Storage (if stored as file)
  storage_path TEXT, -- Path in storage bucket if stored as file
  
  -- Dates
  sent_at TIMESTAMP WITH TIME ZONE, -- For sent letters
  received_at TIMESTAMP WITH TIME ZONE, -- For received letters
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'archived')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_letters_profile_id ON public.credit_letters(credit_profile_id);
CREATE INDEX IF NOT EXISTS idx_credit_letters_bureau ON public.credit_letters(bureau);
CREATE INDEX IF NOT EXISTS idx_credit_letters_letter_type ON public.credit_letters(letter_type);
CREATE INDEX IF NOT EXISTS idx_credit_letters_status ON public.credit_letters(status);
CREATE INDEX IF NOT EXISTS idx_credit_letters_created_at ON public.credit_letters(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_credit_letters_updated_at 
    BEFORE UPDATE ON public.credit_letters 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.credit_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view credit letters for their own profile
CREATE POLICY "Users can view own credit letters"
  ON public.credit_letters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_letters.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can create credit letters for their own profile
CREATE POLICY "Users can create own credit letters"
  ON public.credit_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_letters.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can update credit letters for their own profile
CREATE POLICY "Users can update own credit letters"
  ON public.credit_letters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_letters.credit_profile_id
      AND m.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_letters.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can delete credit letters for their own profile
CREATE POLICY "Users can delete own credit letters"
  ON public.credit_letters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_letters.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_letters TO authenticated;



