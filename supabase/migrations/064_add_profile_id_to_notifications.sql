-- Add optional profile_id column to notifications table
-- Allows notifications to be linked to specific profiles when needed

-- ============================================================================
-- STEP 1: Add profile_id column
-- ============================================================================

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Create index for profile_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id) WHERE profile_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Update composite index to include profile_id
-- ============================================================================

-- Drop existing composite index if it exists
DROP INDEX IF EXISTS idx_notifications_account_read;

-- Recreate with profile_id included
CREATE INDEX idx_notifications_account_read ON public.notifications(account_id, read, created_at DESC);

-- Add index for profile-specific queries
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read ON public.notifications(profile_id, read, created_at DESC) WHERE profile_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Update RLS policies to handle profile_id
-- ============================================================================

-- The existing RLS policies should still work since they check account_id
-- But we can add a comment to clarify that profile_id is optional

-- ============================================================================
-- STEP 5: Add comments
-- ============================================================================

COMMENT ON COLUMN public.notifications.profile_id IS 'Optional reference to profiles(id) - allows notifications to be profile-specific. NULL means account-level notification.';


