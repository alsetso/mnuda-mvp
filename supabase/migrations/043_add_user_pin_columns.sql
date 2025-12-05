-- Add columns to pins table for user-created pins
-- The original pins table was for pin types, but we need it to support user-created pins
-- with emoji, address, lat, long, description, subcategory

-- ============================================================================
-- STEP 1: Add emoji column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'emoji'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN emoji TEXT;
    
    COMMENT ON COLUMN public.pins.emoji IS 'Emoji icon for the pin';
    
    RAISE NOTICE 'Added emoji column to pins table';
  ELSE
    RAISE NOTICE 'emoji column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add address column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN address TEXT;
    
    COMMENT ON COLUMN public.pins.address IS 'Address of the pin location';
    
    RAISE NOTICE 'Added address column to pins table';
  ELSE
    RAISE NOTICE 'address column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add lat column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'lat'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN lat NUMERIC(10, 8);
    
    COMMENT ON COLUMN public.pins.lat IS 'Latitude coordinate of the pin';
    
    RAISE NOTICE 'Added lat column to pins table';
  ELSE
    RAISE NOTICE 'lat column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add long column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'long'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN long NUMERIC(11, 8);
    
    COMMENT ON COLUMN public.pins.long IS 'Longitude coordinate of the pin';
    
    RAISE NOTICE 'Added long column to pins table';
  ELSE
    RAISE NOTICE 'long column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add description column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN description TEXT;
    
    COMMENT ON COLUMN public.pins.description IS 'Description of the pin';
    
    RAISE NOTICE 'Added description column to pins table';
  ELSE
    RAISE NOTICE 'description column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add subcategory column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE public.pins
      ADD COLUMN subcategory TEXT;
    
    COMMENT ON COLUMN public.pins.subcategory IS 'Subcategory of the pin';
    
    RAISE NOTICE 'Added subcategory column to pins table';
  ELSE
    RAISE NOTICE 'subcategory column already exists in pins table';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Make original reference table columns nullable for user-created pins
-- ============================================================================

-- Make slug nullable (user-created pins don't need slugs)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'slug'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.pins
      ALTER COLUMN slug DROP NOT NULL;
    
    -- Drop unique constraint on slug since user-created pins won't have slugs
    ALTER TABLE public.pins
      DROP CONSTRAINT IF EXISTS pins_slug_key;
    
    RAISE NOTICE 'Made slug column nullable';
  ELSE
    RAISE NOTICE 'slug column is already nullable or does not exist';
  END IF;
END $$;

-- Make category nullable (user-created pins use tags instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'category'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.pins
      ALTER COLUMN category DROP NOT NULL;
    
    RAISE NOTICE 'Made category column nullable';
  ELSE
    RAISE NOTICE 'category column is already nullable or does not exist';
  END IF;
END $$;

-- Make access_list nullable (user-created pins use visibility instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pins' 
    AND column_name = 'access_list'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.pins
      ALTER COLUMN access_list DROP NOT NULL;
    
    RAISE NOTICE 'Made access_list column nullable';
  ELSE
    RAISE NOTICE 'access_list column is already nullable or does not exist';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Create indexes for user-created pin columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pins_lat_long ON public.pins(lat, long) WHERE lat IS NOT NULL AND long IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pins_profile_id_tag_id ON public.pins(profile_id, tag_id) WHERE profile_id IS NOT NULL AND tag_id IS NOT NULL;

-- ============================================================================
-- STEP 9: Update RLS policies to allow users to create their own pins
-- ============================================================================

-- Drop existing admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert pins" ON public.pins;

-- Policy: Users can insert their own pins (via profile ownership)
CREATE POLICY "Users can insert own pins"
  ON public.pins
  FOR INSERT
  TO authenticated
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

-- Policy: Admins can still insert any pins
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
DROP POLICY IF EXISTS "Admins can update pins" ON public.pins;

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
DROP POLICY IF EXISTS "Admins can delete pins" ON public.pins;

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
-- STEP 10: Update SELECT policy to filter by visibility
-- ============================================================================

-- Drop existing "Anyone can view pins" policy
DROP POLICY IF EXISTS "Anyone can view pins" ON public.pins;

-- Policy: Anyone can view public pins
CREATE POLICY "Anyone can view public pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (visibility = 'public');

-- Policy: Authenticated users can view their own private pins
CREATE POLICY "Users can view own private pins"
  ON public.pins
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'private' AND
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

-- Policy: Admins can view all pins
CREATE POLICY "Admins can view all pins"
  ON public.pins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 11: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;
GRANT SELECT ON public.pins TO anon;

