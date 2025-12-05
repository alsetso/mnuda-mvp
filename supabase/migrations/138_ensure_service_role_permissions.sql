-- Ensure service role has explicit permissions for cities and counties
-- Service role should bypass RLS, but we'll also ensure explicit grants

-- ============================================================================
-- STEP 1: Grant explicit permissions to service_role
-- ============================================================================
-- Service role bypasses RLS, but explicit grants ensure it works

GRANT ALL ON public.cities TO service_role;
GRANT ALL ON public.counties TO service_role;

-- ============================================================================
-- STEP 2: Verify RLS is enabled but service role bypasses it
-- ============================================================================
-- RLS is enabled, but service_role should bypass it automatically
-- The policies below are for authenticated users, not service_role

-- Ensure RLS is enabled
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Verify is_admin() function works correctly
-- ============================================================================

-- Ensure is_admin() function exists and is correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.user_id = auth.uid()
    AND accounts.role = 'admin'::public.account_role
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- STEP 4: Ensure cities policies are correct
-- ============================================================================

-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;

CREATE POLICY "Admins can insert cities"
  ON public.cities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update cities"
  ON public.cities
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete cities"
  ON public.cities
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 5: Ensure counties policies are correct
-- ============================================================================

-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Admins can insert counties" ON public.counties;
DROP POLICY IF EXISTS "Admins can update counties" ON public.counties;
DROP POLICY IF EXISTS "Admins can delete counties" ON public.counties;

CREATE POLICY "Admins can insert counties"
  ON public.counties
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update counties"
  ON public.counties
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete counties"
  ON public.counties
  FOR DELETE
  TO authenticated
  USING (public.is_admin());



