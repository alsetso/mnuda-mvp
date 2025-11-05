-- Add missing GRANT permissions for property_notes table
-- Without these, authenticated users cannot access the table even with RLS policies

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_notes TO authenticated;

-- Also ensure properties and people_records have grants (if not already present)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_records TO authenticated;

