# Community Feed Setup Summary

## Overview
The community feed is a public chat system where authenticated members can post messages that are visible to all other authenticated members. Each message displays the author's name and avatar.

## Database Schema

### `community_feed` Table
- **id**: UUID primary key
- **user_id**: UUID foreign key to `auth.users` and `members`
- **message**: TEXT (1-500 characters)
- **created_at**: Timestamp

### RLS Policies (community_feed)
1. **SELECT**: All authenticated users can view all messages
2. **INSERT**: Authenticated users can only insert their own messages

### RLS Policies (members) - Updated
1. **SELECT**: All authenticated users can view all member records (for displaying names/avatars)
2. **UPDATE**: Users can only update their own member record
3. **INSERT**: Users can only insert their own member record

## Security Model

### Authentication Required
- All operations require authentication
- Unauthenticated users cannot view or post messages

### Public Visibility (Within Auth)
- All authenticated members can see all messages
- All authenticated members can see all member profiles (name, avatar)
- Members can only edit their own profile

### Data Integrity
- Foreign key constraint ensures `community_feed.user_id` references `members.id`
- Member records are auto-created when users sign up (via trigger)
- Cascade delete: deleting a user deletes their messages and member record

## Display Logic

### Name Display Priority
1. Full name (first_name + last_name)
2. Username
3. Email prefix (before @)
4. "Anonymous" (fallback)

### Avatar Display
1. `avatar_url` from members table (if available)
2. Initial letter (from first_name, last_name, username, or email)

## Features

### Real-time Updates
- Uses Supabase Realtime for instant message delivery
- New messages appear immediately for all connected users

### Message Limits
- Maximum 500 characters per message
- Minimum 1 character (non-empty)

### Member Record Creation
- Automatic via trigger when user signs up
- Manual creation handled in service if trigger fails
- Migration ensures all existing users have member records

## Migration Files

1. `20250120_create_community_feed.sql` - Creates the feed table
2. `20250120_add_community_feed_members_fk.sql` - Adds FK constraint
3. `20250120_update_members_rls_for_community_feed.sql` - Updates RLS for public member viewing

## Next Steps

After running migrations:
1. Restart Supabase to refresh PostgREST schema cache
2. Test posting messages
3. Verify names and avatars display correctly
4. Test realtime updates



