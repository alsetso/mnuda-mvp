-- Create tags table - a general tagging system that can be used by pins and other entities
-- This is a standalone clone of pins_categories but more flexible

-- ============================================================================
-- STEP 1: Create tag_entity_type enum for different entity types
-- ============================================================================

CREATE TYPE public.tag_entity_type AS ENUM (
  'pin',
  'area',
  'post',
  'project',
  'general'
);

-- ============================================================================
-- STEP 2: Create tags table
-- ============================================================================

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  entity_type public.tag_entity_type NOT NULL DEFAULT 'general'::public.tag_entity_type,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible metadata for entity-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique slug per entity type
  CONSTRAINT tags_slug_entity_type_unique UNIQUE (slug, entity_type)
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_entity_type ON public.tags(entity_type);
CREATE INDEX idx_tags_is_active ON public.tags(is_active);
CREATE INDEX idx_tags_is_public ON public.tags(is_public);
CREATE INDEX idx_tags_display_order ON public.tags(display_order);
CREATE INDEX idx_tags_entity_type_active ON public.tags(entity_type, is_active);
CREATE INDEX idx_tags_entity_type_public ON public.tags(entity_type, is_public, is_active);
CREATE INDEX idx_tags_metadata ON public.tags USING GIN(metadata);

-- ============================================================================
-- STEP 4: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON TABLE public.tags IS 'General tagging system for pins, areas, and other entities. Standalone clone of pins_categories with entity type support.';
COMMENT ON COLUMN public.tags.slug IS 'URL-friendly identifier, unique per entity_type';
COMMENT ON COLUMN public.tags.label IS 'Human-readable label';
COMMENT ON COLUMN public.tags.emoji IS 'Emoji icon for visual representation';
COMMENT ON COLUMN public.tags.entity_type IS 'Type of entity this tag applies to: pin, area, post, project, or general';
COMMENT ON COLUMN public.tags.display_order IS 'Order for display in lists/filters';
COMMENT ON COLUMN public.tags.is_active IS 'Whether this tag is active and available for use';
COMMENT ON COLUMN public.tags.is_public IS 'Whether this tag appears in public filters';
COMMENT ON COLUMN public.tags.metadata IS 'Flexible JSONB for entity-specific metadata (e.g., access_list for pins)';

-- ============================================================================
-- STEP 6: Migrate existing pins_categories data to tags (if pins_categories exists)
-- ============================================================================

-- Check if pins_categories table exists and migrate data
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pins_categories'
  ) THEN
    -- Migrate all pins_categories to tags with entity_type = 'pin'
    INSERT INTO public.tags (slug, label, emoji, description, entity_type, display_order, is_active, is_public, created_at, updated_at)
    SELECT 
      slug,
      label,
      emoji,
      description,
      'pin'::public.tag_entity_type,
      display_order,
      is_active,
      is_public,
      created_at,
      updated_at
    FROM public.pins_categories
    ON CONFLICT (slug, entity_type) DO NOTHING;
    
    RAISE NOTICE 'Migrated pins_categories data to tags table';
  ELSE
    RAISE NOTICE 'pins_categories table does not exist, skipping migration';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Create pins_tags junction table for many-to-many relationship
-- ============================================================================

CREATE TABLE public.pins_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique pin-tag combinations
  CONSTRAINT pins_tags_pin_tag_unique UNIQUE (pin_id, tag_id)
);

-- Indexes for pins_tags
CREATE INDEX idx_pins_tags_pin_id ON public.pins_tags(pin_id);
CREATE INDEX idx_pins_tags_tag_id ON public.pins_tags(tag_id);
CREATE INDEX idx_pins_tags_pin_tag ON public.pins_tags(pin_id, tag_id);

-- Comments
COMMENT ON TABLE public.pins_tags IS 'Junction table for many-to-many relationship between pins and tags';
COMMENT ON COLUMN public.pins_tags.pin_id IS 'Reference to pins table';
COMMENT ON COLUMN public.pins_tags.tag_id IS 'Reference to tags table';

-- ============================================================================
-- STEP 8: Migrate existing category_id to tags (if category_id exists)
-- ============================================================================

DO $$
DECLARE
  pin_record RECORD;
  tag_record RECORD;
BEGIN
  -- Check if category_id column exists in pins table
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'category_id'
  ) THEN
    -- Migrate each pin's category_id to tags
    FOR pin_record IN 
      SELECT id, category_id FROM public.pins WHERE category_id IS NOT NULL
    LOOP
      -- Find the corresponding tag (migrated from pins_categories)
      SELECT id INTO tag_record FROM public.tags 
      WHERE entity_type = 'pin' 
      AND id::text = pin_record.category_id::text
      LIMIT 1;
      
      -- If tag found, create relationship
      IF tag_record.id IS NOT NULL THEN
        INSERT INTO public.pins_tags (pin_id, tag_id)
        VALUES (pin_record.id, tag_record.id)
        ON CONFLICT (pin_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated category_id relationships to pins_tags';
  ELSE
    RAISE NOTICE 'category_id column does not exist in pins table, skipping migration';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Add constraint to ensure pins have at least one tag
-- ============================================================================

-- Function to check if pin has at least one tag
CREATE OR REPLACE FUNCTION public.check_pin_has_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if pin has at least one tag
  IF NOT EXISTS (
    SELECT 1 FROM public.pins_tags WHERE pin_id = COALESCE(NEW.pin_id, OLD.pin_id)
  ) THEN
    RAISE EXCEPTION 'Pin must have at least one tag';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce at least one tag constraint
-- This will fire when trying to delete the last tag from a pin
CREATE TRIGGER enforce_pin_has_tags
  AFTER DELETE ON public.pins_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pin_has_tags();

-- Note: We can't prevent deletion of the last tag directly in the trigger
-- Instead, we'll handle this in application code and add a check constraint
-- that validates on insert/update operations

-- ============================================================================
-- STEP 10: Grant permissions for pins_tags
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins_tags TO authenticated;
GRANT SELECT ON public.pins_tags TO anon;

-- ============================================================================
-- STEP 11: Enable RLS for pins_tags
-- ============================================================================

ALTER TABLE public.pins_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read pins_tags
CREATE POLICY "Anyone can read pins_tags"
  ON public.pins_tags
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Users can manage tags for their own pins
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

-- Policy: Admins can manage all pins_tags
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
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT ON public.tags TO authenticated;
GRANT SELECT ON public.tags TO anon;

-- ============================================================================
-- STEP 9: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: Create RLS Policies
-- ============================================================================

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

