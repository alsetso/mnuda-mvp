-- Grant permissions on my_homes table
-- This migration adds the necessary GRANT statements that were missing

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_homes TO authenticated;



