# MNUDA Platform Architecture

## Current System Status ✅

This document reflects the current state of the MNUDA platform after successful consolidation and cleanup.

### Active Database Functions
1. **`update_updated_at_column()`** - Generic utility function
   - **Purpose**: Updates `updated_at` timestamp on table updates
   - **Status**: ✅ **ACTIVE** - Essential utility function
   - **Usage**: Used by profiles table trigger

2. **`handle_new_user()`** - Profile creation function
   - **Purpose**: Automatically creates profile when user signs up
   - **Status**: ✅ **ACTIVE** - Core functionality for profiles-only setup
   - **Usage**: Trigger on `auth.users` table

### Active Edge Functions
1. **`send-email`** - Email service function
   - **Purpose**: Sends OTP and magic link emails
   - **Status**: ✅ **ACTIVE** - Essential for authentication
   - **Location**: `/supabase/functions/send-email/`

## Current Architecture

### Database Functions (2 total)
1. `update_updated_at_column()` - Generic timestamp updater
2. `handle_new_user()` - Profile auto-creation

### Edge Functions (1 total)
1. `send-email` - Email service for authentication

### Application Services
- Authentication services (`src/features/auth/`)
- Email services (`src/features/email/`)
- Profile management services
- Workspace management (`src/features/workspaces/`)
- Map functionality (`src/features/map/`)
- API services (`src/features/api/`)

## Platform Benefits

1. **Simplified Architecture**: Clean, focused functionality
2. **Modern Stack**: Next.js 15, React 19, TypeScript 5
3. **Enterprise-Grade**: Feature-based architecture with proper separation
4. **Scalable**: Built for growth and team collaboration
5. **Type-Safe**: Comprehensive TypeScript implementation

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npm run supabase:start
npm run supabase:push
npm run types:generate
```
