-- Grant USAGE permissions on sequences for authenticated users
-- This fixes "permission denied for sequence" errors when inserting into tables with SERIAL/BIGSERIAL

-- ============================================================================
-- STEP 1: Grant USAGE on all sequences in public schema
-- ============================================================================

-- Grant USAGE on sequences to authenticated role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant USAGE on sequences to anon role (if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- STEP 2: Set default privileges for future sequences
-- ============================================================================

-- Ensure future sequences are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- ============================================================================
-- STEP 3: Explicitly grant on onboarding_answers sequence
-- ============================================================================

GRANT USAGE, SELECT ON SEQUENCE public.onboarding_answers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.onboarding_answers_id_seq TO anon;

