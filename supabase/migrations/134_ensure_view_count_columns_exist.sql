-- Ensure view_count columns exist on cities and counties
-- This migration is idempotent and safe to run multiple times

-- ============================================================================
-- STEP 1: Add view_count to cities if it doesn't exist
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cities' 
    AND column_name = 'view_count'
  ) THEN
    ALTER TABLE public.cities
      ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    
    ALTER TABLE public.cities
      ADD CONSTRAINT cities_view_count_non_negative CHECK (view_count >= 0);
    
    CREATE INDEX IF NOT EXISTS cities_view_count_idx
      ON public.cities (view_count DESC)
      WHERE view_count > 0;
    
    COMMENT ON COLUMN public.cities.view_count IS 'Total number of page views for this city';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add view_count to counties if it doesn't exist
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'counties' 
    AND column_name = 'view_count'
  ) THEN
    ALTER TABLE public.counties
      ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    
    ALTER TABLE public.counties
      ADD CONSTRAINT counties_view_count_non_negative CHECK (view_count >= 0);
    
    CREATE INDEX IF NOT EXISTS counties_view_count_idx
      ON public.counties (view_count DESC)
      WHERE view_count > 0;
    
    COMMENT ON COLUMN public.counties.view_count IS 'Total number of page views for this county';
  END IF;
END $$;



