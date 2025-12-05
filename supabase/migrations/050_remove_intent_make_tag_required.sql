-- Remove intent-based pin system and make tag_id required for user-created pins
-- This migration removes the intent enum, constraints, and makes tag_id required

-- ============================================================================
-- STEP 1: Remove intent constraint from pins table
-- ============================================================================

-- Drop the constraint that requires intent for user-created pins
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pins_user_pins_require_intent'
  ) THEN
    ALTER TABLE public.pins DROP CONSTRAINT pins_user_pins_require_intent;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Make tag_id required for user-created pins (via constraint)
-- ============================================================================

-- Add constraint: user-created pins must have tag_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pins_user_pins_require_tag_id'
  ) THEN
    ALTER TABLE public.pins
      ADD CONSTRAINT pins_user_pins_require_tag_id
      CHECK (
        (profile_id IS NULL) OR (tag_id IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop intent-related indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_pins_intent;
DROP INDEX IF EXISTS idx_pins_intent_category_location;

-- ============================================================================
-- STEP 4: Update RLS policies to remove intent requirement
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can insert own pins" ON public.pins;

-- Policy: Users can insert their own pins (must have tag_id and profile_id)
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IS NOT NULL AND
    tag_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = pins.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON CONSTRAINT pins_user_pins_require_tag_id ON public.pins IS 'User-created pins must have a tag_id. Reference pins (profile_id IS NULL) do not require tag_id.';

-- ============================================================================
-- NOTE: We do NOT drop the intent column or enum type to avoid breaking
-- existing data. The intent column will remain but will not be used.
-- If you want to completely remove it later, you can:
-- 1. ALTER TABLE public.pins DROP COLUMN intent;
-- 2. DROP TYPE public.pin_intent;
-- ============================================================================


