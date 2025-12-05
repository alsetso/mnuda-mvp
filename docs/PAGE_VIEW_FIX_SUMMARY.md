# Page View Tracking Fix for `/business/[id]` Pages

## Problem Identified

### Root Cause
When the `businesses` table was renamed to `pages` in migration 162, the `view_count` column should have been preserved automatically. However:

1. **Constraint name mismatch**: The constraint `businesses_view_count_non_negative` was not renamed to `pages_view_count_non_negative`
2. **Index name mismatch**: The index `businesses_view_count_idx` may not have been properly renamed
3. **Function behavior**: The `record_page_view` function catches `undefined_column` exceptions silently, so errors weren't visible

### Current Behavior
- ✅ Page views ARE being recorded in `page_views` table
- ✅ `PageStatsCard` works correctly (queries `page_views` table)
- ❌ `pages.view_count` column is NOT being updated (silent failure)
- ⚠️ The `Views` component shows stale/zero data from `pages.view_count`

### Evidence from Code
```sql
-- record_page_view function (migration 162, lines 172-177)
EXCEPTION
  WHEN undefined_column THEN
    -- Column doesn't exist, skip update but still record the page view
    v_view_count := 0;
    RAISE WARNING 'view_count column does not exist on table %', v_table_name;
```

This exception handler is catching the error, but the warning may not be visible in logs.

## Solution

### Migration Created: `166_ensure_pages_view_count.sql`

This migration:
1. ✅ Ensures `view_count` column exists on `pages` table
2. ✅ Renames constraint from `businesses_view_count_non_negative` → `pages_view_count_non_negative`
3. ✅ Drops old index `businesses_view_count_idx` if it exists
4. ✅ Creates/ensures `pages_view_count_idx` index exists
5. ✅ Adds verification checks to catch any issues

### Expected Behavior After Migration

1. **Page View Recording**:
   ```
   Frontend: usePageView({ entity_type: 'page', entity_id: business.id })
   → API: /api/analytics/view
   → Function: record_page_view('page', entity_id, ...)
   → Inserts into page_views table ✅
   → Updates pages.view_count ✅ (NOW WORKS!)
   ```

2. **Stats Display**:
   ```
   Frontend: PageStatsCard({ pageId: business.id })
   → API: /api/analytics/business-stats?id=<page-id>
   → Function: get_page_stats_by_id(<page-id>)
   → Queries page_views table ✅
   → Returns: total_loads, unique_visitors, accounts_active ✅
   ```

3. **View Count Display**:
   ```
   Frontend: Views component shows business.view_count
   → Reads from pages.view_count column
   → NOW ACCURATE! ✅
   ```

## Verification Steps

### 1. Run Migration
```bash
# Apply the migration
supabase migration up
```

### 2. Check Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'pages' 
AND column_name = 'view_count';
-- Should return: view_count | integer | 0
```

### 3. Check Constraint
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.pages'::regclass
AND conname LIKE '%view_count%';
-- Should return: pages_view_count_non_negative | c
```

### 4. Check Index
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pages'
AND indexname LIKE '%view_count%';
-- Should return: pages_view_count_idx | CREATE INDEX ...
```

### 5. Test Page View Recording
1. Visit `/business/[id]` page
2. Check terminal logs - should see:
   ```
   [view] Recording page view: { entity_type: 'page', entity_id: '...' }
   [view] Page view recorded successfully: { view_count: 1 }
   ```
3. No warnings about `undefined_column`

### 6. Verify View Count Updates
```sql
-- Before viewing page
SELECT id, name, view_count FROM pages WHERE id = '<test-page-id>';

-- Visit the page, then check again
SELECT id, name, view_count FROM pages WHERE id = '<test-page-id>';
-- view_count should increment
```

### 7. Verify Page Views Table
```sql
SELECT COUNT(*) as total_views
FROM page_views 
WHERE entity_type = 'page' 
AND entity_id = '<test-page-id>';
-- Should match the view_count in pages table
```

## Files Modified

1. **New Migration**: `supabase/migrations/166_ensure_pages_view_count.sql`
   - Ensures `view_count` column exists
   - Fixes constraint and index names
   - Adds verification checks

2. **No Frontend Changes Needed**: 
   - Frontend is already correctly configured
   - `usePageView` hook is correct
   - `PageStatsCard` component is correct

3. **No API Changes Needed**:
   - API route is correct
   - `record_page_view` function logic is correct (just needs the column to exist)

## Summary

**Problem**: `pages.view_count` column wasn't being updated due to missing/incorrectly named constraints/indexes after table rename.

**Solution**: Migration ensures column exists with proper constraints and indexes.

**Result**: Both `pages.view_count` and `page_views` table will be in sync, providing accurate view counts for individual business pages.

