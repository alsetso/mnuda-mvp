-- Fix pins_tags relationship for PostgREST discovery
-- This ensures PostgREST can properly discover the foreign key relationships
-- NOTE: This migration assumes pins_tags table exists (created in migration 039)

-- ============================================================================
-- STEP 1: Check if pins_tags table exists, if not create it
-- ============================================================================

DO $$
BEGIN
  -- Check if pins_tags table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pins_tags'
  ) THEN
    -- Create pins_tags table if it doesn't exist
    CREATE TABLE public.pins_tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Ensure unique pin-tag combinations
      CONSTRAINT pins_tags_pin_tag_unique UNIQUE (pin_id, tag_id)
    );

    -- Create indexes
    CREATE INDEX idx_pins_tags_pin_id ON public.pins_tags(pin_id);
    CREATE INDEX idx_pins_tags_tag_id ON public.pins_tags(tag_id);
    CREATE INDEX idx_pins_tags_pin_tag ON public.pins_tags(pin_id, tag_id);

    -- Add comments
    COMMENT ON TABLE public.pins_tags IS 'Junction table for many-to-many relationship between pins and tags';
    COMMENT ON COLUMN public.pins_tags.pin_id IS 'Reference to pins table';
    COMMENT ON COLUMN public.pins_tags.tag_id IS 'Reference to tags table';
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins_tags TO authenticated;
    GRANT SELECT ON public.pins_tags TO anon;
    
    -- Enable RLS
    ALTER TABLE public.pins_tags ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Anyone can read pins_tags"
      ON public.pins_tags
      FOR SELECT
      TO authenticated, anon
      USING (true);
    
    CREATE POLICY "Users can manage tags for own pins"
      ON public.pins_tags
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.pins
          WHERE pins.id = pins_tags.pin_id
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = pins.profile_id
            AND EXISTS (
              SELECT 1 FROM public.accounts
              WHERE accounts.id = profiles.account_id
              AND accounts.user_id = auth.uid()
            )
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pins
          WHERE pins.id = pins_tags.pin_id
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = pins.profile_id
            AND EXISTS (
              SELECT 1 FROM public.accounts
              WHERE accounts.id = profiles.account_id
              AND accounts.user_id = auth.uid()
            )
          )
        )
      );
    
    CREATE POLICY "Admins can manage all pins_tags"
      ON public.pins_tags
      FOR ALL
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
    
    RAISE NOTICE 'Created pins_tags table with RLS policies';
  ELSE
    RAISE NOTICE 'pins_tags table already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure RLS is enabled and policies exist (if table was just created, they're already there)
-- ============================================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins_tags TO authenticated;
GRANT SELECT ON public.pins_tags TO anon;

-- Enable RLS if not already enabled
ALTER TABLE public.pins_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Anyone can read pins_tags" ON public.pins_tags;
DROP POLICY IF EXISTS "Users can manage tags for own pins" ON public.pins_tags;
DROP POLICY IF EXISTS "Admins can manage all pins_tags" ON public.pins_tags;

-- Recreate policies
CREATE POLICY "Anyone can read pins_tags"
  ON public.pins_tags
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can manage tags for own pins"
  ON public.pins_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id = pins_tags.pin_id
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = pins.profile_id
        AND EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.id = profiles.account_id
          AND accounts.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pins
      WHERE pins.id = pins_tags.pin_id
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = pins.profile_id
        AND EXISTS (
          SELECT 1 FROM public.accounts
          WHERE accounts.id = profiles.account_id
          AND accounts.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage all pins_tags"
  ON public.pins_tags
  FOR ALL
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

-- ============================================================================
-- STEP 3: Ensure foreign key constraints are properly named
-- ============================================================================

-- Drop existing constraints if they exist and recreate with explicit names
DO $$
BEGIN
  -- Drop old constraints if they exist
  ALTER TABLE public.pins_tags 
    DROP CONSTRAINT IF EXISTS pins_tags_pin_id_fkey,
    DROP CONSTRAINT IF EXISTS pins_tags_tag_id_fkey;

  -- Recreate with explicit names for better PostgREST discovery
  ALTER TABLE public.pins_tags
    ADD CONSTRAINT pins_tags_pin_id_fkey 
      FOREIGN KEY (pin_id) 
      REFERENCES public.pins(id) 
      ON DELETE CASCADE;

  ALTER TABLE public.pins_tags
    ADD CONSTRAINT pins_tags_tag_id_fkey 
      FOREIGN KEY (tag_id) 
      REFERENCES public.tags(id) 
      ON DELETE CASCADE;
      
  RAISE NOTICE 'Updated foreign key constraints';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating constraints: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: Add comments to help PostgREST understand relationships
-- ============================================================================

COMMENT ON CONSTRAINT pins_tags_pin_id_fkey ON public.pins_tags IS 'Foreign key to pins table';
COMMENT ON CONSTRAINT pins_tags_tag_id_fkey ON public.pins_tags IS 'Foreign key to tags table';

-- ============================================================================
-- STEP 5: Ensure indexes exist for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pins_tags_pin_id ON public.pins_tags(pin_id);
CREATE INDEX IF NOT EXISTS idx_pins_tags_tag_id ON public.pins_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_pins_tags_pin_tag ON public.pins_tags(pin_id, tag_id);

