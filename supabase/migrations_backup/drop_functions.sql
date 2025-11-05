-- Drop specific functions only

-- Drop functions with their exact signatures
DROP FUNCTION IF EXISTS public.extract_email_domain(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_display_name(public.profiles) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_phone_type(text) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_phone_type_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.set_email_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.update_capital_committed() CASCADE;
DROP FUNCTION IF EXISTS public.update_opportunity_status_on_funding() CASCADE;

