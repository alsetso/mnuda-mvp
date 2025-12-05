# Page Stats Implementation Summary

## ✅ Completed Implementation

### 1. Database Function
**File:** `supabase/migrations/163_add_page_stats_by_id.sql`
- Created `get_page_stats_by_id(p_entity_id UUID, p_hours INTEGER)` function
- Queries `page_views` table by `entity_id` instead of `entity_slug`
- Returns: `total_loads`, `unique_visitors`, `accounts_active`
- Supports time period filtering (24h/7d)

### 2. API Route Update
**File:** `src/app/api/analytics/business-stats/route.ts`
- Extended to support both `?page=<slug>` and `?id=<uuid>` parameters
- Validates that exactly one parameter is provided
- Routes to appropriate database function:
  - `get_page_stats()` for slug-based (landing pages)
  - `get_page_stats_by_id()` for id-based (individual pages)
- Maintains backward compatibility with existing slug-based calls

### 3. Component Update
**File:** `src/components/business/BusinessStatsCard.tsx`
- Updated `PageStatsCardProps` to accept either `pageSlug` or `pageId`
- Updated fetch logic to use appropriate query parameter
- Maintains backward compatibility with existing `pageSlug` usage
- Updated label logic to handle both cases

### 4. Detail Page Integration
**File:** `src/app/business/[id]/BusinessDetailClient.tsx`
- Added `PageStatsCard` component to sidebar
- Placed above `PageViewsList` for better visibility
- Uses `pageId={business.id}` to fetch individual page stats
- Updated `PageViewsList` to use `entityType="page"` instead of `"business"`

### 5. Type Updates
- Updated `PageViewsList` to include `'page'` in `EntityType`
- Updated `VisitorsList` to include `'page'` in `EntityType`

## 📊 Result

### `/business` (Landing Page)
- Shows `PageStatsCard` with `pageSlug="business"`
- Displays aggregate stats for the landing page
- Uses `get_page_stats('business')`

### `/business/[id]` (Individual Page)
- Shows `PageStatsCard` with `pageId={business.id}`
- Displays individual page stats (unique visitors, accounts active, total loads)
- Uses `get_page_stats_by_id(<page_id>)`
- Also shows `PageViewsList` with recent page views
- Also shows simple `Views` component with `view_count`

## 🎯 Benefits

1. **Consistency**: Both pages now show similar analytics
2. **Better Metrics**: Individual pages show unique visitors and accounts active
3. **Time Filtering**: Both support 24h/7d time period toggle
4. **Better UX**: Page owners can see detailed analytics for their pages

## 📝 Notes

- Stats are public (no authentication required)
- Both landing page and individual page stats use the same `page_views` table
- Individual page stats query by `entity_id`, landing page stats query by `entity_slug`
- The simple `Views` component still shows `view_count` from `pages` table (legacy counter)
- `PageViewsList` shows recent individual page views (admin/owner only)

## 🔄 Migration Required

Run migration `163_add_page_stats_by_id.sql` to create the new database function.

