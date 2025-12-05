-- Implement 5-Intent Pin System
-- Universal pin system driven by user intent (have, need, offer, sell, share)
-- All pins share the same table with intent field and metadata JSONB for profile-specific data

-- ============================================================================
-- STEP 1: Create pin_intent enum (if it doesn't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pin_intent' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.pin_intent AS ENUM (
      'have',
      'need',
      'offer',
      'sell',
      'share'
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Backup existing user-created pins data
-- ============================================================================

-- Drop backup table if it exists (we'll recreate it)
DROP TABLE IF EXISTS public.pins_user_backup;

-- Create backup table, handling both 'long' and 'lng' column names
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns G
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'long'
  ) THEN
    -- Use 'long' column if it exists
    EXECUTE 'CREATE TABLE public.pins_user_backup AS
      SELECT 
        id,
        profile_id,
        tag_id,
        emoji,
        name,
        description,
        address,
        lat,
        long,
        subcategory,
        status,
        visibility,
        created_at,
        updated_at
      FROM public.pins 
      WHERE profile_id IS NOT NULL';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lng'
  ) THEN
    -- Use 'lng' column if it exists
    EXECUTE 'CREATE TABLE public.pins_user_backup AS
      SELECT 
        id,
        profile_id,
        tag_id,
        emoji,
        name,
        description,
        address,
        lat,
        lng,
        subcategory,
        status,
        visibility,
        created_at,
        updated_at
      FROM public.pins 
      WHERE profile_id IS NOT NULL';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add new columns to pins table (if they don't exist)
-- ============================================================================

-- Add intent column (nullable for reference pins, required for user pins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'intent'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN intent public.pin_intent;
  END IF;
END $$;

-- Add category as TEXT (optional deep classification, different from pin_category enum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'category_text'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN category_text TEXT;
  END IF;
END $$;

-- Add metadata JSONB for profile-specific data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add title field (will replace name for user-created pins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN title TEXT;
  END IF;
END $$;

-- Add lng column if it doesn't exist (we'll migrate data then drop long)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lng'
  ) THEN
    ALTER TABLE public.pins ADD COLUMN lng NUMERIC(11, 8);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Migrate existing user-created pins data
-- ============================================================================

-- For existing user-created pins, migrate data to new structure
-- Default intent to 'have' for existing pins (can be updated later)
DO $$
BEGIN
  -- Migrate data: copy long to lng if long exists and lng is null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'long'
  ) THEN
    UPDATE public.pins
    SET lng = long
    WHERE profile_id IS NOT NULL AND lng IS NULL AND long IS NOT NULL;
  END IF;

  -- Migrate other fields
  UPDATE public.pins
  SET 
    intent = 'have'::public.pin_intent,
    title = COALESCE(title, name),
    category_text = COALESCE(category_text, subcategory),
    metadata = CASE
      WHEN metadata IS NULL OR metadata = '{}'::jsonb THEN
        jsonb_build_object(
          'emoji', emoji,
          'address', address,
          'tag_id', CASE WHEN tag_id IS NOT NULL THEN tag_id::text ELSE NULL END
        )
      ELSE metadata
    END
  WHERE profile_id IS NOT NULL AND intent IS NULL;
END $$;

-- Rename long to lng for consistency (if column exists and lng doesn't)
-- Now that data is migrated, we can drop long if lng exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'long'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lng'
  ) THEN
    ALTER TABLE public.pins DROP COLUMN long;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'long'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lng'
  ) THEN
    ALTER TABLE public.pins RENAME COLUMN long TO lng;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Make intent required for user-created pins (via constraint)
-- ============================================================================

-- Add check constraint: user-created pins must have intent (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pins_user_pins_require_intent'
  ) THEN
    ALTER TABLE public.pins
      ADD CONSTRAINT pins_user_pins_require_intent
      CHECK (
        (profile_id IS NULL) OR (intent IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Create indexes for new fields (if they don't exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pins_intent ON public.pins(intent) WHERE intent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_category_text ON public.pins(category_text) WHERE category_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_metadata ON public.pins USING GIN(metadata) WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_pins_title ON public.pins(title) WHERE title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_lat_lng ON public.pins(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Composite index for map queries (intent + category + location)
CREATE INDEX IF NOT EXISTS idx_pins_intent_category_location ON public.pins(intent, category_text, lat, lng) 
  WHERE intent IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- ============================================================================
-- STEP 6b: Clean up backup table
-- ============================================================================

DROP TABLE IF EXISTS public.pins_user_backup;

-- ============================================================================
-- STEP 7: Update RLS policies to work with intent-based system
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert own pins" ON public.pins;
DROP POLICY IF EXISTS "Users can view own private pins" ON public.pins;

-- Policy: Users can insert their own pins (must have intent and profile_id)
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IS NOT NULL AND
    intent IS NOT NULL AND
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

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON TYPE public.pin_intent IS 'Pin intent enum: have, need, offer, sell, share. Intent drives the form UI and map filtering.';
COMMENT ON COLUMN public.pins.intent IS 'User intent: have, need, offer, sell, share. Required for user-created pins, nullable for reference pins.';
COMMENT ON COLUMN public.pins.category_text IS 'Optional deep classification (e.g., real_estate, job, service, community, safety). Different from pin_category enum which is for reference pins.';
COMMENT ON COLUMN public.pins.metadata IS 'JSONB storing profile-specific data. Examples: property details, service types, deal terms, alert severity, etc.';
COMMENT ON COLUMN public.pins.title IS 'Pin title (replaces name for user-created pins). Name field retained for reference pins.';
COMMENT ON COLUMN public.pins.lng IS 'Longitude (renamed from long for consistency).';

-- ============================================================================
-- STEP 9: Update table comment
-- ============================================================================

COMMENT ON TABLE public.pins IS 'Universal pins table supporting both reference pins (slug/category) and user-created pins (intent/metadata). Intent drives form UI, profile_type determines allowed categories and validation.';

