# Groups Visibility & Feed Visibility - Design Document

## Overview

We need to add two independent visibility controls:
1. **Group Visibility**: Controls who can discover and join the group
2. **Feed Visibility**: Controls who can view the group's feed posts

These are **independent settings** that can be combined in different ways.

---

## Visibility Options

### Group Visibility (Discovery & Joining)

**Public** (default):
- ✅ Visible in groups listing page
- ✅ Discoverable via search (future)
- ✅ Anyone can join (one-click join)
- ✅ Shareable links work for anyone
- ✅ Group details visible to all authenticated users

**Invite-Only**:
- ✅ Visible in groups listing (but shows "Invite Only" badge)
- ✅ Discoverable via search (future)
- ❌ **Cannot join directly** - must be invited
- ✅ Shareable links work (but show "Request to Join" instead of "Join")
- ✅ Group details visible to all authenticated users
- ✅ Owners/admins can send invitations
- ✅ Users can request to join (optional feature)

### Feed Visibility (Post Viewing)

**Public** (default):
- ✅ Anyone (authenticated users) can view posts
- ✅ Posts visible even if not a member
- ✅ Good for community engagement and discovery

**Members-Only**:
- ❌ Only members can view posts
- ❌ Non-members see "Join to view feed" message
- ✅ Better privacy for internal discussions
- ✅ Encourages membership for content access

---

## Combined Scenarios

### Scenario 1: Public Group + Public Feed
**Use Case**: Open community, public discussions
- Anyone can see group
- Anyone can join
- Anyone can view posts
- **Example**: "Minnesota Real Estate Investors" - open community

### Scenario 2: Public Group + Members-Only Feed
**Use Case**: Open to join, but private discussions
- Anyone can see group
- Anyone can join
- Only members can view posts
- **Example**: "Local Investment Club" - join freely, but discussions are private

### Scenario 3: Invite-Only Group + Public Feed
**Use Case**: Exclusive group, but public content
- Only invited users can join
- Anyone can view posts (if they have link)
- **Example**: "VIP Investor Network" - exclusive membership, but public showcase

### Scenario 4: Invite-Only Group + Members-Only Feed
**Use Case**: Fully private group
- Only invited users can join
- Only members can view posts
- **Example**: "Private Deal Flow Group" - completely private

---

## Database Schema

### Option 1: Two Separate ENUMs (Recommended)

```sql
-- Group visibility (discovery & joining)
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only');

-- Feed visibility (post viewing)
CREATE TYPE feed_visibility AS ENUM ('public', 'members_only');

ALTER TABLE public.groups
ADD COLUMN group_visibility group_visibility NOT NULL DEFAULT 'public',
ADD COLUMN feed_visibility feed_visibility NOT NULL DEFAULT 'public';
```

**Pros:**
- Clear separation of concerns
- Easy to understand
- Flexible combinations
- Simple queries

**Cons:**
- Two columns to manage
- More RLS policies needed

### Option 2: Single Combined ENUM

```sql
CREATE TYPE group_access_type AS ENUM (
  'public_public',      -- public group, public feed
  'public_members',     -- public group, members-only feed
  'invite_public',      -- invite-only group, public feed
  'invite_members'      -- invite-only group, members-only feed
);
```

**Pros:**
- Single column
- All combinations explicit

**Cons:**
- Less flexible (hard to change one without the other)
- More complex to query
- Not intuitive

**Recommendation: Option 1** - Two separate ENUMs for flexibility and clarity.

---

## Invitations System

For **invite-only** groups, we need an invitations table:

```sql
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- If inviting specific user
  email TEXT, -- If inviting by email (user not registered yet)
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text, -- For email invitations
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, invited_user_id) -- One invitation per user per group
);
```

**Invitation Flow:**
1. Owner/admin sends invitation (by user ID or email)
2. If by email: User receives link with token
3. User accepts invitation → automatically joins group
4. Invitation marked as "accepted"

**Optional: Join Requests**
- Users can request to join invite-only groups
- Owners/admins can approve/deny requests
- Requires additional `group_join_requests` table

---

## RLS Policies

### Groups Table

```sql
-- View groups: public groups OR groups user is member of OR groups user is invited to
CREATE POLICY "Users can view public groups or their groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    group_visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.group_invitations
      WHERE group_id = groups.id 
      AND (invited_user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND status = 'pending'
    )
  );
```

### Group Members Table

```sql
-- Join groups: public groups OR if invited
CREATE POLICY "Users can join public groups or if invited"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_id AND group_visibility = 'public'
      ) OR
      EXISTS (
        SELECT 1 FROM public.group_invitations
        WHERE group_id = group_members.group_id
        AND (invited_user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        AND status = 'pending'
      )
    )
  );
```

### Group Posts Table

```sql
-- View posts: if feed is public OR if user is member
CREATE POLICY "Users can view posts if feed is public or they are members"
  ON public.group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_posts.group_id
      AND (
        feed_visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_id = group_posts.group_id AND user_id = auth.uid()
        )
      )
    )
  );
```

---

## UI/UX Considerations

### Group Listing Page (`/groups`)

**Public Groups:**
- Show "Join" button
- Normal card display

**Invite-Only Groups:**
- Show "Invite Only" badge
- Show "Request to Join" button (if not invited) OR "Join" button (if invited)
- Show lock icon or different styling

### Group Detail Page

**Public Group + Public Feed:**
- Show "Join" button
- Show full feed to everyone
- Show member list

**Public Group + Members-Only Feed:**
- Show "Join" button
- Show "Join to view feed" message if not member
- Show feed only if member

**Invite-Only Group + Public Feed:**
- Show "Request to Join" or "Join" (if invited) button
- Show full feed to everyone (public feed)
- Show member list

**Invite-Only Group + Members-Only Feed:**
- Show "Request to Join" or "Join" (if invited) button
- Show "Join to view feed" message if not member
- Show feed only if member

### Settings Page

**Group Visibility Toggle:**
- Radio buttons: "Public" / "Invite Only"
- Warning when changing from public to invite-only
- Show invitation management UI if invite-only

**Feed Visibility Toggle:**
- Radio buttons: "Public" / "Members Only"
- Explanation of what each means

---

## Migration Strategy

### Phase 1: Add Columns (Backward Compatible)
1. Add `group_visibility` and `feed_visibility` columns with defaults
2. All existing groups become "public" + "public"
3. Update RLS policies
4. No breaking changes

### Phase 2: Add Invitations (If Needed)
1. Create `group_invitations` table
2. Add invitation management UI
3. Update join flow

### Phase 3: Add Join Requests (Optional)
1. Create `group_join_requests` table
2. Add request/approval UI

---

## Edge Cases & Questions

### Q1: Can non-members see member list?
**A:** Yes, for both public and invite-only groups. Member list visibility is separate from feed visibility.

### Q2: What happens when owner changes visibility?
**A:** 
- Group visibility: Existing members stay, but new joins follow new rules
- Feed visibility: Immediately affects who can see posts

### Q3: Can invite-only groups be discovered?
**A:** Yes, they appear in listing but show "Invite Only" badge. This encourages discovery while maintaining exclusivity.

### Q4: What about anonymous users?
**A:** Current system requires authentication. Future: Could show public groups to anonymous users (preview only).

### Q5: Should we allow feed visibility to be "invite-only" (only invited users)?
**A:** Probably not needed - "members-only" covers this since only invited users become members.

---

## Recommended Implementation Order

1. **Add database columns** (group_visibility, feed_visibility)
2. **Update RLS policies** for groups and posts
3. **Update service layer** to handle visibility checks
4. **Update UI components** to show appropriate buttons/messages
5. **Add settings UI** for owners to change visibility
6. **Add invitations system** (if needed for invite-only)
7. **Add join requests** (optional)

---

## Summary

**Two Independent Settings:**
- `group_visibility`: 'public' | 'invite_only'
- `feed_visibility`: 'public' | 'members_only'

**Key Benefits:**
- Flexible combinations for different use cases
- Clear separation of concerns
- Backward compatible (defaults to public/public)
- Scalable (can add more options later)

**Next Steps:**
1. Review and approve this design
2. Create migration for columns
3. Update RLS policies
4. Implement UI changes


