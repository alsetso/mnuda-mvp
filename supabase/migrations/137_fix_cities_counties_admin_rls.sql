-- Fix RLS policies for cities and counties to ensure admins can update
-- Use is_admin() function for consistency

-- ============================================================================
-- STEP 1: Drop existing cities RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;

-- ============================================================================
-- STEP 2: Recreate cities RLS policies using is_admin() function
-- ============================================================================

-- Policy: Admins can insert cities
CREATE POLICY "Admins can insert cities"
  ON public.cities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy: Admins can update cities
CREATE POLICY "Admins can update cities"
  ON public.cities
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Admins can delete cities
CREATE POLICY "Admins can delete cities"
  ON public.cities
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 3: Verify counties policies (they already use is_admin(), but ensure they exist)
-- ============================================================================

-- Drop and recreate to ensure consistency
DROP POLICY IF EXISTS "Admins can insert counties" ON public.counties;
DROP POLICY IF EXISTS "Admins can update counties" ON public.counties;
DROP POLICY IF EXISTS "Admins can delete counties" ON public.counties;

-- Policy: Admins can insert counties
CREATE POLICY "Admins can insert counties"
  ON public.counties
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy: Admins can update counties
CREATE POLICY "Admins can update counties"
  ON public.counties
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Admins can delete counties
CREATE POLICY "Admins can delete counties"
  ON public.counties
  FOR DELETE
  TO authenticated
  USING (public.is_admin());



