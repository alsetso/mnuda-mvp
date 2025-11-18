# Groups Feature Design - Mnuda Platform

## Overview
Groups enable users to create public and private communities around shared interests, locations, or goals. Groups integrate with existing features (pins, areas, community feed) to create collaborative spaces.

---

## Backend Architecture

### Database Schema

#### `groups` Table
```sql
CREATE TYPE public.group_visibility AS ENUM ('public', 'private');
CREATE TYPE public.group_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (auto-generated from name)
  emoji TEXT, -- Optional emoji icon (max 2 chars)
  description TEXT CHECK (char_length(description) <= 1000),
  cover_image_url TEXT,
  
  -- Visibility & Access
  visibility public.group_visibility NOT NULL DEFAULT 'public',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  
  -- Settings
  allow_member_pins BOOLEAN NOT NULL DEFAULT true, -- Members can add pins to group
  allow_member_areas BOOLEAN NOT NULL DEFAULT true, -- Members can add areas to group
  require_approval BOOLEAN NOT NULL DEFAULT false, -- Require approval for new members (private groups only)
  
  -- Metadata
  member_count INTEGER NOT NULL DEFAULT 1, -- Denormalized for performance
  pin_count INTEGER NOT NULL DEFAULT 0,
  area_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_visibility ON public.groups(visibility);
CREATE INDEX idx_groups_slug ON public.groups(slug);
CREATE INDEX idx_groups_created_at ON public.groups(created_at DESC);
CREATE INDEX idx_groups_member_count ON public.groups(member_count DESC); -- For trending/popular groups
```

#### `group_members` Table (Many-to-Many)
```sql
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  PRIMARY KEY (group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_role ON public.group_members(group_id, role);
```

#### `group_pins` Table (Many-to-Many)
```sql
CREATE TABLE public.group_pins (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (group_id, pin_id)
);

CREATE INDEX idx_group_pins_group_id ON public.group_pins(group_id);
CREATE INDEX idx_group_pins_pin_id ON public.group_pins(pin_id);
```

#### `group_areas` Table (Many-to-Many)
```sql
CREATE TABLE public.group_areas (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (group_id, area_id)
);

CREATE INDEX idx_group_areas_group_id ON public.group_areas(group_id);
CREATE INDEX idx_group_areas_area_id ON public.group_areas(area_id);
```

#### `group_posts` Table (Group-specific feed)
```sql
CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_posts_group_id ON public.group_posts(group_id, created_at DESC);
CREATE INDEX idx_group_posts_user_id ON public.group_posts(user_id);
```

#### `group_invitations` Table (For private groups)
```sql
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email of invitee (may not be a member yet)
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text, -- For invite links
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX idx_group_invitations_token ON public.group_invitations(token);
CREATE INDEX idx_group_invitations_email ON public.group_invitations(email);
```

### RLS Policies

#### Groups
```sql
-- Public groups: visible to all authenticated users
-- Private groups: visible only to members
CREATE POLICY "Users can view public groups or groups they belong to"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Owners and admins can update groups
CREATE POLICY "Owners and admins can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete groups
CREATE POLICY "Only owners can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id 
      AND user_id = auth.uid() 
      AND role = 'owner'
    )
  );
```

#### Group Members
```sql
-- Members can view members of groups they belong to
CREATE POLICY "Members can view group members"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid()
    )
  );

-- Users can join public groups or accept invitations
CREATE POLICY "Users can join public groups or accept invitations"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      -- Public group: anyone can join
      EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_id AND visibility = 'public'
      ) OR
      -- Private group: must have valid invitation
      EXISTS (
        SELECT 1 FROM public.group_invitations
        WHERE group_id = group_members.group_id
        AND email = (SELECT email FROM public.members WHERE id = auth.uid())
        AND status = 'pending'
        AND expires_at > NOW()
      )
    )
  );

-- Owners/admins can update member roles
CREATE POLICY "Owners and admins can update member roles"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('owner', 'admin')
    )
  );

-- Users can leave groups, owners/admins can remove members
CREATE POLICY "Users can leave or be removed from groups"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('owner', 'admin')
    )
  );
```

### Database Functions & Triggers

```sql
-- Auto-generate slug from name
CREATE OR REPLACE FUNCTION public.generate_group_slug(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(name_text, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure uniqueness
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert
CREATE TRIGGER generate_group_slug_trigger
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.generate_group_slug(NEW.name);

-- Function to update member_count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Function to auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_group_creator_as_owner_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_creator_as_owner();
```

---

## Frontend Architecture

### File Structure
```
src/
├── app/
│   └── groups/
│       ├── page.tsx                    # Groups listing page
│       ├── [slug]/
│       │   ├── page.tsx                # Group detail page
│       │   └── layout.tsx              # Group-specific layout
│       └── new/
│           └── page.tsx                # Create group page
│
├── features/
│   └── groups/
│       ├── components/
│       │   ├── GroupCard.tsx           # Atom: Group card for listings
│       │   ├── GroupHeader.tsx         # Molecule: Group header with actions
│       │   ├── GroupSidebar.tsx        # Organism: Group sidebar with members/pins/areas
│       │   ├── GroupFeed.tsx            # Organism: Group-specific feed
│       │   ├── GroupMembersList.tsx     # Molecule: Member list with roles
│       │   ├── GroupPinsMap.tsx         # Organism: Map showing group pins
│       │   ├── GroupAreasMap.tsx        # Organism: Map showing group areas
│       │   ├── CreateGroupModal.tsx     # Organism: Create group modal
│       │   ├── EditGroupModal.tsx        # Organism: Edit group modal
│       │   ├── InviteMembersModal.tsx   # Organism: Invite members modal
│       │   ├── JoinGroupButton.tsx      # Atom: Join/leave button
│       │   └── GroupSettingsModal.tsx   # Organism: Group settings
│       │
│       ├── hooks/
│       │   ├── useGroups.ts             # Fetch and manage groups
│       │   ├── useGroup.ts              # Fetch single group with members/pins/areas
│       │   ├── useGroupMembers.ts       # Manage group members
│       │   ├── useGroupPins.ts          # Manage group pins
│       │   └── useGroupFeed.ts          # Group feed with realtime
│       │
│       ├── services/
│       │   ├── groupService.ts          # CRUD operations for groups
│       │   ├── groupMemberService.ts    # Member management
│       │   ├── groupPinService.ts       # Pin associations
│       │   ├── groupAreaService.ts      # Area associations
│       │   └── groupInvitationService.ts # Invitation management
│       │
│       ├── types.ts                     # TypeScript types
│       └── index.ts                     # Public exports
```

### TypeScript Types

```typescript
// src/features/groups/types.ts

export type GroupVisibility = 'public' | 'private';
export type GroupMemberRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: string;
  created_by: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  cover_image_url: string | null;
  visibility: GroupVisibility;
  is_archived: boolean;
  allow_member_pins: boolean;
  allow_member_areas: boolean;
  require_approval: boolean;
  member_count: number;
  pin_count: number;
  area_count: number;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  creator?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  current_user_role?: GroupMemberRole | null; // User's role if member
  is_member?: boolean;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  invited_by: string | null;
  
  // Populated fields
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export interface CreateGroupData {
  name: string;
  emoji?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  visibility?: GroupVisibility;
  allow_member_pins?: boolean;
  allow_member_areas?: boolean;
  require_approval?: boolean;
}

export interface UpdateGroupData {
  name?: string;
  emoji?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  visibility?: GroupVisibility;
  allow_member_pins?: boolean;
  allow_member_areas?: boolean;
  require_approval?: boolean;
  is_archived?: boolean;
}
```

### Service Layer

```typescript
// src/features/groups/services/groupService.ts

export class GroupService {
  /**
   * Get all public groups and groups user belongs to
   */
  static async getAllGroups(): Promise<Group[]>;
  
  /**
   * Get groups user belongs to
   */
  static async getUserGroups(): Promise<Group[]>;
  
  /**
   * Get group by slug with populated data
   */
  static async getGroupBySlug(slug: string): Promise<Group | null>;
  
  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupData): Promise<Group>;
  
  /**
   * Update group (owners/admins only)
   */
  static async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group>;
  
  /**
   * Delete group (owners only)
   */
  static async deleteGroup(groupId: string): Promise<void>;
  
  /**
   * Search groups by name/description
   */
  static async searchGroups(query: string): Promise<Group[]>;
}
```

---

## UI/UX Design

### Groups Listing Page (`/groups`)

**Layout:**
- **Header**: "Groups" title, "Create Group" CTA button
- **Filters**: 
  - Tabs: "All Groups" | "My Groups" | "Public" | "Private"
  - Search bar
  - Sort: "Newest" | "Most Members" | "Most Active"
- **Grid Layout**: Responsive card grid (3 columns desktop, 2 tablet, 1 mobile)
- **Empty State**: Illustration + "Create your first group" CTA

**Group Card Design:**
```
┌─────────────────────────────┐
│ [Cover Image]                │
│                              │
├─────────────────────────────┤
│ 🏠 Group Name               │
│ 1,234 members • 56 pins     │
│                             │
│ Brief description of the     │
│ group's purpose...          │
│                             │
│ [Join] [View]               │
└─────────────────────────────┘
```

**Motion:**
- Cards fade in with stagger animation
- Hover: slight scale + shadow elevation
- Click: smooth transition to detail page

### Group Detail Page (`/groups/[slug]`)

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ [Cover Image with Overlay]              │
│ 🏠 Group Name                           │
│ 1,234 members • Public                 │
│ [Join/Leave] [Settings] [Share]        │
├─────────────────────────────────────────┤
│ Tabs: Feed | Pins | Areas | Members     │
├─────────────────────────────────────────┤
│                                         │
│ Main Content Area                       │
│ (Feed/Pins Map/Areas Map/Members List) │
│                                         │
└─────────────────────────────────────────┘
```

**Tabs:**
1. **Feed**: Group-specific posts (similar to community feed)
2. **Pins**: Map view showing all pins associated with group
3. **Areas**: Map view showing all areas associated with group
4. **Members**: Grid/list of members with roles, avatars

**Sidebar (on larger screens):**
- Group info card
- Quick stats (members, pins, areas)
- Recent activity
- Member avatars preview

### Create Group Modal

**Form Fields:**
- Name (required, 3-100 chars)
- Emoji picker (optional)
- Description (optional, max 1000 chars)
- Cover image upload (optional)
- Visibility toggle (Public/Private)
- Settings:
  - ☑ Allow members to add pins
  - ☑ Allow members to add areas
  - ☑ Require approval for new members (private only)

**Validation:**
- Real-time slug preview
- Name uniqueness check
- Character count indicators

### Group Settings Modal

**Sections:**
1. **General**: Name, emoji, description, cover image
2. **Privacy**: Visibility, require approval
3. **Permissions**: Member pin/area permissions
4. **Members**: Manage members, roles, invitations
5. **Danger Zone**: Archive group, delete group

---

## Feature Integration

### With Pins
- **Add Pin to Group**: Pin detail modal includes "Add to Group" dropdown
- **Group Pin Filter**: Map can filter pins by group
- **Group Pin Count**: Shows on group card and detail page

### With Areas
- **Add Area to Group**: Area sidebar includes "Add to Group" action
- **Group Area Overlay**: Map can show areas for selected group
- **Group Area Count**: Shows on group card and detail page

### With Community Feed
- **Group Posts**: Separate feed per group (similar to community_feed)
- **Cross-post**: Option to post to both community feed and group feed
- **Group Mentions**: `@group-name` mentions in community feed

### With Map
- **Group Layer Toggle**: Toggle visibility of group pins/areas on map
- **Group Filter**: Filter pins/areas by selected groups
- **Group Boundaries**: Visual boundaries for group-specific areas

---

## User Flows

### Creating a Group
1. User clicks "Create Group" button
2. Modal opens with form
3. User fills name, description, selects visibility
4. On submit:
   - Group created
   - User auto-added as owner
   - Redirect to group detail page
   - Success toast notification

### Joining a Public Group
1. User browses groups listing
2. Clicks "Join" on a public group
3. Instant join (no approval needed)
4. User added as member
5. Group appears in "My Groups"
6. Success toast: "Joined [Group Name]"

### Joining a Private Group
1. User finds private group (if visible)
2. Clicks "Request to Join"
3. If `require_approval = false`: Instant join
4. If `require_approval = true`: 
   - Request sent to group admins
   - User sees "Pending" status
   - Admin receives notification
   - Admin approves/denies
   - User notified of decision

### Inviting to Private Group
1. Owner/admin opens "Invite Members" modal
2. Enters email addresses or selects from members list
3. Invitations sent (email + in-app notification)
4. Invitee receives email with invite link
5. Invitee clicks link → auto-joins group
6. Invitation marked as accepted

### Adding Pin to Group
1. User views pin detail (on map or in list)
2. Clicks "Add to Group" button
3. Dropdown shows groups user belongs to
4. User selects group(s)
5. Pin associated with group(s)
6. Pin appears in group's "Pins" tab
7. Group pin count increments

---

## Performance Considerations

### Database Optimization
- **Denormalized Counts**: `member_count`, `pin_count`, `area_count` updated via triggers
- **Composite Indexes**: `(group_id, created_at DESC)` for feed queries
- **Materialized Views**: Consider for trending/popular groups (refresh every hour)

### Frontend Optimization
- **Virtual Scrolling**: For long member lists
- **Pagination**: Groups listing, feed posts, pins/areas
- **Lazy Loading**: Group detail tabs load on demand
- **Optimistic Updates**: Join/leave actions update UI immediately
- **Realtime Subscriptions**: Only subscribe to groups user belongs to

### Caching Strategy
- **Group Metadata**: Cache for 5 minutes
- **Member Lists**: Cache for 2 minutes
- **Feed Posts**: Real-time via Supabase Realtime
- **Pin/Area Associations**: Cache until user action

---

## Security Considerations

### Access Control
- **RLS Policies**: Enforce at database level
- **Role-Based Actions**: Frontend checks roles before showing actions
- **Invitation Expiry**: Invitations expire after 30 days
- **Rate Limiting**: Prevent spam group creation (max 10 groups per user)

### Data Privacy
- **Private Groups**: Not discoverable via search
- **Member Lists**: Only visible to group members
- **Email Privacy**: Invitations don't expose emails to non-members

---

## Future Enhancements (Phase 2+)

1. **Group Categories/Tags**: Organize groups by topic
2. **Group Events**: Calendar integration for group meetups
3. **Group Analytics**: Member activity, pin/area growth
4. **Group Templates**: Pre-configured group types (e.g., "Neighborhood Watch", "Real Estate Investors")
5. **Group Chat**: Real-time chat per group (separate from feed)
6. **Group Files**: Shared document storage
7. **Group Polls**: Voting on group decisions
8. **Group Badges**: Achievement system for active members
9. **Group Recommendations**: ML-based group suggestions
10. **Group Merging**: Combine similar groups

---

## Implementation Phases

### Phase 1: Core Groups (MVP)
- [ ] Database schema & migrations
- [ ] RLS policies
- [ ] Basic CRUD services
- [ ] Groups listing page
- [ ] Group detail page (Feed tab only)
- [ ] Create/join groups
- [ ] Basic member management

### Phase 2: Integration
- [ ] Pin-to-group association
- [ ] Area-to-group association
- [ ] Group pins/areas map views
- [ ] Group feed with realtime

### Phase 3: Advanced Features
- [ ] Private groups with invitations
- [ ] Member roles & permissions
- [ ] Group settings
- [ ] Search & filters

### Phase 4: Polish
- [ ] Animations & transitions
- [ ] Empty states
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile optimization

---

## Navigation Updates

Add to `src/config/navigation.ts`:
```typescript
{
  name: 'Groups',
  href: '/groups',
  icon: UserGroupIcon,
  description: 'Join communities and collaborate on shared interests',
  category: 'Community',
}
```

---

## API Endpoints (Optional - if using API routes)

```
GET    /api/groups                    # List groups
POST   /api/groups                    # Create group
GET    /api/groups/[id]               # Get group
PATCH  /api/groups/[id]               # Update group
DELETE /api/groups/[id]               # Delete group
POST   /api/groups/[id]/join          # Join group
POST   /api/groups/[id]/leave         # Leave group
GET    /api/groups/[id]/members       # List members
POST   /api/groups/[id]/invite        # Invite members
POST   /api/groups/[id]/pins          # Add pin to group
DELETE /api/groups/[id]/pins/[pinId]  # Remove pin from group
```

---

## Design Tokens

Use existing design system:
- **Colors**: `gold-500` for primary actions, `gray-900` for text
- **Spacing**: Consistent with existing modals/forms
- **Typography**: Match existing headings/body text
- **Motion**: Framer Motion for animations (consistent with existing patterns)

---

## Testing Considerations

### Unit Tests
- Service layer functions
- Slug generation
- Permission checks

### Integration Tests
- Group creation flow
- Member join/leave
- Pin/area associations
- RLS policy enforcement

### E2E Tests
- Create group → add members → add pins → view group
- Private group invitation flow
- Group settings updates

---

## Accessibility

- **Keyboard Navigation**: All modals/forms keyboard accessible
- **Screen Readers**: ARIA labels for all actions
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: Meet WCAG AA standards
- **Alt Text**: Cover images have descriptive alt text

---

## Analytics Events

Track key actions:
- `group_created`
- `group_joined`
- `group_left`
- `pin_added_to_group`
- `area_added_to_group`
- `group_invitation_sent`
- `group_settings_updated`


