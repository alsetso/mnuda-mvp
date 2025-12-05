-- Remove foreign key constraints from location_searches table
-- This removes the visual connection lines in Supabase schema viewer
-- while keeping the columns as logical references

-- Drop foreign key constraints if they exist
ALTER TABLE public.location_searches 
  DROP CONSTRAINT IF EXISTS fk_location_searches_user;

ALTER TABLE public.location_searches 
  DROP CONSTRAINT IF EXISTS fk_location_searches_profile;

-- Update comments to clarify these are logical references, not FK constraints
COMMENT ON COLUMN public.location_searches.user_id IS 
  'Logical reference to auth.users(id). No FK constraint - references maintained at application level.';

COMMENT ON COLUMN public.location_searches.profile_id IS 
  'Logical reference to profiles(id). Optional - can be null. No FK constraint - references maintained at application level.';


