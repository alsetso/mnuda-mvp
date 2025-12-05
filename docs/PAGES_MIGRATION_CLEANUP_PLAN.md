# Pages Migration Cleanup Plan

## Overview
Plan to remove backward compatibility with 'business' entity type and fully migrate to 'page' entity type across the codebase.

## Current State
- Migration 162 adds 'page' to enum while keeping 'business' for compatibility
- Functions accept both 'business' and 'page' entity types
- Codebase uses 'page' entity type in new code but still supports 'business'

## Cleanup Steps

### Phase 1: Database Cleanup

#### 1.1 Update record_page_view function
**File:** `supabase/migrations/163_remove_business_entity_type.sql`

- Remove 'business' from entity_type validation
- Remove 'business' from CASE statement mapping
- Update comments to remove 'business' references
- Normalize existing 'business' records in page_views table to 'page'

```sql
-- Update existing page_views records
UPDATE public.page_views 
SET entity_type = 'page' 
WHERE entity_type = 'business';

-- Update function to only accept 'page'
```

#### 1.2 Update get_page_stats function
**File:** `supabase/migrations/163_remove_business_entity_type.sql`

- Remove support for 'business' entity_type in WHERE clause
- Update function comment

#### 1.3 Update page_views check constraint
**File:** `supabase/migrations/163_remove_business_entity_type.sql`

- Remove 'business' from CHECK constraint
- Update constraint in migration 161_add_map_to_page_views_check.sql

#### 1.4 Update page_entity_type enum (Optional)
**Note:** PostgreSQL doesn't support removing enum values. Options:
- Keep 'business' in enum but never use it (recommended)
- Create new enum and migrate (complex, not recommended)

### Phase 2: Code Cleanup

#### 2.1 Update TypeScript Types
**Files:**
- `src/hooks/usePageView.ts` - Remove 'business' from EntityType
- `src/app/api/analytics/view/route.ts` - Remove 'business' from validTypes
- `src/app/api/analytics/my-entities/route.ts` - Remove 'business' from EntityType

#### 2.2 Update API Routes
**Files:**
- `src/app/api/analytics/view/route.ts` - Remove 'business' from tableMap
- `src/app/api/analytics/business-stats/route.ts` - Update function name references if needed

#### 2.3 Update Components
**Files:**
- `src/app/business/BusinessPageClient.tsx` - Already uses 'page'
- `src/app/business/[id]/BusinessDetailClient.tsx` - Already uses 'page'
- Verify all components use 'page' not 'business'

#### 2.4 Update Migration Comments
**Files:**
- `supabase/migrations/159_add_business_page_tracking.sql` - Update comments
- `supabase/migrations/162_rename_businesses_to_pages.sql` - Update comments

### Phase 3: Data Migration

#### 3.1 Migrate Existing page_views Records
```sql
-- Run in migration 163
UPDATE public.page_views 
SET entity_type = 'page' 
WHERE entity_type = 'business';
```

#### 3.2 Verify No 'business' Entity Types Remain
```sql
-- Check for any remaining 'business' entity types
SELECT COUNT(*) FROM public.page_views WHERE entity_type = 'business';
-- Should return 0 after migration
```

### Phase 4: Documentation Updates

#### 4.1 Update Schema Documentation
- Update `supabase/schema/001_base_schema.sql` comments
- Update `supabase/schema/002_rls_policies.sql` comments

#### 4.2 Update API Documentation
- Update any API docs that reference 'business' entity type
- Update OpenAPI/Swagger specs if they exist

## Migration File: 163_remove_business_entity_type.sql

```sql
-- Remove backward compatibility with 'business' entity type
-- Migrates all existing 'business' entity_type records to 'page'

-- ============================================================================
-- STEP 1: Migrate existing page_views records
-- ============================================================================

UPDATE public.page_views 
SET entity_type = 'page' 
WHERE entity_type = 'business';

-- ============================================================================
-- STEP 2: Update record_page_view function (remove 'business' support)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_page_view(
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
  v_table_name TEXT;
  v_entity_id_for_update UUID;
BEGIN
  -- Validate entity_type (removed 'business', only 'page' allowed)
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'page', 'feed', 'map') THEN
    RAISE EXCEPTION 'Invalid entity_type: %. Use "page" instead of "business"', p_entity_type;
  END IF;
  
  -- Map entity_type to table name
  v_table_name := CASE p_entity_type
    WHEN 'post' THEN 'posts'
    WHEN 'article' THEN 'articles'
    WHEN 'city' THEN 'cities'
    WHEN 'county' THEN 'counties'
    WHEN 'account' THEN 'accounts'
    WHEN 'page' THEN 'pages'
    ELSE NULL
  END;
  
  -- ... rest of function (same logic, but only 'page' not 'business')
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Update get_page_stats function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_page_stats(
  p_page_slug TEXT,
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
  WHERE entity_type = 'page'  -- Only 'page', not 'business'
    AND entity_slug = p_page_slug
    AND viewed_at >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Update page_views check constraint
-- ============================================================================

ALTER TABLE public.page_views
  DROP CONSTRAINT IF EXISTS page_views_entity_type_check;

ALTER TABLE public.page_views
  ADD CONSTRAINT page_views_entity_type_check 
  CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'page', 'feed', 'map'));

-- ============================================================================
-- STEP 5: Update page_views RLS policy
-- ============================================================================

DROP POLICY IF EXISTS "anon_can_read_page_stats" ON public.page_views;

CREATE POLICY "anon_can_read_page_stats"
  ON public.page_views FOR SELECT
  TO anon
  USING (entity_type = 'page' AND entity_slug IN ('business', 'directory'));
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] All existing 'business' entity_type records migrated to 'page'
- [ ] record_page_view function rejects 'business' entity_type
- [ ] get_page_stats function only queries 'page' entity_type
- [ ] All API routes updated to use 'page'
- [ ] All components updated to use 'page'
- [ ] No 'business' entity_type in new page_views records
- [ ] Check constraint prevents 'business' entity_type
- [ ] RLS policies work correctly with 'page' only

## Rollback Plan

If issues arise:
1. Revert migration 163
2. Restore 'business' support in functions
3. Update check constraint to include 'business'
4. Code will continue to work with both types

## Timeline

**Recommended:** Run cleanup migration after:
- All code has been updated to use 'page'
- All existing 'business' records have been migrated
- Testing confirms no 'business' entity_type is being created

**Risk:** Low - migration is additive (adds 'page'), cleanup is removal of unused compatibility layer.

