# Groups RLS Fix Summary

## Issues Fixed

### 1. Group Members INSERT Policy
**Problem:** Policy only allowed `approval_status = 'pending'`, but service needs to insert `'approved'` when `requires_approval = false`.

**Fix:** Policy now allows both:
- `approval_status = 'approved'` when `requires_approval = false`
- `approval_status = 'pending'` when `requires_approval = true`

### 2. Group Members SELECT Policy
**Problem:** Only showed approved members, but owners need to see pending/denied members for approval workflow.

**Fix:** Policy now:
- Owners see all members (pending, approved, denied)
- Regular users see approved members of viewable groups
- Users see their own membership regardless of status

### 3. Group Posts SELECT Policy
**Problem:** Didn't check `approval_status`, so pending members could view members-only feeds.

**Fix:** Policy now checks `approval_status = 'approved'` for members-only feeds.

### 4. Group Members DELETE Policy
**Problem:** Missing explicit policy for users to leave groups.

**Fix:** Added explicit DELETE policy allowing users to delete their own membership.

### 5. Intake Questions SELECT Policy
**Problem:** Policy didn't match group visibility rules.

**Fix:** Policy now matches group visibility (public/unlisted OR user is approved member).

### 6. Intake Responses INSERT Policy
**Problem:** Policy didn't properly check for pending membership.

**Fix:** Policy now requires:
- User is creating their own response
- User has pending membership
- Question exists for the group

## Migration File

The fix is in: `supabase/migrations/20250126_fix_groups_rls.sql`

This migration:
1. Drops all existing conflicting policies
2. Creates correct policies based on user experience requirements
3. Ensures no contradictions

## Testing Checklist

After applying the migration, verify:

- [ ] Non-members can view public groups
- [ ] Non-members can view unlisted groups via direct link
- [ ] Non-members can join groups with `requires_approval = false` (instant approval)
- [ ] Non-members can request to join groups with `requires_approval = true` (pending status)
- [ ] Pending members can view intake questions
- [ ] Pending members can submit intake responses
- [ ] Pending members CANNOT view members-only feeds
- [ ] Pending members CANNOT create posts
- [ ] Approved members can view members-only feeds
- [ ] Approved members can create posts
- [ ] Owners can view all members (pending, approved, denied)
- [ ] Owners can approve/deny members
- [ ] Users can leave groups (delete own membership)
- [ ] Users can view their own intake responses
- [ ] Owners can view all intake responses for their groups

## User Experience Matrix

| User Type | View Group | Join Group | View Feed (Public) | View Feed (Members-Only) | Create Post | View Members | Manage Members |
|-----------|------------|------------|-------------------|------------------------|-------------|--------------|----------------|
| Non-member | ✅ (public/unlisted) | ✅ | ✅ | ❌ | ❌ | ✅ (approved only) | ❌ |
| Pending | ✅ | N/A | ✅ | ❌ | ❌ | ✅ (approved only) | ❌ |
| Approved | ✅ | N/A | ✅ | ✅ | ✅ | ✅ (all) | ❌ |
| Owner | ✅ | N/A | ✅ | ✅ | ✅ | ✅ (all) | ✅ |


