# Groups Feature - UI/UX Specification

## Design Principles

1. **Cinematic Motion**: Groups should feel alive with subtle animations
2. **Whitespace as Structure**: Generous spacing creates visual hierarchy
3. **Atomic Components**: Reusable cards, buttons, modals
4. **Consistent Patterns**: Follow existing modal/form patterns from Pins/Areas

---

## Component Specifications

### GroupCard (Atom)

**Purpose**: Display group preview in listings

**Props:**
```typescript
interface GroupCardProps {
  group: Group;
  onJoin?: (groupId: string) => void;
  onView?: (slug: string) => void;
  showJoinButton?: boolean;
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│                                     │
│   [Cover Image - 200px height]     │
│   (Gradient overlay if no image)   │
│                                     │
├─────────────────────────────────────┤
│ 🏠 Group Name Here                 │
│                                     │
│ 1,234 members  •  56 pins  •  12   │
│ areas                               │
│                                     │
│ Brief description of what this group │
│ is about. Max 2 lines, then...      │
│                                     │
│ [Join Group]  [View Details]        │
└─────────────────────────────────────┘
```

**States:**
- **Default**: Hover shows slight elevation
- **Joined**: "Joined" badge, "Leave" button instead of "Join"
- **Loading**: Skeleton loader
- **Private**: Lock icon next to name

**Animations:**
- **Mount**: Fade in + slide up (staggered in grid)
- **Hover**: Scale 1.02, shadow elevation
- **Click**: Ripple effect on button

**Responsive:**
- Desktop: 3 columns (min-width: 1024px)
- Tablet: 2 columns (min-width: 768px)
- Mobile: 1 column (default)

---

### GroupHeader (Molecule)

**Purpose**: Hero section for group detail page

**Props:**
```typescript
interface GroupHeaderProps {
  group: Group;
  currentUserRole?: GroupMemberRole | null;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onSettings: () => void;
  onShare: () => void;
}
```

**Visual Structure:**
```
┌─────────────────────────────────────────────┐
│                                             │
│   [Cover Image - Full Width, 300px height] │
│   (Dark overlay for text readability)      │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │ 🏠 Group Name                       │  │
│   │ 1,234 members • Public • Est. 2024  │  │
│   │                                     │  │
│   │ Brief description of the group...    │  │
│   │                                     │  │
│   │ [Join] [Settings] [Share] [⋯]      │  │
│   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Actions:**
- **Join/Leave**: Primary button (changes based on membership)
- **Settings**: Only visible to owners/admins
- **Share**: Copy link or social share
- **More**: Dropdown with report/archive options

**States:**
- **Not Member**: "Join Group" button (gold-500)
- **Member**: "Leave Group" button (gray-500, outlined)
- **Owner/Admin**: "Settings" button visible
- **Private Group**: Lock icon + "Private" badge

---

### GroupFeed (Organism)

**Purpose**: Group-specific activity feed

**Props:**
```typescript
interface GroupFeedProps {
  groupId: string;
  currentUserId: string;
  canPost: boolean; // Based on membership
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐  │
│ │ What's happening in [Group]?  │  │
│ │ [Type your message...]        │  │
│ │ [Post]                        │  │
│ └───────────────────────────────┘  │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐  │
│ │ [Avatar] John Doe              │  │
│ │ Just added a new pin! 🎯      │  │
│ │ 2h ago                        │  │
│ └───────────────────────────────┘  │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Jane Smith           │  │
│ │ Excited about the new area!   │  │
│ │ 5h ago                        │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Features:**
- **Realtime Updates**: Supabase Realtime subscription
- **Character Limit**: 2000 chars (show counter)
- **Mentions**: `@username` autocomplete
- **Pin/Area Links**: Clickable references to pins/areas
- **Infinite Scroll**: Load more on scroll

**Post Card:**
- Avatar + name
- Content (with markdown support)
- Timestamp (relative: "2h ago")
- Actions: Like, Reply (future), Share

---

### GroupPinsMap (Organism)

**Purpose**: Map view of all group pins

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ [Map Container - Full Height]       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Filters:                    │   │
│  │ [All] [Category 1] [Cat 2] │   │
│  │ [List View] [Map View]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Map with pins clustered]         │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- **Clustering**: Group nearby pins
- **Filter by Category**: Toggle pin categories
- **List/Map Toggle**: Switch between views
- **Pin Popup**: Shows pin details on click
- **Add Pin**: Floating action button (if member)

**Integration:**
- Uses existing `useMap` hook
- Reuses `Pin` components
- Filters pins by `group_pins` association

---

### GroupMembersList (Molecule)

**Purpose**: Display group members with roles

**Props:**
```typescript
interface GroupMembersListProps {
  groupId: string;
  currentUserRole?: GroupMemberRole | null;
  canManageMembers: boolean;
}
```

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ Members (1,234)                    │
│ [Search members...]                │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐  │
│ │ [Avatar] John Doe             │  │
│ │ Owner                         │  │
│ │ Joined Jan 2024              │  │
│ │ [Remove] [Change Role]        │  │
│ └───────────────────────────────┘  │
│ ┌───────────────────────────────┐  │
│ │ [Avatar] Jane Smith          │  │
│ │ Admin                        │  │
│ │ Joined Feb 2024             │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Features:**
- **Role Badges**: Color-coded (Owner: gold, Admin: blue, Member: gray)
- **Search**: Filter by name/email
- **Sort**: By role, join date, name
- **Actions**: Remove member, change role (owners/admins only)
- **Virtual Scrolling**: For large member lists

**Member Card:**
- Avatar (with fallback initials)
- Name + email
- Role badge
- Join date
- Actions (if can manage)

---

### CreateGroupModal (Organism)

**Purpose**: Create new group

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ Create Group              [×]       │
├─────────────────────────────────────┤
│                                     │
│ Group Name *                        │
│ [_____________________________]     │
│                                     │
│ Emoji (optional)                    │
│ [😀] [🏠] [🎯] [📍] [...]          │
│                                     │
│ Description (optional)              │
│ [_____________________________]     │
│ [_____________________________]     │
│ 0/1000 characters                  │
│                                     │
│ Cover Image (optional)              │
│ [Upload Image] or [Remove]          │
│                                     │
│ Visibility                           │
│ ○ Public  ● Private                 │
│                                     │
│ Settings                            │
│ ☑ Allow members to add pins         │
│ ☑ Allow members to add areas        │
│ ☐ Require approval (private only)   │
│                                     │
│ [Cancel]  [Create Group]            │
└─────────────────────────────────────┘
```

**Validation:**
- Name: 3-100 chars, real-time check
- Slug preview: Shows URL-friendly version
- Description: Max 1000 chars, counter
- Cover image: Max 5MB, JPG/PNG

**States:**
- **Loading**: Disable form, show spinner
- **Error**: Show inline error messages
- **Success**: Close modal, redirect to group

---

### InviteMembersModal (Organism)

**Purpose**: Invite members to private group

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ Invite Members to [Group]   [×]    │
├─────────────────────────────────────┤
│                                     │
│ Invite by Email                     │
│ [email@example.com] [Add]           │
│                                     │
│ Or select from existing members     │
│ ┌───────────────────────────────┐  │
│ │ ☐ John Doe (john@example.com) │  │
│ │ ☐ Jane Smith (jane@...)       │  │
│ └───────────────────────────────┘  │
│                                     │
│ Pending Invitations                 │
│ ┌───────────────────────────────┐  │
│ │ email@example.com - Pending   │  │
│ │ [Resend] [Cancel]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ [Cancel]  [Send Invitations]        │
└─────────────────────────────────────┘
```

**Features:**
- **Email Input**: Add multiple emails (comma-separated or one per line)
- **Member Search**: Autocomplete from platform members
- **Pending List**: Show existing pending invitations
- **Bulk Actions**: Select all, remove selected

---

## Page Layouts

### Groups Listing Page (`/groups`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Header: Groups                              │
│ [Create Group Button]                       │
├─────────────────────────────────────────────┤
│ Tabs: [All] [My Groups] [Public] [Private] │
│ Search: [________________] [Sort: Newest ▼] │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │Card │ │Card │ │Card │                    │
│ └─────┘ └─────┘ └─────┘                    │
│ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │Card │ │Card │ │Card │                    │
│ └─────┘ └─────┘ └─────┘                    │
│                                             │
│ [Load More]                                 │
└─────────────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────────┐
│                                             │
│          [Illustration: Empty Groups]      │
│                                             │
│         No groups found                     │
│                                             │
│    Create your first group to get started  │
│                                             │
│         [Create Group]                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Group Detail Page (`/groups/[slug]`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [GroupHeader - Full Width]                 │
├─────────────────────────────────────────────┤
│ Tabs: [Feed] [Pins] [Areas] [Members]      │
├─────────────────────────────────────────────┤
│                                             │
│ Main Content Area (Tab Content)             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Sidebar (Desktop Only):**
```
┌─────────────────┐
│ Group Info      │
│ ─────────────── │
│ 1,234 members   │
│ 56 pins         │
│ 12 areas        │
│                 │
│ Recent Activity │
│ ─────────────── │
│ • John added pin│
│ • Jane joined   │
│                 │
│ Top Members     │
│ ─────────────── │
│ [Avatar] John   │
│ [Avatar] Jane   │
└─────────────────┘
```

---

## Motion & Animation

### Page Transitions
- **Route Change**: Fade out → fade in (300ms)
- **Tab Switch**: Slide left/right (200ms)

### Component Animations
- **Card Mount**: Staggered fade + slide up (100ms delay between cards)
- **Modal Open**: Scale 0.95 → 1.0 + fade (200ms)
- **Modal Close**: Scale 1.0 → 0.95 + fade (150ms)
- **Button Click**: Ripple effect (300ms)
- **Loading State**: Skeleton pulse animation

### Micro-interactions
- **Hover**: Subtle scale (1.0 → 1.02)
- **Focus**: Ring animation (gold-500)
- **Success**: Checkmark animation
- **Error**: Shake animation (300ms)

---

## Responsive Breakpoints

- **Mobile**: < 768px (single column, stacked layout)
- **Tablet**: 768px - 1023px (2 columns, sidebar collapses)
- **Desktop**: ≥ 1024px (3 columns, sidebar visible)

---

## Color Palette

**Primary Actions:**
- Join/Create: `gold-500` (#F59E0B)
- Hover: `gold-600` (#D97706)

**Secondary Actions:**
- Leave/Cancel: `gray-500` (#6B7280)
- Hover: `gray-600` (#4B5563)

**Status Colors:**
- Public: `green-500` (#10B981)
- Private: `purple-500` (#8B5CF6)
- Owner: `gold-500`
- Admin: `blue-500` (#3B82F6)
- Member: `gray-500`

**Backgrounds:**
- Card: `white` / `gray-50` (dark mode: `gray-900` / `gray-800`)
- Modal: `white` / `gray-900` (with backdrop blur)

---

## Typography

**Headings:**
- Group Name: `text-2xl font-bold` (24px)
- Section Title: `text-xl font-semibold` (20px)
- Card Title: `text-lg font-semibold` (18px)

**Body:**
- Description: `text-base text-gray-700` (16px)
- Meta Info: `text-sm text-gray-500` (14px)
- Button: `text-sm font-medium` (14px)

---

## Spacing

**Consistent Padding:**
- Cards: `p-4` (16px)
- Modals: `p-6` (24px)
- Sections: `py-4` (16px vertical)

**Gaps:**
- Card Grid: `gap-4` (16px)
- Form Fields: `space-y-4` (16px)
- Button Groups: `gap-2` (8px)

---

## Accessibility

**Keyboard Navigation:**
- Tab order: Logical flow through form fields
- Enter: Submit form / activate button
- Escape: Close modal
- Arrow keys: Navigate tabs

**Screen Readers:**
- ARIA labels on all interactive elements
- Role announcements for dynamic content
- Live regions for status updates

**Focus Indicators:**
- Visible focus ring (gold-500, 2px)
- Focus trap in modals
- Skip links for main content

---

## Loading States

**Skeleton Loaders:**
- Group cards: Animated placeholder boxes
- Member list: Animated avatar + text lines
- Feed: Animated post cards

**Spinners:**
- Button actions: Inline spinner (replaces text)
- Page load: Full-page spinner with logo
- Infinite scroll: Bottom loading indicator

---

## Error States

**Form Errors:**
- Inline error messages below fields
- Red border on invalid fields
- Summary at top of form

**Empty States:**
- Illustrations for no content
- Helpful messaging
- Clear CTAs

**Error Boundaries:**
- Graceful fallback UI
- Error message with retry option
- Report issue link

---

## Success States

**Toast Notifications:**
- "Group created successfully"
- "Joined [Group Name]"
- "Pin added to group"
- Auto-dismiss after 3 seconds

**Confirmation Dialogs:**
- "Are you sure you want to leave?"
- "Delete group? This cannot be undone."

