# Admin Site Management Setup

This document explains how to set up and use the `admin_public_site_mgmt` table for site-wide configuration management.

## Overview

The `admin_public_site_mgmt` table is a single-row table that allows you to toggle various site features without deploying code changes. It's designed to be public (no RLS) so all users can read the configuration, but only admins should be able to modify it.

## Database Setup

### 1. Run the SQL Migration

Execute the SQL in `supabase_migrations/001_create_admin_site_mgmt.sql` in your Supabase dashboard:

```sql
-- The migration creates:
-- - admin_public_site_mgmt table with boolean flags
-- - Single row constraint (id = 1)
-- - Auto-updating timestamp trigger
-- - Initial row with default values
-- - Public read access
```

### 2. Verify the Table

After running the migration, you should have a table with these columns:

- `id` (INTEGER, PRIMARY KEY) - Always 1
- `api_error_banner_enabled` (BOOLEAN) - Show API error banner
- `maintenance_mode_enabled` (BOOLEAN) - Enable maintenance mode
- `new_user_registration_enabled` (BOOLEAN) - Allow new user signups
- `premium_features_enabled` (BOOLEAN) - Enable premium features
- `site_wide_notification_enabled` (BOOLEAN) - Show site-wide notification
- `site_wide_notification_message` (TEXT) - Custom notification message
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

## Usage

### 1. Add Admin Banners to Your Layout

Add the `AdminBanners` component to your main layout:

```tsx
// In your layout.tsx or main page component
import { AdminBanners } from '@/components/AdminBanners';

export default function Layout({ children }) {
  return (
    <div>
      <AdminBanners />
      {children}
    </div>
  );
}
```

### 2. Use Configuration Hooks

Use the provided hooks to conditionally show/hide features:

```tsx
import { useRegistrationEnabled, usePremiumFeaturesEnabled } from '@/components/AdminBanners';

function SignupButton() {
  const registrationEnabled = useRegistrationEnabled();
  
  if (!registrationEnabled) {
    return <p>Registration is currently disabled</p>;
  }
  
  return <button>Sign Up</button>;
}

function PremiumFeature() {
  const premiumEnabled = usePremiumFeaturesEnabled();
  
  if (!premiumEnabled) {
    return <p>Premium features are currently disabled</p>;
  }
  
  return <div>Premium content here</div>;
}
```

### 3. Admin Panel

Use the `AdminPanel` component to manage settings:

```tsx
import { AdminPanel } from '@/components/AdminPanel';

// Add this to an admin-only page
function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <AdminPanel />
    </div>
  );
}
```

### 4. Direct Service Usage

You can also use the service directly:

```tsx
import { AdminSiteMgmtService } from '@/features/shared/services/adminSiteMgmtService';

// Get current configuration
const config = await AdminSiteMgmtService.getSiteConfig();

// Toggle API error banner
await AdminSiteMgmtService.toggleApiErrorBanner(true);

// Update multiple settings
await AdminSiteMgmtService.updateSiteConfig({
  maintenance_mode_enabled: true,
  site_wide_notification_enabled: true,
  site_wide_notification_message: "We'll be back soon!"
});
```

## Security Considerations

### Public Read Access
- The table is public and readable by all users
- This is intentional - it allows the frontend to conditionally show/hide features
- No sensitive data should be stored in this table

### Write Access Control
- Only authenticated admin users should be able to modify the table
- Consider adding RLS policies for write operations if needed
- Or restrict write access through your application's admin interface

### Example RLS Policy (Optional)

If you want to add write protection:

```sql
-- Enable RLS
ALTER TABLE public.admin_public_site_mgmt ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON public.admin_public_site_mgmt
  FOR SELECT USING (true);

-- Restrict write access to authenticated users only
CREATE POLICY "Admin write access" ON public.admin_public_site_mgmt
  FOR ALL USING (auth.role() = 'authenticated');
```

## Available Configuration Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `api_error_banner_enabled` | Show banner when API is down | `false` |
| `maintenance_mode_enabled` | Enable maintenance mode | `false` |
| `new_user_registration_enabled` | Allow new user signups | `true` |
| `premium_features_enabled` | Enable premium features | `true` |
| `site_wide_notification_enabled` | Show custom notification | `false` |
| `site_wide_notification_message` | Custom notification text | `null` |

## Real-time Updates

The `useSiteConfig` hook automatically subscribes to database changes, so configuration updates are reflected immediately across all connected clients without requiring a page refresh.

## Troubleshooting

### Table Not Found
- Ensure you've run the SQL migration in your Supabase dashboard
- Check that the table exists in the `public` schema

### Permission Denied
- Verify that the table has public read access
- Check your Supabase anon key permissions

### Real-time Not Working
- Ensure real-time is enabled for the table in Supabase
- Check that your Supabase project has real-time enabled

### TypeScript Errors
- Run `npm run build` to regenerate types from your database schema
- Or manually update the types in `src/types/supabase.ts`
