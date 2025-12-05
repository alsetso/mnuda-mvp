-- Fix businesses table RLS policies and grants for public access
-- Allow public (anon) users to view all businesses

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (for idempotency)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can insert businesses" ON public.businesses;

-- ============================================================================
-- STEP 2: Add public read policy
-- ============================================================================

CREATE POLICY "Public can view all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- STEP 3: Add admin insert policy
-- ============================================================================

CREATE POLICY "Admins can insert businesses"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 3: Update grants to allow anon users to SELECT
-- ============================================================================

GRANT SELECT ON public.businesses TO anon;

