# Page View Tracking Analysis: `/business/[id]` Pages

## Current State

### Frontend Implementation
- **Location**: `src/app/business/[id]/BusinessDetailClient.tsx`
- **Tracking Call**: `usePageView({ entity_type: 'page', entity_id: business.id })`
- **Stats Display**: `PageStatsCard` component with `pageId={business.id}`
- **Status**: ✅ Correctly configured

### Backend Implementation

#### API Route (`/api/analytics/view`)
- **Status**: ✅ Correctly calls `record_page_view` with `entity_type='page'` and `entity_id`

#### Database Function (`record_page_view`)
- **Location**: Migration 162 (`rename_businesses_to_pages.sql`)
- **Entity Type Mapping**: Maps `'page'` → `'pages'` table ✅
- **View Count Update**: Attempts to update `pages.view_count` column
- **Issue**: ⚠️ **The `pages` table may not have a `view_count` column!**

#### Stats Function (`get_page_stats_by_id`)
- **Location**: Migration 163 (`add_page_stats_by_id.sql`)
- **Status**: ✅ Correctly queries `page_views` table by `entity_id`
- **Returns**: `total_loads`, `unique_visitors`, `accounts_active`

## Problem Identification

### Issue #1: Missing `view_count` Column on `pages` Table

**Root Cause:**
- Migration 128 (`add_view_count_to_all_entities.sql`) added `view_count` to `businesses` table
- Migration 162 (`rename_businesses_to_pages.sql`) renamed `businesses` → `pages`
- **The `view_count` column should have been preserved during rename, but may not exist**

**Evidence:**
- The `record_page_view` function catches `undefined_column` exception (line 173)
- Returns `v_view_count := 0` when column doesn't exist
- Page views are still recorded in `page_views` table, but `pages.view_count` is never updated

**Impact:**
- `business.view_count` in frontend always shows 0 or stale data
- Stats from `PageStatsCard` work correctly (uses `page_views` table)
- Inconsistency between `pages.view_count` and actual view count

### Issue #2: Function Logic for `entity_type='page'`

**Current Behavior:**
```sql
-- Line 120-123: When entity_type is 'page' and entity_slug is provided
ELSIF p_entity_type IN ('business', 'page') THEN
  -- Page pages: 'business' or 'directory' slugs don't resolve to entity_id
  -- These are page-level tracking, not page-specific
  v_entity_id_for_update := NULL;
```

**Problem:**
- When `entity_type='page'` and `entity_slug` is provided, it sets `v_entity_id_for_update := NULL`
- But when `entity_id` is provided directly (which is the case for `/business/[id]`), it should use it
- **This part is actually correct** - line 99-101 handles direct `entity_id` properly

**However:**
- The function correctly uses `entity_id` when provided (line 99-101)
- The issue is only with the `view_count` column not existing

## Solution

### Migration Needed: Add `view_count` to `pages` Table

Create a new migration to ensure `view_count` column exists on `pages` table:

```sql
-- Add view_count column to pages table if it doesn't exist
-- This ensures the record_page_view function can update it

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pages' 
    AND column_name = 'view_count'
  ) THEN
    ALTER TABLE public.pages
      ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    
    ALTER TABLE public.pages
      ADD CONSTRAINT pages_view_count_non_negative CHECK (view_count >= 0);
    
    CREATE INDEX IF NOT EXISTS pages_view_count_idx
      ON public.pages (view_count DESC)
      WHERE view_count > 0;
    
    COMMENT ON COLUMN public.pages.view_count IS 
      'Total number of page views for this page. Updated automatically by record_page_view function.';
  END IF;
END $$;
```

## Verification Steps

1. **Check if column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'pages' AND column_name = 'view_count';
   ```

2. **Test page view recording:**
   - Visit `/business/[id]` page
   - Check terminal logs for `[view] Recording page view` messages
   - Verify no `undefined_column` warnings

3. **Verify view_count updates:**
   ```sql
   SELECT id, name, view_count 
   FROM pages 
   WHERE id = '<test-page-id>';
   ```

4. **Verify page_views table:**
   ```sql
   SELECT COUNT(*) 
   FROM page_views 
   WHERE entity_type = 'page' 
   AND entity_id = '<test-page-id>';
   ```

## Expected Behavior After Fix

1. **Page View Recording:**
   - `usePageView` hook calls `/api/analytics/view`
   - API calls `record_page_view('page', entity_id, ...)`
   - Function inserts into `page_views` table ✅
   - Function updates `pages.view_count` ✅ (after migration)

2. **Stats Display:**
   - `PageStatsCard` calls `/api/analytics/business-stats?id=<page-id>`
   - API calls `get_page_stats_by_id(<page-id>)`
   - Function queries `page_views` table ✅
   - Returns `total_loads`, `unique_visitors`, `accounts_active` ✅

3. **View Count Display:**
   - `Views` component shows `business.view_count` from `pages` table
   - This will now be accurate after migration ✅

## Summary

**Current Problems:**
1. ❌ `pages.view_count` column may not exist (causing silent failures)
2. ✅ Page views ARE being recorded in `page_views` table
3. ✅ Stats card works correctly (uses `page_views` table)
4. ⚠️ `pages.view_count` is not being updated (but this is caught and ignored)

**Required Fix:**
- Add migration to ensure `view_count` column exists on `pages` table
- This will allow `record_page_view` to update the column successfully
- Both `pages.view_count` and `page_views` table will be in sync

