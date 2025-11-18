# Groups Visibility & Discovery - Current Implementation

## Current MVP: Public Groups Only

### Authentication Requirements

**Viewing Groups:**
- ✅ **Authenticated users**: Can view all groups
- ❌ **Non-authenticated users**: Cannot view groups (redirected to login)

**RLS Policy:**
```sql
CREATE POLICY "Anyone can view groups"
  ON public.groups
  FOR SELECT
  TO authenticated  -- Only authenticated users
  USING (true);     -- Can see all groups
```

**Frontend Protection:**
```typescript
// src/app/groups/page.tsx
if (!user) {
  return <div>Please log in to view groups.</div>;
}
```

---

## How Groups Are Discovered

### 1. **Groups Listing Page** (`/groups`)

**Who can access:**
- ✅ Authenticated users only
- ❌ Non-authenticated users see login prompt

**What they see:**
- All groups in a grid layout
- No filtering or search (yet) - just chronological listing
- Groups sorted by `created_at DESC` (newest first)

**Discovery Flow:**
```
User logs in → Navigates to /groups → Sees all groups → Clicks group → Views detail
```

### 2. **Direct Link Sharing**

**How it works:**
- Each group has a unique slug: `/groups/{slug}`
- Share button copies link to clipboard or uses native share API
- Anyone with the link can access (if authenticated)

**Example:**
```
https://mnuda.com/groups/portland-real-estate-investors
```

**Access Control:**
- ✅ Authenticated users with link: Can view group
- ❌ Non-authenticated users with link: Redirected to login, then to group

### 3. **Navigation Menu**

**Location:**
- Added to main navigation under "Community" category
- Visible to all authenticated users
- Direct link to `/groups` page

---

## Current Visibility Model

### All Groups Are Public (MVP)

**What "Public" means:**
- ✅ Visible to all authenticated users
- ✅ Appears in groups listing
- ✅ Anyone can join (one-click join)
- ✅ No approval required
- ✅ Member list is visible to all
- ✅ Feed posts are visible to all

**What "Public" does NOT mean:**
- ❌ Not visible to non-authenticated users (auth required)
- ❌ Not indexed by search engines (would need public pages)
- ❌ Not shareable to non-users (they must sign up first)

---

## Database Schema (Current)

```sql
CREATE TABLE public.groups (
  -- No visibility column yet (MVP)
  -- All groups are effectively "public" to authenticated users
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- Used for URLs
  ...
);
```

**No `visibility` enum yet** - this would be added in Phase 2 for private groups.

---

## Discovery Mechanisms (Current)

### ✅ Implemented

1. **Groups Listing Page**
   - URL: `/groups`
   - Shows all groups
   - Access: Authenticated users only

2. **Direct Links**
   - Format: `/groups/{slug}`
   - Shareable via share button
   - Access: Authenticated users only

3. **Navigation Menu**
   - "Groups" link in main nav
   - Category: "Community"

### ❌ Not Yet Implemented (Future)

1. **Search**
   - Search by name/description
   - Filter by category/tags

2. **Recommendations**
   - Based on user's pins/areas
   - Based on location
   - Based on similar groups

3. **Trending/Popular**
   - Sort by member count
   - Sort by activity

4. **Categories/Tags**
   - Organize groups by topic
   - Filter by category

---

## Access Control Flow

### Scenario 1: Authenticated User Discovers Group

```
1. User logs in
2. Navigates to /groups (or clicks nav link)
3. Sees all groups in grid
4. Clicks group card
5. Views group detail page
6. Can join immediately (one click)
7. Can view feed and members
8. Can post (if member)
```

### Scenario 2: User Receives Share Link

```
1. User receives link: /groups/portland-investors
2. If not logged in → Redirected to login
3. After login → Redirected to group page
4. Can view group details
5. Can join immediately
```

### Scenario 3: Non-Authenticated User

```
1. Tries to access /groups
2. Frontend check: if (!user) → Show login prompt
3. Cannot view groups until authenticated
```

---

## Future: Private Groups (Phase 2)

### When Private Groups Are Added

**Database Changes:**
```sql
CREATE TYPE group_visibility AS ENUM ('public', 'private');

ALTER TABLE groups ADD COLUMN visibility group_visibility DEFAULT 'public';
```

**Visibility Rules:**

**Public Groups:**
- ✅ Visible in groups listing
- ✅ Discoverable via search
- ✅ Anyone can join
- ✅ Shareable links work

**Private Groups:**
- ❌ NOT visible in groups listing (unless member)
- ❌ NOT discoverable via search (unless member)
- ❌ Require invitation to join
- ✅ Shareable links work (but show "Private" badge)
- ✅ Only members can see content

**RLS Policy (Future):**
```sql
CREATE POLICY "Users can view public groups or groups they belong to"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );
```

---

## Current Limitations

### What Non-Authenticated Users Cannot Do:
- ❌ View groups listing
- ❌ View group detail pages
- ❌ Join groups
- ❌ See group content

### What Authenticated Users Can Do:
- ✅ View all groups
- ✅ Join any group (one click)
- ✅ View all group content
- ✅ Post in groups (after joining)
- ✅ Share groups

---

## SEO & Public Discovery (Future)

### Current State:
- ❌ Groups are not indexed by search engines
- ❌ No public pages for non-authenticated users
- ❌ All content requires authentication

### Future Options:

**Option 1: Public Preview Pages**
- Show group name, description, member count
- Require login to view full content
- Allows search engine indexing

**Option 2: Public Groups Only**
- Make public groups visible to non-authenticated users
- Private groups remain hidden
- Better for SEO and discovery

**Option 3: Keep Current (Auth Required)**
- All groups require authentication
- Better privacy control
- No SEO benefit

---

## Summary

### Current MVP Behavior:

**Visibility:**
- All groups are "public" to authenticated users
- Non-authenticated users cannot see groups
- No private groups yet

**Discovery:**
1. **Groups Listing** (`/groups`) - Main discovery method
2. **Direct Links** - Shareable URLs with slugs
3. **Navigation Menu** - "Groups" link in nav

**Access:**
- ✅ Authenticated: Full access to all groups
- ❌ Non-authenticated: No access (login required)

**Future Enhancements:**
- Private groups with invitations
- Search and filtering
- Categories/tags
- Recommendations
- Public preview pages (optional)


