# Groups Visibility - Better Alternatives to "Private/Hidden"

## The Question

Instead of having groups that are **completely hidden** (can't find unless you're a member), what are better alternatives?

---

## Option 1: "Unlisted" (Recommended)

**Concept**: Like YouTube unlisted videos - not in public listings, but accessible via direct link.

### How It Works:
- ❌ **NOT** in groups listing page
- ❌ **NOT** discoverable via search
- ✅ **Accessible** via direct link (if you have the URL)
- ✅ **Shareable** - owners can share the link
- ✅ **Visible** to members (in "My Groups")

### Use Cases:
- Family groups
- Small private communities
- Test groups
- Groups you want to keep low-key but still shareable

### Implementation:
```sql
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only', 'unlisted');
```

**RLS Policy:**
```sql
-- View groups: public OR invite_only (visible) OR unlisted (if you have link) OR member
CREATE POLICY "Users can view discoverable groups or groups they belong to"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    group_visibility IN ('public', 'invite_only') OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );
```

**Note**: Unlisted groups are accessible via direct link (frontend handles this), but won't appear in listings.

### Pros:
- ✅ More discoverable than "private"
- ✅ Still private enough for most use cases
- ✅ Shareable via link
- ✅ Simple to understand

### Cons:
- ⚠️ If someone shares the link, anyone with it can see it
- ⚠️ Not truly "secret"

---

## Option 2: Just "Invite-Only" (Simplest)

**Concept**: Skip the "hidden" option entirely. Use invite-only for exclusivity.

### How It Works:
- ✅ **Visible** in groups listing (shows "Invite Only" badge)
- ✅ **Discoverable** via search
- ❌ **Cannot join** without invitation
- ✅ **Shareable** links work

### Why This Works:
- **Exclusivity through access control**, not hiding
- Groups are discoverable but gated
- Encourages people to request invites
- Simpler mental model

### Implementation:
```sql
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only');
```

### Pros:
- ✅ Simple (only 2 options)
- ✅ Still provides exclusivity
- ✅ Discoverable (good for growth)
- ✅ Less confusing

### Cons:
- ⚠️ Groups are always visible (if that's a concern)

---

## Option 3: "Unlisted" + "Invite-Only" (Most Flexible)

**Concept**: Combine both - unlisted for hiding, invite-only for access control.

### Three Options:
1. **Public**: Visible, anyone can join
2. **Invite-Only**: Visible, but requires invitation to join
3. **Unlisted**: Hidden from listings, accessible via link only

### Matrix:

| Visibility | In Listing? | Searchable? | Can Join? | Use Case |
|------------|-------------|-------------|-----------|----------|
| Public | ✅ Yes | ✅ Yes | ✅ Anyone | Open community |
| Invite-Only | ✅ Yes | ✅ Yes | ❌ Invite only | Exclusive but discoverable |
| Unlisted | ❌ No | ❌ No | ✅ Anyone (with link) | Private but shareable |

### Implementation:
```sql
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only', 'unlisted');
```

### Pros:
- ✅ Most flexible
- ✅ Covers all use cases
- ✅ Clear separation

### Cons:
- ⚠️ More options = more complexity
- ⚠️ Might be overkill

---

## Option 4: Token-Based Access (Most Private)

**Concept**: Groups accessible only via special token/link.

### How It Works:
- ❌ **NOT** in listings
- ❌ **NOT** searchable
- ✅ **Accessible** only via special token link: `/groups/{id}?token={secret}`
- ✅ **Truly secret** - can't guess the URL

### Implementation:
```sql
ALTER TABLE public.groups
ADD COLUMN access_token TEXT UNIQUE; -- Generated token for secret groups
```

### Pros:
- ✅ Most private option
- ✅ Truly secret
- ✅ Good for sensitive groups

### Cons:
- ⚠️ Complex to implement
- ⚠️ Hard to share (need token)
- ⚠️ Probably overkill for most use cases

---

## Recommendation: **Option 2 (Just Invite-Only)** or **Option 3 (Unlisted + Invite-Only)**

### Why Not "Completely Hidden/Private"?

1. **Discovery is valuable** - Even exclusive groups benefit from being discoverable
2. **Invite-only provides exclusivity** - You don't need to hide to be exclusive
3. **Simpler mental model** - "Public" vs "Invite-Only" is clearer than "Public" vs "Private" vs "Hidden"
4. **Better UX** - Users can see groups exist and request to join

### If You Need More Privacy:

**Use "Unlisted"** instead of "Private":
- Still accessible via link
- Not in public listings
- Shareable when needed
- Simpler than token-based

---

## Final Recommendation

### Start Simple: **Just "Invite-Only"**

```sql
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only');
```

**Why:**
- Covers 90% of use cases
- Simple to understand
- Easy to implement
- Can add "unlisted" later if needed

### If You Need More: Add "Unlisted"

```sql
CREATE TYPE group_visibility AS ENUM ('public', 'invite_only', 'unlisted');
```

**When to add:**
- Users request it
- You have specific use cases that need it
- You want more granular control

---

## Comparison Table

| Option | Complexity | Privacy | Discoverability | Use Case Fit |
|--------|-----------|---------|------------------|--------------|
| **Just Invite-Only** | ⭐ Simple | ⭐⭐ Medium | ⭐⭐⭐ High | ⭐⭐⭐ Best for most |
| **Unlisted** | ⭐⭐ Medium | ⭐⭐⭐ High | ⭐ Low | ⭐⭐ Good for private |
| **Unlisted + Invite-Only** | ⭐⭐⭐ Complex | ⭐⭐⭐ High | ⭐⭐ Medium | ⭐⭐⭐ Most flexible |
| **Token-Based** | ⭐⭐⭐⭐ Very Complex | ⭐⭐⭐⭐ Very High | ⭐ None | ⭐ Overkill |

---

## Decision Framework

**Choose "Just Invite-Only" if:**
- You want simplicity
- Most groups should be discoverable
- Exclusivity through access control is enough

**Add "Unlisted" if:**
- Users need truly hidden groups
- You have use cases like family groups, test groups
- You want link-sharing without public visibility

**Skip "Completely Private/Hidden" because:**
- It's too restrictive
- "Unlisted" provides similar privacy with better UX
- Invite-only already provides exclusivity

---

## Implementation Suggestion

**Phase 1**: Start with `'public'` and `'invite_only'`
- Simple
- Covers most needs
- Easy to add more later

**Phase 2**: Add `'unlisted'` if users request it
- Backward compatible
- Easy to add as third option

**Skip**: Fully private/hidden groups (not needed)


