-- Update field_type CHECK constraint to new values
-- Old: string, number, boolean, single_select, multi_select, address, location, range
-- New: text, textarea, number, currency, select, multiselect, boolean, map_point, map_area, address, range

-- ============================================================================
-- STEP 1: Drop existing CHECK constraint
-- ============================================================================

ALTER TABLE public.onboarding_questions
  DROP CONSTRAINT IF EXISTS onboarding_questions_field_type_check;

-- ============================================================================
-- STEP 2: Add new CHECK constraint with updated values
-- ============================================================================

ALTER TABLE public.onboarding_questions
  ADD CONSTRAINT onboarding_questions_field_type_check
  CHECK (
    field_type IN (
      'text',
      'textarea',
      'number',
      'currency',
      'select',
      'multiselect',
      'boolean',
      'map_point',
      'map_area',
      'address',
      'range'
    )
  );

-- ============================================================================
-- STEP 3: Migrate existing data (if any exists)
-- ============================================================================

-- Map old values to new values
UPDATE public.onboarding_questions
SET field_type = CASE
  WHEN field_type = 'string' THEN 'text'
  WHEN field_type = 'single_select' THEN 'select'
  WHEN field_type = 'multi_select' THEN 'multiselect'
  WHEN field_type = 'location' THEN 'map_area'
  ELSE field_type
END
WHERE field_type IN ('string', 'single_select', 'multi_select', 'location');

-- ============================================================================
-- STEP 4: Update comment
-- ============================================================================

COMMENT ON COLUMN public.onboarding_questions.field_type IS 
  'Type of input field: text, textarea, number, currency, select, multiselect, boolean, map_point, map_area, address, range';

