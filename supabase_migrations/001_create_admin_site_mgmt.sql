-- Create admin_public_site_mgmt table for site-wide configuration
-- This table is public and has no RLS, making it accessible to all users

CREATE TABLE IF NOT EXISTS public.admin_public_site_mgmt (
    id INTEGER PRIMARY KEY DEFAULT 1,
    api_error_banner_enabled BOOLEAN NOT NULL DEFAULT false,
    maintenance_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    new_user_registration_enabled BOOLEAN NOT NULL DEFAULT true,
    premium_features_enabled BOOLEAN NOT NULL DEFAULT true,
    site_wide_notification_enabled BOOLEAN NOT NULL DEFAULT false,
    site_wide_notification_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure only one row exists
ALTER TABLE public.admin_public_site_mgmt ADD CONSTRAINT admin_site_mgmt_single_row CHECK (id = 1);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_site_mgmt_updated_at 
    BEFORE UPDATE ON public.admin_public_site_mgmt 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the initial row with default values
INSERT INTO public.admin_public_site_mgmt (
    id,
    api_error_banner_enabled,
    maintenance_mode_enabled,
    new_user_registration_enabled,
    premium_features_enabled,
    site_wide_notification_enabled,
    site_wide_notification_message
) VALUES (
    1,
    false,
    false,
    true,
    true,
    false,
    null
) ON CONFLICT (id) DO NOTHING;

-- Grant public access (no RLS needed)
GRANT SELECT ON public.admin_public_site_mgmt TO anon, authenticated;
