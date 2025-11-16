# Map Chat Widget Authenticity Audit

## Overview
The Map Chat Widget (upper right on community map page) uses Supabase Realtime broadcast channels for ephemeral, real-time messaging. Messages are **NOT persisted** to the database.

## Architecture

### Implementation
- **Service**: `src/features/community/services/mapChatService.ts`
- **Component**: `src/features/community/components/MapChatWidget.tsx`
- **Channel**: `map:lobby:messages` (Supabase Realtime broadcast)
- **Persistence**: None - broadcast-only, ephemeral messages

### Message Flow
1. User sends message → `MapChatService.sendMessage()`
2. Service fetches user metadata from `members` table (read-only)
3. Message object constructed client-side with:
   - `id`: Client-generated (`Date.now() + random`)
   - `user_id`: From `auth.getUser()` (authenticated)
   - `message`: User input (trimmed, max 250 chars)
   - `timestamp`: Client-generated (`new Date().toISOString()`)
   - `author`: From `members` table lookup
4. Message broadcast via `channel.send()` to all subscribers
5. No database write occurs

## Security Analysis

### ✅ Secure Aspects
1. **Authentication Required**: `auth.getUser()` check prevents unauthenticated sends
2. **User ID Validation**: `user_id` comes from auth context, not client input
3. **Member Data Lookup**: Author metadata fetched from database (read-only)
4. **Message Length Validation**: Client-side 250 char limit enforced

### ⚠️ Security Concerns

#### 1. **Public Broadcast Channel** (Medium Risk)
```23:24:src/features/community/services/mapChatService.ts
 * Uses Supabase Realtime broadcast for ephemeral, real-time chat on the map page
 * Messages are not persisted to database - they're broadcast-only
```

```46:47:src/features/community/services/mapChatService.ts
    // Using 'private: false' for public broadcast (all authenticated users can join)
    // For production, you might want 'private: true' with proper access control
```

**Issue**: Channel is public (any authenticated user can join and broadcast)
**Risk**: No access control beyond authentication
**Recommendation**: Consider private channels with explicit access policies if needed

#### 2. **Client-Side Message Construction** (Low-Medium Risk)
```126:136:src/features/community/services/mapChatService.ts
    const message: MapChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      message: data.message.trim(),
      timestamp: new Date().toISOString(),
      author: {
        name: member?.name || undefined,
        email: member?.email || user.email || undefined,
        avatar_url: member?.avatar_url || undefined,
      },
    };
```

**Issue**: Message ID, timestamp, and structure are client-generated
**Risk**: 
- Potential for ID collisions (low probability)
- Timestamp can be manipulated (cosmetic only, no functional impact)
- No server-side validation of message structure
**Mitigation**: 
- `user_id` is from auth context (secure)
- Author metadata is from database lookup (secure)
- Message content is validated client-side

#### 3. **No Rate Limiting** (Medium Risk)
**Issue**: No visible rate limiting on message sends
**Risk**: Potential for spam/abuse
**Recommendation**: Implement client-side throttling or server-side rate limits

#### 4. **No Message Validation Beyond Length** (Low Risk)
```97:103:src/features/community/services/mapChatService.ts
    if (!data.message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (data.message.length > 250) {
      throw new Error('Message cannot exceed 250 characters');
    }
```

**Issue**: Only length validation, no content filtering
**Risk**: Inappropriate content, XSS potential (if not sanitized in display)
**Recommendation**: Add content sanitization in the widget component

### 🔒 Authentication & Authorization
- ✅ Requires authentication (`auth.getUser()` check)
- ✅ User ID from auth context (not client input)
- ✅ Member data from database (read-only lookup)
- ⚠️ No additional authorization checks beyond authentication

## Message Persistence

### Map Chat Messages
**Status**: **NOT PERSISTED**
- Messages exist only in memory while users are connected
- No database table for map chat messages
- Messages lost on disconnect/refresh
- Cannot view historical messages in Supabase

### Community Feed Messages (Different System)
**Status**: **PERSISTED**
- Table: `public.community_feed`
- View in Supabase: Table Editor → `community_feed`
- Schema:
  - `id` (UUID)
  - `user_id` (UUID, FK to auth.users)
  - `message` (TEXT, 1-500 chars)
  - `created_at` (TIMESTAMP)

## Where to View Messages in Supabase

### Map Chat Messages
**Cannot be viewed** - they are not saved to the database. They only exist in realtime broadcast channels while users are connected.

### Community Feed Messages (Persisted)
1. Open Supabase Dashboard
2. Navigate to **Table Editor**
3. Select **`community_feed`** table
4. View all persisted messages with:
   - Message content
   - User ID (author)
   - Creation timestamp
   - Join with `members` table to see author names/avatars

## Recommendations

### High Priority
1. **Add Content Sanitization**: Sanitize message content before display to prevent XSS
2. **Implement Rate Limiting**: Add client-side throttling (e.g., max 1 message per second)

### Medium Priority
3. **Consider Private Channels**: If access control is needed, use private channels with policies
4. **Server-Side Validation**: Add Edge Function or Database Function to validate messages if persistence is added

### Low Priority
5. **Message ID Generation**: Use UUID instead of timestamp+random for better uniqueness
6. **Timestamp Validation**: If persistence is added, use server-side timestamps

## Conclusion

The Map Chat Widget is **authentic** in that:
- User identity is verified via authentication
- Author metadata comes from database (not client input)
- Messages are ephemeral (no persistence)

**Security posture**: Acceptable for ephemeral chat, but consider improvements for production use (rate limiting, content sanitization).

**Message viewing**: Map chat messages cannot be viewed in Supabase as they are not persisted. Use the `community_feed` table to view saved community messages.

