-- Fix script for page_entity_type enum error
-- Run this if migration 162 fails with "type page_entity_type does not exist"

-- ============================================================================
-- STEP 1: Create enum if it doesn't exist (from migration 127)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.page_entity_type AS ENUM (
    'post',
    'article',
    'city',
    'county',
    'profile',
    'account',
    'business',
    'page'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add 'page' value if it doesn't exist
-- ============================================================================

DO $$ 
BEGIN
  -- Check if 'page' value exists in the enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'page' 
    AND enumtypid = 'public.page_entity_type'::regtype
  ) THEN
    ALTER TYPE public.page_entity_type ADD VALUE 'page';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Verify the enum exists and has the 'page' value
-- ============================================================================

SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'page_entity_type'
ORDER BY e.enumsortorder;

