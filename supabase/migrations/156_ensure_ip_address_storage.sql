-- Ensure IP address storage is working correctly
-- This migration adds validation and comments to clarify IP address handling

-- ============================================================================
-- STEP 1: Add comment to clarify IP address storage
-- ============================================================================

COMMENT ON COLUMN public.page_views.ip_address IS
  'Client IP address (IPv4 or IPv6). NULL for authenticated users (tracked by account_id). 
   Stored as INET type which handles both IPv4 and IPv6 formats. 
   In development, may show ::1 (localhost). In production, should show real client IPs.';

-- ============================================================================
-- STEP 2: Create function to validate IP address format (helper function)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_valid_ip(ip_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- PostgreSQL INET type will validate, but we can add explicit check
  IF ip_text IS NULL THEN
    RETURN TRUE; -- NULL is valid
  END IF;
  
  -- Try to cast to INET - if it fails, it's invalid
  BEGIN
    PERFORM ip_text::INET;
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: Add constraint to ensure valid IP addresses (optional, can be strict)
-- ============================================================================

-- Note: We're not adding a CHECK constraint because:
-- 1. NULL is valid (for authenticated users)
-- 2. PostgreSQL INET type already validates format
-- 3. We validate in application layer before inserting

-- ============================================================================
-- STEP 4: Create index for IP address queries (if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS page_views_ip_address_idx 
  ON public.page_views(ip_address) 
  WHERE ip_address IS NOT NULL;

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_valid_ip TO anon, authenticated;

COMMENT ON FUNCTION public.is_valid_ip IS
  'Validates if a text string is a valid IP address (IPv4 or IPv6). Returns TRUE for NULL (valid).';

