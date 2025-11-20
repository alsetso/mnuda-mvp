-- Create onboarding_questions, onboarding_answers, and profiles tables
-- Update pins table to reference profiles

-- ============================================================================
-- STEP 1: Create onboarding_questions table
-- ============================================================================

CREATE TABLE public.onboarding_questions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Which account type this question belongs to
  account_type public.account_type NOT NULL,
  
  key TEXT NOT NULL,                     -- internal key: 'service_radius', 'counties', 'buy_box'
  label TEXT NOT NULL,                   -- UI label: "What counties do you invest in?"
  description TEXT,                      -- optional helper text
  
  field_type TEXT NOT NULL CHECK (       -- input type
    field_type IN (
      'string',
      'number',
      'boolean',
      'single_select',
      'multi_select',
      'address',
      'location',
      'range'
    )
  ),
  
  options JSONB,                         -- values for selects
  required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX onboarding_questions_account_type_idx
  ON public.onboarding_questions (account_type, sort_order);

-- Add comment
COMMENT ON TABLE public.onboarding_questions IS 'Questions for onboarding flow, organized by account type';
COMMENT ON COLUMN public.onboarding_questions.account_type IS 'Account type this question applies to';
COMMENT ON COLUMN public.onboarding_questions.key IS 'Internal identifier for the question';
COMMENT ON COLUMN public.onboarding_questions.field_type IS 'Type of input field (string, number, boolean, single_select, multi_select, address, location, range)';
COMMENT ON COLUMN public.onboarding_questions.options IS 'JSONB options for select fields (e.g., {"values": ["option1", "option2"]})';

-- ============================================================================
-- STEP 2: Create onboarding_answers table
-- ============================================================================

CREATE TABLE public.onboarding_answers (
  id BIGSERIAL PRIMARY KEY,
  
  account_id UUID NOT NULL
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  question_id BIGINT NOT NULL
    REFERENCES public.onboarding_questions(id) ON DELETE CASCADE,
  
  value JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE (account_id, question_id)
);

CREATE INDEX onboarding_answers_account_idx
  ON public.onboarding_answers (account_id);

CREATE INDEX onboarding_answers_question_idx
  ON public.onboarding_answers (question_id);

-- Add comment
COMMENT ON TABLE public.onboarding_answers IS 'Answers to onboarding questions for each account';
COMMENT ON COLUMN public.onboarding_answers.value IS 'JSONB value storing the answer (format depends on question field_type)';

-- ============================================================================
-- STEP 3: Create profiles table
-- ============================================================================

CREATE TABLE public.profiles (
  account_id UUID PRIMARY KEY
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  display_name TEXT,
  
  -- Operational attributes (examples - edit as you grow)
  primary_county TEXT,
  service_radius_km NUMERIC,
  geo_focus JSONB,            -- ex: {"counties":["Hennepin"], "cities":["Minneapolis"]}
  buy_box JSONB,              -- strategies, ranges, budgets
  settings JSONB,             -- catch-all for arbitrary metadata
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_primary_county_idx
  ON public.profiles (primary_county) WHERE primary_county IS NOT NULL;

CREATE INDEX profiles_geo_focus_idx
  ON public.profiles USING GIN (geo_focus) WHERE geo_focus IS NOT NULL;

-- Add comment
COMMENT ON TABLE public.profiles IS 'Operational profile data derived from onboarding - queryable, indexable, map-driven';
COMMENT ON COLUMN public.profiles.account_id IS 'References accounts.id - one profile per account';
COMMENT ON COLUMN public.profiles.display_name IS 'Display name for the profile';
COMMENT ON COLUMN public.profiles.primary_county IS 'Primary county of operation';
COMMENT ON COLUMN public.profiles.service_radius_km IS 'Service radius in kilometers';
COMMENT ON COLUMN public.profiles.geo_focus IS 'Geographic focus areas (counties, cities, etc.)';
COMMENT ON COLUMN public.profiles.buy_box IS 'Investment/buying criteria and strategies';
COMMENT ON COLUMN public.profiles.settings IS 'Arbitrary metadata and settings';

-- ============================================================================
-- STEP 4: Update pins table to reference profiles
-- ============================================================================

-- Add profile_id column to pins table
ALTER TABLE public.pins
  ADD COLUMN IF NOT EXISTS profile_id UUID
    REFERENCES public.profiles(account_id) ON DELETE CASCADE;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS pins_profile_id_idx
  ON public.pins (profile_id) WHERE profile_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.pins.profile_id IS 'References profiles.account_id - the operational profile that created this pin';

-- ============================================================================
-- STEP 5: Create trigger to update updated_at columns
-- ============================================================================

-- Trigger for onboarding_questions
CREATE TRIGGER update_onboarding_questions_updated_at
  BEFORE UPDATE ON public.onboarding_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for onboarding_answers
CREATE TRIGGER update_onboarding_answers_updated_at
  BEFORE UPDATE ON public.onboarding_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 6: Enable RLS and create policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Onboarding questions: Anyone authenticated can view
CREATE POLICY "Anyone authenticated can view onboarding questions"
  ON public.onboarding_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Onboarding answers: Users can view and manage their own answers
CREATE POLICY "Users can view own onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = onboarding_answers.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own onboarding answers"
  ON public.onboarding_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = onboarding_answers.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own onboarding answers"
  ON public.onboarding_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = onboarding_answers.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = onboarding_answers.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own onboarding answers"
  ON public.onboarding_answers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = onboarding_answers.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Profiles: Users can view and manage their own profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Admins can view all profiles and answers
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can view all onboarding answers"
  ON public.onboarding_answers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT ON public.onboarding_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

