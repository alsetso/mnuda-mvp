# Groups Feature - Quick Overview

## What is Groups?

Groups enable users to create **public and private communities** around shared interests, locations, or goals. Groups integrate with existing features (pins, areas, community feed) to create collaborative spaces.

---

## Key Features

### Core Functionality
- ✅ Create public or private groups
- ✅ Join/leave groups
- ✅ Group-specific feed (posts)
- ✅ Add pins/areas to groups
- ✅ Member roles (owner, admin, member)
- ✅ Invitations for private groups

### Integration Points
- **Pins**: Add pins to groups, filter pins by group
- **Areas**: Add areas to groups, filter areas by group
- **Map**: Toggle group layers, filter by group
- **Community Feed**: Separate group feeds

---

## Database Schema

### Core Tables
- `groups` - Group metadata (name, description, visibility, settings)
- `group_members` - Many-to-many: users ↔ groups (with roles)
- `group_pins` - Many-to-many: groups ↔ pins
- `group_areas` - Many-to-many: groups ↔ areas
- `group_posts` - Group-specific feed posts
- `group_invitations` - Invitations for private groups

### Key Design Decisions
- **Slug-based URLs**: `/groups/portland-real-estate-investors`
- **Denormalized counts**: `member_count`, `pin_count`, `area_count`
- **RLS policies**: Enforce access at database level
- **Auto-slug generation**: From group name with uniqueness check

---

## Frontend Architecture

### File Structure
```
src/features/groups/
├── components/     # UI components (cards, modals, lists)
├── hooks/         # React hooks (useGroups, useGroup, etc.)
├── services/      # API services (groupService, etc.)
└── types.ts       # TypeScript types
```

### Key Components
- `GroupCard` - Group preview in listings
- `GroupHeader` - Hero section for group detail
- `GroupFeed` - Group-specific activity feed
- `GroupPinsMap` - Map view of group pins
- `GroupMembersList` - Member list with roles
- `CreateGroupModal` - Create group form

### Pages
- `/groups` - Groups listing page
- `/groups/[slug]` - Group detail page (tabs: Feed, Pins, Areas, Members)
- `/groups/new` - Create group page (optional, can use modal)

---

## User Flows

### Creating a Group
1. Click "Create Group"
2. Fill form (name, description, visibility, settings)
3. Submit → Group created, user auto-added as owner
4. Redirect to group detail page

### Joining a Public Group
1. Browse groups listing
2. Click "Join" on public group
3. Instant join (no approval)
4. Group appears in "My Groups"

### Joining a Private Group
1. Find private group (if visible)
2. Click "Request to Join"
3. If approval required: Request sent to admins
4. If no approval: Instant join

### Adding Pin to Group
1. View pin detail
2. Click "Add to Group"
3. Select group(s) from dropdown
4. Pin associated with group(s)
5. Pin appears in group's "Pins" tab

---

## Design Principles

### Visual
- **Cinematic Motion**: Subtle animations, staggered card mounts
- **Whitespace as Structure**: Generous spacing creates hierarchy
- **Consistent Patterns**: Follow existing modal/form patterns

### UX
- **Progressive Disclosure**: Show details on demand
- **Clear CTAs**: Obvious join/create actions
- **Feedback**: Toast notifications for actions
- **Empty States**: Helpful messaging with CTAs

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
- Database schema & migrations
- Basic CRUD services
- Groups listing page
- Group detail page (Feed tab)
- Create/join groups
- Basic member management

### Phase 2: Integration (Weeks 5-6)
- Pin-to-group association
- Area-to-group association
- Group pins/areas map views
- Filter pins/areas by group

### Phase 3: Advanced (Weeks 7-8)
- Private groups with invitations
- Member roles & permissions
- Group settings
- Search & filters

### Phase 4: Polish (Weeks 9-10)
- Animations & transitions
- Mobile optimization
- Performance tuning
- Analytics

---

## Success Metrics

### Engagement
- 100+ groups created in first month
- Average 10+ members per group
- 50%+ groups with weekly activity
- 30%+ pins/areas in groups

### Retention
- 70%+ group members active after 30 days
- 3x higher return rate for group members

### Growth
- 0.5+ invitations per user
- 40%+ joins via discovery (not invitation)
- 20%+ users in multiple groups

---

## Strategic Value

### For Users
- **Community**: Form connections around shared interests
- **Organization**: Organize pins/areas into groups
- **Discovery**: Find relevant content through groups
- **Collaboration**: Work together on shared goals

### For Platform
- **Retention**: Social obligations increase engagement
- **Network Effects**: Each member adds value to others
- **Content Organization**: Groups surface and organize content
- **Viral Growth**: Invitations drive new user acquisition

---

## Technical Highlights

### Backend
- **Supabase**: PostgreSQL with RLS policies
- **Realtime**: Group feed updates via Supabase Realtime
- **Triggers**: Auto-update counts, auto-add creator as owner
- **Functions**: Slug generation, count updates

### Frontend
- **Next.js**: App Router, Server Components
- **TypeScript**: Full type safety
- **React Hooks**: Custom hooks for data fetching
- **Framer Motion**: Animations (consistent with existing patterns)

### Performance
- **Denormalized Counts**: Fast display without COUNT queries
- **Pagination**: All lists paginated
- **Lazy Loading**: Tabs load on demand
- **Caching**: Group metadata cached

---

## Documentation Files

1. **GROUPS_FEATURE_DESIGN.md** - Complete technical design
   - Database schema with SQL
   - RLS policies
   - Service layer architecture
   - TypeScript types
   - Integration points

2. **GROUPS_UI_SPEC.md** - UI/UX specifications
   - Component designs
   - Page layouts
   - Motion & animations
   - Responsive breakpoints
   - Accessibility

3. **GROUPS_STRATEGY.md** - Strategic overview
   - Design decisions & rationale
   - Success metrics
   - Risk mitigation
   - Phased rollout plan
   - Future enhancements

4. **GROUPS_OVERVIEW.md** - This file
   - Quick reference
   - High-level summary
   - Key points

---

## Next Steps

1. **Review Design**: Review all three design documents
2. **Database Migration**: Create migration file with schema
3. **Service Layer**: Implement groupService.ts
4. **Components**: Build UI components (start with GroupCard)
5. **Pages**: Create groups listing and detail pages
6. **Integration**: Connect with pins/areas
7. **Testing**: Unit tests, integration tests, E2E tests
8. **Deploy**: Phased rollout to production

---

## Questions?

Refer to the detailed design documents:
- **Technical details**: `GROUPS_FEATURE_DESIGN.md`
- **UI/UX specs**: `GROUPS_UI_SPEC.md`
- **Strategy**: `GROUPS_STRATEGY.md`

