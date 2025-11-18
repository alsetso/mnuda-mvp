# Groups RLS Policy Specification

## User Types & Statuses

### User Types
1. **Non-member**: Not in group_members table
2. **Pending member**: `approval_status = 'pending'`
3. **Approved member**: `approval_status = 'approved'`
4. **Denied member**: `approval_status = 'denied'`
5. **Owner**: `is_owner = true` (must also be approved member)

### Group Visibility Types
- **public**: Visible in listings, anyone can view/join
- **unlisted**: Not in listings, but accessible via direct link

### Feed Visibility Types
- **public**: Anyone authenticated can view posts
- **members_only**: Only approved members can view posts

### Approval Requirements
- **requires_approval = false**: Instant join (approved immediately)
- **requires_approval = true**: Requires approval (pending status)

---

## User Experiences & Required Permissions

### 1. Viewing Groups

**Public Groups:**
- ✅ Anyone authenticated can view group details
- ✅ Anyone authenticated can view in listings

**Unlisted Groups:**
- ✅ Anyone authenticated can view if they have direct link
- ❌ Not visible in listings (frontend filter)

**Members:**
- ✅ Can view any group they're a member of (regardless of visibility)

**RLS Policy:** `group_visibility IN ('public', 'unlisted') OR user is member`

---

### 2. Joining Groups

**Public/Unlisted Groups with `requires_approval = false`:**
- ✅ User can join directly
- ✅ Creates membership with `approval_status = 'approved'`
- ✅ Can immediately post and view members-only feeds

**Public/Unlisted Groups with `requires_approval = true`:**
- ✅ User can request to join
- ✅ Creates membership with `approval_status = 'pending'`
- ❌ Cannot post until approved
- ❌ Cannot view members-only feeds until approved
- ✅ Can view intake questions
- ✅ Can submit intake responses

**RLS Policy:** 
- INSERT: `user_id = auth.uid() AND group_visibility IN ('public', 'unlisted') AND (approval_status = 'pending' OR (approval_status = 'approved' AND NOT requires_approval))`

---

### 3. Viewing Group Members

**All Users:**
- ✅ Can view approved members of public/unlisted groups
- ✅ Can view members of groups they belong to

**Owners:**
- ✅ Can view all members (pending, approved, denied)
- ✅ Need to see pending members for approval workflow

**RLS Policy:**
- SELECT: `group is public/unlisted OR user is member OR user is owner`

---

### 4. Viewing Group Posts

**Public Feed:**
- ✅ Anyone authenticated can view posts

**Members-Only Feed:**
- ✅ Only approved members can view posts
- ❌ Pending members cannot view
- ❌ Non-members cannot view

**RLS Policy:**
- SELECT: `feed_visibility = 'public' OR (user is approved member)`

---

### 5. Creating Posts

**Requirements:**
- ✅ Must be approved member
- ❌ Pending members cannot post
- ❌ Non-members cannot post

**RLS Policy:**
- INSERT: `user_id = auth.uid() AND user is approved member`

---

### 6. Leaving Groups

**All Members:**
- ✅ Can leave group (delete own membership)
- ✅ Works for pending, approved, or denied status

**RLS Policy:**
- DELETE: `user_id = auth.uid()`

---

### 7. Managing Members (Owners Only)

**Approve/Deny Members:**
- ✅ Owners can update `approval_status` of any member
- ✅ Can change pending → approved or denied
- ✅ Can change denied → approved (re-approval)

**RLS Policy:**
- UPDATE: `user is owner of group`

---

### 8. Intake Questions

**Viewing Questions:**
- ✅ Anyone who can view the group can view questions
- ✅ Needed for join modal

**Managing Questions:**
- ✅ Only owners can create/update/delete questions

**RLS Policy:**
- SELECT: `group is viewable by user`
- ALL (INSERT/UPDATE/DELETE): `user is owner`

---

### 9. Intake Responses

**Viewing Responses:**
- ✅ Users can view their own responses
- ✅ Owners can view all responses for their groups

**Creating Responses:**
- ✅ Users can create responses when joining (pending status)
- ✅ Must be for a question that exists
- ✅ Must be for a group they're joining

**RLS Policy:**
- SELECT: `user_id = auth.uid() OR user is owner`
- INSERT: `user_id = auth.uid() AND user has pending membership`

---

### 10. Updating Groups

**Owners Only:**
- ✅ Can update all group fields
- ✅ Can change visibility settings
- ✅ Can change approval requirements

**RLS Policy:**
- UPDATE: `user is owner`

---

### 11. Deleting Groups

**Owners Only:**
- ✅ Can delete group (cascades to members, posts, etc.)

**RLS Policy:**
- DELETE: `user is owner`

---

## Key RLS Policy Requirements

### groups table
1. SELECT: Viewable if public/unlisted OR user is member
2. INSERT: Authenticated users can create (auto-owner via trigger)
3. UPDATE: Only owners
4. DELETE: Only owners

### group_members table
1. SELECT: Viewable if group is public/unlisted OR user is member OR user is owner (owners see all statuses)
2. INSERT: Users can join public/unlisted groups with correct approval_status
3. UPDATE: Only owners (for approval workflow)
4. DELETE: Users can delete own membership (leave group)

### group_posts table
1. SELECT: Viewable if feed is public OR user is approved member
2. INSERT: Only approved members
3. DELETE: Users can delete own posts

### group_intake_questions table
1. SELECT: Viewable if group is viewable
2. ALL: Only owners

### group_intake_responses table
1. SELECT: Own responses OR owner of group
2. INSERT: Own responses when pending member

---

## Contradictions to Fix

1. **INSERT policy for group_members** - Currently only allows 'pending', but service needs to insert 'approved' when `requires_approval = false`
2. **SELECT policy for group_members** - Owners need to see pending/denied members, not just approved
3. **DELETE policy for group_members** - Need explicit policy for users to leave
4. **SELECT policy for group_posts** - Need to check approval_status, not just membership
5. **Intake questions SELECT** - Should match group visibility rules
6. **Intake responses INSERT** - Should allow when user has pending membership


