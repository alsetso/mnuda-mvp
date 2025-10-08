-- Fix public permissions for minnesota_cities table
-- The RLS policy exists but needs to be properly configured for public access

-- Grant SELECT permissions to public role
GRANT SELECT ON public.minnesota_cities TO public;

-- Drop and recreate the policy with proper public access
DROP POLICY IF EXISTS "public read minnesota_cities" ON public.minnesota_cities;
CREATE POLICY "public read minnesota_cities" ON public.minnesota_cities FOR SELECT TO public USING (true);

-- Also ensure the table is accessible to anonymous users (for SEO pages)
GRANT SELECT ON public.minnesota_cities TO anon;
