# Groups Feature - Foundational MVP Rollout

## Core Scope: Public Groups Only

**What We're Building:**
- Create public groups
- Join/leave groups
- View groups listing
- View group detail page with feed
- Basic member list

**What We're NOT Building (Phase 2+):**
- Private groups
- Invitations
- Pin/area associations
- Member roles (just owner/member)
- Group settings
- Search/filters
- Cover images

---

## Database Schema (Minimal)

### `groups` Table
```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT,
  description TEXT CHECK (char_length(description) <= 500),
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_slug ON public.groups(slug);
CREATE INDEX idx_groups_created_at ON public.groups(created_at DESC);
```

### `group_members` Table
```sql
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
```

### `group_posts` Table
```sql
CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_posts_group_id ON public.group_posts(group_id, created_at DESC);
```

### Auto-Generate Slug Function
```sql
CREATE OR REPLACE FUNCTION public.generate_group_slug(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(name_text, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_group_slug_trigger
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.generate_group_slug(NEW.name);
```

### Update Member Count Trigger
```sql
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();
```

### Auto-Add Creator as Owner
```sql
CREATE OR REPLACE FUNCTION public.add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, is_owner)
  VALUES (NEW.id, NEW.created_by, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_group_creator_as_owner_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_creator_as_owner();
```

### RLS Policies

```sql
-- Groups: Public only, anyone can view
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_owner = true
    )
  );

CREATE POLICY "Owners can delete groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_owner = true
    )
  );

-- Group Members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Group Posts
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group posts"
  ON public.group_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can create posts"
  ON public.group_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own posts"
  ON public.group_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
```

---

## Frontend Implementation

### File Structure (Minimal)
```
src/
├── app/
│   └── groups/
│       ├── page.tsx                    # Groups listing
│       └── [slug]/
│           └── page.tsx                # Group detail
│
└── features/
    └── groups/
        ├── components/
        │   ├── GroupCard.tsx           # Listing card
        │   ├── GroupHeader.tsx         # Detail header
        │   ├── GroupFeed.tsx           # Posts feed
        │   ├── GroupMembersList.tsx    # Members list
        │   └── CreateGroupModal.tsx    # Create modal
        │
        ├── hooks/
        │   ├── useGroups.ts            # List groups
        │   └── useGroup.ts             # Single group
        │
        ├── services/
        │   └── groupService.ts         # All CRUD
        │
        └── types.ts
```

### Types (Minimal)
```typescript
export interface Group {
  id: string;
  created_by: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
  current_user_is_member?: boolean;
  current_user_is_owner?: boolean;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}
```

### Service (Minimal)
```typescript
// src/features/groups/services/groupService.ts
import { supabase } from '@/lib/supabase';

export class GroupService {
  static async getAllGroups(): Promise<Group[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Check membership for each group
    if (user) {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, is_owner')
        .eq('user_id', user.id);

      const membershipMap = new Map(
        memberships?.map(m => [m.group_id, m.is_owner]) || []
      );

      return (data || []).map(group => ({
        ...group,
        current_user_is_member: membershipMap.has(group.id),
        current_user_is_owner: membershipMap.get(group.id) === true,
      }));
    }

    return data || [];
  }

  static async getGroupBySlug(slug: string): Promise<Group | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    if (user) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('is_owner')
        .eq('group_id', data.id)
        .eq('user_id', user.id)
        .single();

      return {
        ...data,
        current_user_is_member: !!membership,
        current_user_is_owner: membership?.is_owner === true,
      };
    }

    return data;
  }

  static async createGroup(data: { name: string; emoji?: string; description?: string }): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        created_by: user.id,
        name: data.name.trim(),
        emoji: data.emoji || null,
        description: data.description?.trim() || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...group, current_user_is_member: true, current_user_is_owner: true };
  }

  static async joinGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id, is_owner: false });

    if (error) throw new Error(error.message);
  }

  static async leaveGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:members!group_members_user_id_fkey(id, name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('is_owner', { ascending: false })
      .order('joined_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    const { data, error } = await supabase
      .from('group_posts')
      .select(`
        *,
        user:members!group_posts_user_id_fkey(id, name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async createPost(groupId: string, content: string): Promise<GroupPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('group_posts')
      .insert({
        group_id: groupId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        user:members!group_posts_user_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  }
}
```

---

## Components (Minimal)

### GroupCard
```typescript
// Simple card: emoji + name + member count + join button
interface GroupCardProps {
  group: Group;
  onJoin: () => void;
  onLeave: () => void;
  onView: () => void;
}
```

### GroupHeader
```typescript
// Header: name + description + member count + join/leave button
interface GroupHeaderProps {
  group: Group;
  onJoin: () => void;
  onLeave: () => void;
}
```

### GroupFeed
```typescript
// Simple feed: post input + list of posts (realtime)
interface GroupFeedProps {
  groupId: string;
  canPost: boolean; // is member
}
```

### GroupMembersList
```typescript
// Simple list: avatar + name + owner badge
interface GroupMembersListProps {
  groupId: string;
}
```

### CreateGroupModal
```typescript
// Simple form: name + emoji + description
interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (group: Group) => void;
}
```

---

## Pages (Minimal)

### `/groups` - Listing Page
- Header: "Groups" + "Create Group" button
- Grid of GroupCard components
- Empty state if no groups

### `/groups/[slug]` - Detail Page
- GroupHeader
- Tabs: "Feed" | "Members"
- GroupFeed (Feed tab)
- GroupMembersList (Members tab)

---

## Implementation Checklist

### Database (1-2 hours)
- [ ] Create migration file
- [ ] Run migration
- [ ] Test RLS policies
- [ ] Test triggers

### Services (2-3 hours)
- [ ] Implement groupService.ts
- [ ] Test all CRUD operations
- [ ] Test membership checks

### Components (4-6 hours)
- [ ] GroupCard
- [ ] GroupHeader
- [ ] GroupFeed (with realtime)
- [ ] GroupMembersList
- [ ] CreateGroupModal

### Pages (2-3 hours)
- [ ] Groups listing page
- [ ] Group detail page
- [ ] Navigation link

### Integration (1-2 hours)
- [ ] Add to navigation.ts
- [ ] Test user flows
- [ ] Error handling

### Polish (2-3 hours)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Basic animations

**Total Estimate: 12-19 hours**

---

## Result: What You Get

### User Can:
1. ✅ Create a public group (name, emoji, description)
2. ✅ Browse all groups
3. ✅ Join any public group (one click)
4. ✅ Leave a group
5. ✅ View group detail page
6. ✅ Post to group feed (if member)
7. ✅ See group members list
8. ✅ See real-time feed updates

### User Cannot (Yet):
- ❌ Create private groups
- ❌ Invite members
- ❌ Add pins/areas to groups
- ❌ Change group settings
- ❌ Search/filter groups
- ❌ Upload cover images

---

## Next Phase (After MVP)

1. **Private Groups** (2-3 days)
   - Add `visibility` column
   - Add invitation system
   - Update RLS policies

2. **Pin/Area Integration** (2-3 days)
   - Add `group_pins` and `group_areas` tables
   - Add to group detail page
   - Map integration

3. **Member Roles** (1-2 days)
   - Replace `is_owner` with `role` enum
   - Admin role
   - Permission checks

4. **Group Settings** (2-3 days)
   - Settings modal
   - Update group details
   - Delete group

---

## Success Criteria (MVP)

- ✅ Users can create groups
- ✅ Users can join/leave groups
- ✅ Group feed works with realtime
- ✅ Member list displays correctly
- ✅ No critical bugs
- ✅ Basic mobile responsive

**Launch when:** 10+ groups created, 50+ members total



