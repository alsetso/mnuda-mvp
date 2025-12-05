-- Rebuild pins table with clean schema for both reference pins and user-created pins
-- This migration fixes NOT NULL constraint issues by properly handling both use cases

-- ============================================================================
-- STEP 1: Drop dependent objects first
-- ============================================================================

-- Drop foreign key constraints that reference pins
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_tag_id_fkey;
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_created_by_fkey;
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_profile_id_fkey;

-- Drop indexes that will be recreated
DROP INDEX IF EXISTS idx_pins_tag_id;
DROP INDEX IF EXISTS idx_pins_profile_id_tag_id;
DROP INDEX IF EXISTS idx_pins_lat_long;

-- Drop triggers
DROP TRIGGER IF EXISTS update_pins_updated_at ON public.pins;

-- Drop RLS policies (will recreate)
DROP POLICY IF EXISTS "Anyone can view pins" ON public.pins;
DROP POLICY IF EXISTS "Users can insert own pins" ON public.pins;
DROP POLICY IF EXISTS "Admins can insert pins" ON public.pins;
DROP POLICY IF EXISTS "Users can update own pins" ON public.pins;
DROP POLICY IF EXISTS "Admins can update pins" ON public.pins;
DROP POLICY IF EXISTS "Users can delete own pins" ON public.pins;
DROP POLICY IF EXISTS "Admins can delete pins" ON public.pins;

-- ============================================================================
-- STEP 2: Backup existing data (if needed for reference pins)
-- ============================================================================

-- Create temp table to store reference pins (those with slug and category)
CREATE TABLE IF NOT EXISTS public.pins_backup AS
SELECT * FROM public.pins WHERE slug IS NOT NULL AND category IS NOT NULL;

-- ============================================================================
-- STEP 3: Drop and recreate pins table with clean schema
-- ============================================================================

DROP TABLE IF EXISTS public.pins CASCADE;

CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields (always required)
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Reference pin fields (nullable - only for system pin types)
  slug TEXT UNIQUE, -- Nullable for user-created pins
  category public.pin_category, -- Nullable for user-created pins
  access_list TEXT[], -- Nullable for user-created pins, defaults to NULL
  
  -- User-created pin fields (nullable - only for user pins)
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- User who created this pin
  tag_id UUID REFERENCES public.tags(id) ON DELETE SET NULL, -- Tag for user-created pins
  emoji TEXT, -- Emoji for user-created pins
  address TEXT, -- Address for user-created pins
  lat NUMERIC(10, 8), -- Latitude for user-created pins
  long NUMERIC(11, 8), -- Longitude for user-created pins
  description TEXT, -- Description for user-created pins
  subcategory TEXT, -- Subcategory for user-created pins
  
  -- Common fields (for both types)
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  expires BOOLEAN NOT NULL DEFAULT false,
  expiration_date TIMESTAMP WITH TIME ZONE,
  status public.pin_status NOT NULL DEFAULT 'active'::public.pin_status,
  visibility public.pin_visibility NOT NULL DEFAULT 'public'::public.pin_visibility
  
  -- Note: Application logic enforces that user-created pins have both tag_id and profile_id
  -- Reference pins have slug and category, but we don't enforce this at DB level for flexibility
);
);

-- ============================================================================
-- STEP 4: Restore reference pins from backup
-- ============================================================================

INSERT INTO public.pins (
  id, name, slug, category, access_list, created_by, expires, expiration_date, 
  status, visibility, created_at, updated_at
)
SELECT 
  id, name, slug, category, 
  COALESCE(access_list, '{}'::TEXT[]), -- Ensure access_list is not null for reference pins
  created_by, expires, expiration_date,
  status, visibility, created_at, updated_at
FROM public.pins_backup
ON CONFLICT (id) DO NOTHING;

-- Drop backup table
DROP TABLE IF EXISTS public.pins_backup;

-- ============================================================================
-- STEP 5: Create indexes
-- ============================================================================

CREATE INDEX idx_pins_slug ON public.pins(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_pins_category ON public.pins(category) WHERE category IS NOT NULL;
CREATE INDEX idx_pins_access_list ON public.pins USING GIN(access_list) WHERE access_list IS NOT NULL;
CREATE INDEX idx_pins_created_by ON public.pins(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_pins_expires ON public.pins(expires);
CREATE INDEX idx_pins_expiration_date ON public.pins(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_pins_status ON public.pins(status);
CREATE INDEX idx_pins_visibility ON public.pins(visibility);

-- User-created pin indexes
CREATE INDEX idx_pins_profile_id ON public.pins(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_pins_tag_id ON public.pins(tag_id) WHERE tag_id IS NOT NULL;
CREATE INDEX idx_pins_lat_long ON public.pins(lat, long) WHERE lat IS NOT NULL AND long IS NOT NULL;
CREATE INDEX idx_pins_profile_id_tag_id ON public.pins(profile_id, tag_id) WHERE profile_id IS NOT NULL AND tag_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Recreate triggers
-- ============================================================================

CREATE TRIGGER update_pins_updated_at 
    BEFORE UPDATE ON public.pins 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;
GRANT SELECT ON public.pins TO anon;

-- ============================================================================
-- STEP 8: Enable RLS
-- ============================================================================

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS policies
-- ============================================================================

-- Policy: Anyone can view public pins and reference pins
CREATE POLICY "Anyone can view public pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (
    visibility = 'public'::public.pin_visibility OR
    (slug IS NOT NULL AND category IS NOT NULL) -- Reference pins are always viewable
  );

-- Policy: Authenticated users can view their own private pins
CREATE POLICY "Users can view own private pins"
  ON public.pins
  FOR SELECT
  TO authenticated
  USING (
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

-- Policy: Users can insert their own pins
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

-- Policy: Admins can insert any pins
CREATE POLICY "Admins can insert pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- Policy: Users can update their own pins
CREATE POLICY "Users can update own pins"
  ON public.pins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = pins.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
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

-- Policy: Admins can update any pins
CREATE POLICY "Admins can update pins"
  ON public.pins
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

-- Policy: Users can delete their own pins
CREATE POLICY "Users can delete own pins"
  ON public.pins
  FOR DELETE
  TO authenticated
  USING (
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

-- Policy: Admins can delete any pins
CREATE POLICY "Admins can delete pins"
  ON public.pins
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
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE public.pins IS 'Pins table supporting both reference pin types (with slug/category) and user-created pins (with tag_id/profile_id)';
COMMENT ON COLUMN public.pins.slug IS 'Unique slug for reference pin types (nullable for user-created pins)';
COMMENT ON COLUMN public.pins.category IS 'Category for reference pin types (nullable for user-created pins)';
COMMENT ON COLUMN public.pins.profile_id IS 'Profile that created this user pin (nullable for reference pins)';
COMMENT ON COLUMN public.pins.tag_id IS 'Tag for user-created pins (nullable for reference pins)';
COMMENT ON COLUMN public.pins.emoji IS 'Emoji icon for user-created pins';
COMMENT ON COLUMN public.pins.address IS 'Address for user-created pins';
COMMENT ON COLUMN public.pins.lat IS 'Latitude for user-created pins';
COMMENT ON COLUMN public.pins.long IS 'Longitude for user-created pins';
COMMENT ON COLUMN public.pins.description IS 'Description for user-created pins';
COMMENT ON COLUMN public.pins.subcategory IS 'Subcategory for user-created pins';

