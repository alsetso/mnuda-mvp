-- Fix public permissions for cities, counties, and zips tables
-- The RLS policies exist but the public role needs explicit SELECT permissions

-- Grant SELECT permissions to public role
GRANT SELECT ON public.cities TO public;
GRANT SELECT ON public.counties TO public;
GRANT SELECT ON public.zips TO public;
GRANT SELECT ON public.city_zips TO public;

-- Ensure the policies are correctly set
DROP POLICY IF EXISTS "public read cities" ON public.cities;
CREATE POLICY "public read cities" ON public.cities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public read counties" ON public.counties;
CREATE POLICY "public read counties" ON public.counties FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public read zips" ON public.zips;
CREATE POLICY "public read zips" ON public.zips FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "public read city_zips" ON public.city_zips;
CREATE POLICY "public read city_zips" ON public.city_zips FOR SELECT TO public USING (true);
