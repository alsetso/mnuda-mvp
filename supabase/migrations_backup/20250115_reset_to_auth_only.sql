-- Reset Database to Clean State
-- This migration drops all tables and functions, keeping only Supabase auth

-- Drop all tables (cascade will handle dependencies)
DROP TABLE IF EXISTS public.opportunity_contributions CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.call_logs CASCADE;
DROP TABLE IF EXISTS public.email_addresses CASCADE;
DROP TABLE IF EXISTS public.phone_numbers CASCADE;
DROP TABLE IF EXISTS public.contact_logs CASCADE;
DROP TABLE IF EXISTS public.contact_entities CASCADE;
DROP TABLE IF EXISTS public.property_notes CASCADE;
DROP TABLE IF EXISTS public.property_docs CASCADE;
DROP TABLE IF EXISTS public.people_records CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.api_call_history CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS opportunity_status CASCADE;
DROP TYPE IF EXISTS funding_model CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.send_email(JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.is_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.extract_email_domain(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_display_name(public.profiles) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_phone_type(text) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_phone_type_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.set_email_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.update_capital_committed() CASCADE;
DROP FUNCTION IF EXISTS public.update_opportunity_status_on_funding() CASCADE;

-- Drop triggers (if they exist independently)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS normalize_phone_type_trigger ON public.phone_numbers CASCADE;
DROP TRIGGER IF EXISTS set_email_metadata ON public.email_addresses CASCADE;
DROP TRIGGER IF EXISTS update_capital_committed ON public.opportunity_contributions CASCADE;
DROP TRIGGER IF EXISTS update_opportunity_status_on_funding ON public.opportunities CASCADE;

-- Keep only Supabase auth schema (managed by Supabase)
-- All custom tables, functions, and triggers are removed

-- Note: RLS policies will be automatically dropped with tables
-- Note: Storage buckets and policies remain (you may want to clean those separately)

