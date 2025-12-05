# Page Stats Analysis: `/business` vs `/business/[id]`

## Current State

### `/business` (Landing Page)
**Tracking:**
- `usePageView({ entity_type: 'page', entity_slug: 'business' })`
- Records to `page_views` table with `entity_slug = 'business'`

**Display:**
- Shows `PageStatsCard` component
- Displays aggregate analytics:
  - **Total Loads**: All page views
  - **Unique Visitors**: Distinct accounts + IPs
  - **Accounts Active**: Distinct accounts only
- Uses `/api/analytics/business-stats?page=business`
- Calls `get_page_stats('business')` database function
- Queries `page_views` WHERE `entity_slug = 'business'`

**Purpose:** Track aggregate traffic to the business landing page

---

### `/business/[id]` (Individual Page Detail)
**Tracking:**
- `usePageView({ entity_type: 'page', entity_id: business.id })`
- Records to `page_views` table with `entity_id = <page_id>`
- Also updates `pages.view_count` column (incremented on each view)

**Display:**
- Shows simple `Views` component with `business.view_count` (from `pages` table)
- Shows `PageViewsList` component (admin only) - list of recent page views
- Does NOT show `PageStatsCard` with detailed analytics

**Purpose:** Track individual page views and show simple view counter

---

## Key Differences

| Feature | `/business` | `/business/[id]` |
|---------|-------------|------------------|
| **Tracking Method** | `entity_slug` | `entity_id` |
| **Stats Display** | Full analytics card | Simple view count |
| **Unique Visitors** | ✅ Yes | ❌ No |
| **Accounts Active** | ✅ Yes | ❌ No |
| **Time Period Filter** | ✅ 24h / 7d | ❌ No |
| **Database Function** | `get_page_stats(slug)` | None (uses `view_count`) |

---

## Recommendation: Add PageStatsCard to Individual Pages

### Why?
1. **Consistency**: Both pages should show similar analytics
2. **Value**: Owners want to see unique visitors, not just total views
3. **Better UX**: Time period filters (24h/7d) are useful
4. **Data Available**: We're already tracking in `page_views` table

### Implementation Plan

#### 1. Create Database Function
```sql
CREATE OR REPLACE FUNCTION public.get_page_stats_by_id(
  p_entity_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_loads BIGINT,
  unique_visitors BIGINT,
  accounts_active BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_loads,
    (
      COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL) +
      COUNT(DISTINCT ip_address) FILTER (WHERE account_id IS NULL AND ip_address IS NOT NULL)
    )::BIGINT AS unique_visitors,
    COUNT(DISTINCT account_id) FILTER (WHERE account_id IS NOT NULL)::BIGINT AS accounts_active
  FROM public.page_views
  WHERE entity_type = 'page'
    AND entity_id = p_entity_id
    AND viewed_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Create/Update API Route
- Option A: Extend `/api/analytics/business-stats` to accept `?id=<uuid>` instead of `?page=<slug>`
- Option B: Create new `/api/analytics/page-stats?id=<uuid>`

#### 3. Update PageStatsCard Component
- Accept either `pageSlug` OR `pageId`
- Update API call based on which prop is provided

#### 4. Add to Detail Page
- Add `PageStatsCard` to `/business/[id]` page
- Show only to page owners (or make public?)
- Place in sidebar alongside `PageViewsList`

### Benefits
- ✅ Consistent analytics across both pages
- ✅ More valuable metrics (unique visitors, accounts active)
- ✅ Time period filtering (24h/7d)
- ✅ Better insights for page owners

### Considerations
- Should stats be public or owner-only?
- Where to place in the UI (sidebar, main content, or both)?
- Should we keep the simple `Views` component or replace it?

