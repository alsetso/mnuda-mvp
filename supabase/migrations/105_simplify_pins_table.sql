-- Simplify pins table by removing unnecessary columns
-- This migration removes legacy fields while preserving user-created pins data

-- ============================================================================
-- STEP 1: Drop all RLS policies first (they may reference columns we're removing)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'pins'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pins', r.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Drop dependent objects that reference columns we're removing
-- ============================================================================

-- Drop indexes on columns we're removing
DROP INDEX IF EXISTS idx_pins_slug;
DROP INDEX IF EXISTS idx_pins_category;
DROP INDEX IF EXISTS idx_pins_access_list;
DROP INDEX IF EXISTS idx_pins_created_by;
DROP INDEX IF EXISTS idx_pins_intent;
DROP INDEX IF EXISTS idx_pins_intent_category_location;
DROP INDEX IF EXISTS idx_pins_category_text;

-- Drop constraints on columns we're removing
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_user_pins_require_intent;
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS pins_user_pins_require_tag_id;
ALTER TABLE public.pins DROP CONSTRAINT IF EXISTS tags_slug_entity_type_unique;

-- ============================================================================
-- STEP 3: Remove unnecessary columns
-- ============================================================================

-- Remove reference pin fields (not needed for user-created pins)
ALTER TABLE public.pins DROP COLUMN IF EXISTS slug;
ALTER TABLE public.pins DROP COLUMN IF EXISTS access_list;
ALTER TABLE public.pins DROP COLUMN IF EXISTS category; -- pin_category enum column

-- Remove legacy intent system fields
ALTER TABLE public.pins DROP COLUMN IF EXISTS intent;
ALTER TABLE public.pins DROP COLUMN IF EXISTS category_text;
ALTER TABLE public.pins DROP COLUMN IF EXISTS metadata;
ALTER TABLE public.pins DROP COLUMN IF EXISTS title;

-- Remove expiration fields (not currently used)
ALTER TABLE public.pins DROP COLUMN IF EXISTS expires;
ALTER TABLE public.pins DROP COLUMN IF EXISTS expiration_date;

-- Remove created_by (we use profile_id instead)
ALTER TABLE public.pins DROP COLUMN IF EXISTS created_by;

-- Remove category_id (we use tag_id instead)
ALTER TABLE public.pins DROP COLUMN IF EXISTS category_id;

-- Remove 'long' column if it exists (we use 'lng')
ALTER TABLE public.pins DROP COLUMN IF EXISTS long;

-- ============================================================================
-- STEP 4: Ensure required columns exist and have correct constraints
-- ============================================================================

-- Ensure lng column exists (should already exist from migration 046)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lng'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN lng NUMERIC(11, 8);
    
    -- Migrate data from long if it still exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'pins' 
      AND column_name = 'long'
    ) THEN
      UPDATE public.pins SET lng = long WHERE lng IS NULL AND long IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Ensure profile_id is NOT NULL for user-created pins
-- (We'll allow NULL for now to preserve any reference pins, but new pins require it)
DO $$
BEGIN
  -- Only make NOT NULL if all existing rows have profile_id
  IF NOT EXISTS (
    SELECT 1 FROM public.pins WHERE profile_id IS NULL
  ) THEN
    ALTER TABLE public.pins ALTER COLUMN profile_id SET NOT NULL;
  END IF;
END $$;

-- Ensure tag_id is NOT NULL for user-created pins
DO $$
BEGIN
  -- Only make NOT NULL if all existing rows have tag_id
  IF NOT EXISTS (
    SELECT 1 FROM public.pins WHERE tag_id IS NULL
  ) THEN
    ALTER TABLE public.pins ALTER COLUMN tag_id SET NOT NULL;
  END IF;
END $$;

-- Ensure lat and lng are NOT NULL
DO $$
BEGIN
  -- Only make NOT NULL if all existing rows have values
  IF NOT EXISTS (
    SELECT 1 FROM public.pins WHERE lat IS NULL OR lng IS NULL
  ) THEN
    ALTER TABLE public.pins ALTER COLUMN lat SET NOT NULL;
    ALTER TABLE public.pins ALTER COLUMN lng SET NOT NULL;
  END IF;
END $$;

-- Simplify status and visibility to TEXT with CHECK constraints
-- Drop old enum types if they exist and replace with simple TEXT
DO $$
BEGIN
  -- Change status to TEXT if it's an enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'status'
    AND udt_name != 'text'
  ) THEN
    ALTER TABLE public.pins 
      ALTER COLUMN status TYPE TEXT USING status::text;
  END IF;
  
  -- Add CHECK constraint for status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pins_status_check'
  ) THEN
    ALTER TABLE public.pins 
      ADD CONSTRAINT pins_status_check 
      CHECK (status IN ('active', 'draft', 'archived'));
  END IF;
END $$;

DO $$
BEGIN
  -- Change visibility to TEXT if it's an enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'visibility'
    AND udt_name != 'text'
  ) THEN
    ALTER TABLE public.pins 
      ALTER COLUMN visibility TYPE TEXT USING visibility::text;
  END IF;
  
  -- Add CHECK constraint for visibility
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pins_visibility_check'
  ) THEN
    ALTER TABLE public.pins 
      ADD CONSTRAINT pins_visibility_check 
      CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Update indexes
-- ============================================================================

-- Drop old index on lat, long
DROP INDEX IF EXISTS idx_pins_lat_long;

-- Create index on lat, lng if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pins_lat_lng ON public.pins(lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Ensure other essential indexes exist
CREATE INDEX IF NOT EXISTS idx_pins_profile_id ON public.pins(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_tag_id ON public.pins(tag_id) WHERE tag_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_profile_tag ON public.pins(profile_id, tag_id) WHERE profile_id IS NOT NULL AND tag_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_status ON public.pins(status);
CREATE INDEX IF NOT EXISTS idx_pins_visibility ON public.pins(visibility);
CREATE INDEX IF NOT EXISTS idx_pins_created_at ON public.pins(created_at DESC);

-- ============================================================================
-- STEP 6: Create RLS policies
-- ============================================================================

-- Ensure user_owns_profile function exists
CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    INNER JOIN public.accounts a ON a.id = p.account_id
    WHERE p.id = profile_id
    AND a.user_id = current_user_id
  );
END;
$$;

-- Ensure function is owned by postgres
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'user_owns_profile'
    AND p.proowner != (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  ) THEN
    ALTER FUNCTION public.user_owns_profile(UUID) OWNER TO postgres;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.user_owns_profile(UUID) TO authenticated, anon;

-- Policy: Anyone can view public pins or their own pins
CREATE POLICY "Anyone can view public pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (
    visibility = 'public' 
    OR (profile_id IS NOT NULL AND public.user_owns_profile(profile_id))
  );

-- Policy: Users can insert their own pins
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IS NOT NULL AND
    tag_id IS NOT NULL AND
    public.user_owns_profile(profile_id)
  );

-- Policy: Users can update their own pins
CREATE POLICY "Users can update own pins"
  ON public.pins
  FOR UPDATE
  TO authenticated
  USING (profile_id IS NOT NULL AND public.user_owns_profile(profile_id))
  WITH CHECK (profile_id IS NOT NULL AND public.user_owns_profile(profile_id));

-- Policy: Users can delete their own pins
CREATE POLICY "Users can delete own pins"
  ON public.pins
  FOR DELETE
  TO authenticated
  USING (profile_id IS NOT NULL AND public.user_owns_profile(profile_id));

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all pins"
  ON public.pins
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
-- STEP 7: Add comments
-- ============================================================================

COMMENT ON TABLE public.pins IS 'User-created pins on the map. Each pin belongs to a profile and has a tag.';
COMMENT ON COLUMN public.pins.profile_id IS 'Profile that created this pin (required for user-created pins)';
COMMENT ON COLUMN public.pins.tag_id IS 'Tag for categorizing the pin (required for user-created pins)';
COMMENT ON COLUMN public.pins.name IS 'Name of the pin (required)';
COMMENT ON COLUMN public.pins.lat IS 'Latitude (required)';
COMMENT ON COLUMN public.pins.lng IS 'Longitude (required)';
COMMENT ON COLUMN public.pins.status IS 'Status: active, draft, or archived';
COMMENT ON COLUMN public.pins.visibility IS 'Visibility: public or private';
