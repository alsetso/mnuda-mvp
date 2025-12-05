-- Drop profiles, my_homes, projects, areas, and skip_tracing tables
-- Order matters due to foreign key dependencies

-- ============================================================================
-- STEP 1: Drop projects table (depends on my_homes)
-- ============================================================================

DROP TABLE IF EXISTS public.projects CASCADE;

-- ============================================================================
-- STEP 2: Drop my_homes table (depends on profiles)
-- ============================================================================

DROP TABLE IF EXISTS public.my_homes CASCADE;

-- ============================================================================
-- STEP 3: Drop areas table (depends on profiles)
-- ============================================================================

DROP TABLE IF EXISTS public.areas CASCADE;

-- ============================================================================
-- STEP 4: Drop skip_tracing table (depends on profiles, but profile_id is nullable)
-- ============================================================================

DROP TABLE IF EXISTS public.skip_tracing CASCADE;

-- ============================================================================
-- STEP 5: Drop profile_id foreign key from pins table (if exists)
-- ============================================================================

-- Drop the foreign key constraint if it exists
ALTER TABLE IF EXISTS public.pins
  DROP CONSTRAINT IF EXISTS pins_profile_id_fkey;

-- Note: We keep the profile_id column in pins table for backward compatibility
-- but remove the foreign key constraint since profiles table is being dropped

-- ============================================================================
-- STEP 6: Drop profiles table
-- ============================================================================

DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- STEP 7: Drop user_owns_profile function if it exists (no longer needed)
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_owns_profile(UUID);

-- ============================================================================
-- STEP 8: Drop project_status enum if it exists (was used by projects table)
-- ============================================================================

DROP TYPE IF EXISTS public.project_status CASCADE;



