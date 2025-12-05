-- Remove pins_tags junction table and add tag_id directly to pins table
-- This simplifies the schema to a one-to-one relationship: one pin = one tag

-- ============================================================================
-- STEP 1: Drop pins_tags junction table and related objects
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS enforce_pin_has_tags ON public.pins_tags;
DROP FUNCTION IF EXISTS public.check_pin_has_tags();

-- Drop policies
DROP POLICY IF EXISTS "Anyone can read pins_tags" ON public.pins_tags;
DROP POLICY IF EXISTS "Users can manage tags for own pins" ON public.pins_tags;
DROP POLICY IF EXISTS "Admins can manage all pins_tags" ON public.pins_tags;

-- Drop the junction table
DROP TABLE IF EXISTS public.pins_tags CASCADE;

-- ============================================================================
-- STEP 2: Add tag_id column to pins table
-- ============================================================================

-- Check if tag_id column already exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'tag_id'
  ) THEN
    -- Add tag_id column
    ALTER TABLE public.pins
      ADD COLUMN tag_id UUID REFERENCES public.tags(id) ON DELETE SET NULL;
    
    -- Create index for performance
    CREATE INDEX idx_pins_tag_id ON public.pins(tag_id);
    
    -- Add comment
    COMMENT ON COLUMN public.pins.tag_id IS 'Reference to tags table - each pin has one tag';
    
    RAISE NOTICE 'Added tag_id column to pins table';
  ELSE
    RAISE NOTICE 'tag_id column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Ensure tags table exists and is standalone
-- ============================================================================

-- Tags table should already exist from migration 039, but ensure it's properly set up
-- This is just a check - tags table creation is in migration 039

-- ============================================================================
-- STEP 4: Update RLS policies for tags (ensure they're correct)
-- ============================================================================

-- Enable RLS on tags if not already enabled
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate to ensure they're correct
DROP POLICY IF EXISTS "Anyone can read active tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can read all tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can insert tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can update tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON public.tags;

-- Policy: Anyone can read active tags
CREATE POLICY "Anyone can read active tags"
  ON public.tags
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Policy: Admins can read all tags
CREATE POLICY "Admins can read all tags"
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy: Admins can insert tags
CREATE POLICY "Admins can insert tags"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy: Admins can update tags
CREATE POLICY "Admins can update tags"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy: Admins can delete tags
CREATE POLICY "Admins can delete tags"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 5: Ensure grants are correct
-- ============================================================================

GRANT SELECT ON public.tags TO authenticated;
GRANT SELECT ON public.tags TO anon;


