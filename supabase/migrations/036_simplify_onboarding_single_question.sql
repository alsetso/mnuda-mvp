-- Simplify onboarding to only allow ONE question per profile_type
-- Question must be either map_point or map_area type
-- Value structure supports arrays for multiple entries

-- ============================================================================
-- STEP 1: Delete all existing questions and answers
-- ============================================================================

-- Delete all answers first (foreign key constraint)
DELETE FROM public.onboarding_answers;

-- Delete all questions
DELETE FROM public.onboarding_questions;

-- Reset sequence
ALTER SEQUENCE IF EXISTS public.onboarding_questions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.onboarding_answers_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 2: Add constraint to ensure only one active question per profile_type
-- ============================================================================

-- Create unique partial index for one active question per profile_type
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_questions_one_active_per_profile_type
  ON public.onboarding_questions (profile_type)
  WHERE active = true;

-- ============================================================================
-- STEP 3: Add constraint to ensure field_type is only map_point or map_area
-- ============================================================================

-- Drop existing field_type constraint
ALTER TABLE public.onboarding_questions
  DROP CONSTRAINT IF EXISTS onboarding_questions_field_type_check;

-- Add new constraint for only map_point and map_area
ALTER TABLE public.onboarding_questions
  ADD CONSTRAINT onboarding_questions_field_type_check
  CHECK (field_type IN ('map_point', 'map_area'));

-- ============================================================================
-- STEP 4: Seed single question for each profile type
-- ============================================================================

-- Homeowner: map_point (location of property)
INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('homeowner', 'property_location', 'Where is your property located?', 'Mark the location of your property on the map. You can add multiple properties.', 'map_point', NULL, true, 10, true);

-- Realtor: map_area (service territory)
INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('realtor', 'service_territory', 'Outline your service territory', 'Draw the areas where you serve clients. You can add multiple territories.', 'map_area', NULL, true, 10, true);

-- Wholesaler: map_area (deal flow zones)
INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('wholesaler', 'deal_flow_zones', 'Mark your deal flow zones', 'Draw the areas where you source or assign deals. You can add multiple zones.', 'map_area', NULL, true, 10, true);

-- Investor: map_area (investment areas)
INSERT INTO public.onboarding_questions (profile_type, key, label, description, field_type, options, required, sort_order, active) VALUES
('investor', 'investment_areas', 'Show us your investment areas', 'Draw the areas in Minnesota where you want to find properties. You can add multiple areas.', 'map_area', NULL, true, 10, true);

-- ============================================================================
-- STEP 5: Update comments
-- ============================================================================

COMMENT ON TABLE public.onboarding_questions IS 'Single onboarding question per profile type. Must be map_point or map_area type. Value supports arrays for multiple entries.';
COMMENT ON COLUMN public.onboarding_questions.field_type IS 'Type of input field - only map_point or map_area allowed';
COMMENT ON INDEX onboarding_questions_one_active_per_profile_type IS 'Ensures only one active question exists per profile_type';

