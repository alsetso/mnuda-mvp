# `page_views_entity_type_check` Constraint Explanation

## What is this constraint?

The `page_views_entity_type_check` constraint is a **CHECK constraint** on the `page_views.entity_type` column that validates which entity types are allowed.

**Current Definition:**
```sql
CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business', 'page', 'feed', 'map'))
```

## Why is it needed?

The `page_views` table uses `TEXT` for the `entity_type` column (not an ENUM type). Without a constraint, any text value could be inserted, which would:
- Allow invalid entity types
- Break queries that filter by entity_type
- Cause data integrity issues

**The constraint IS needed** - it's the only validation mechanism for entity_type values.

## Why is it failing?

The constraint was created in migration 130 without 'page' in the list:
```sql
CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business'))
```

Subsequent migrations tried to update it:
- Migration 155: Added 'feed' (but not 'page')
- Migration 161: Should have added 'page' and 'map', but may not have been applied correctly

**The constraint currently doesn't include 'page'**, which is why inserts with `entity_type='page'` are failing.

## What are the options?

### Option 1: Keep CHECK constraint (RECOMMENDED) ✅
- **Pros**: Simple, works with TEXT column, easy to modify
- **Cons**: Need to update constraint when adding new entity types
- **Action**: Update constraint to include 'page' (migration 166 does this)

### Option 2: Switch to ENUM type
- **Pros**: Type-safe, database-enforced, no constraint needed
- **Cons**: Requires ALTER TYPE (can't drop values in use), more complex migrations
- **Action**: Would need to:
  1. Create/update `page_entity_type` enum
  2. Alter column to use enum
  3. Drop CHECK constraint

### Option 3: Remove constraint entirely ❌
- **Pros**: None
- **Cons**: No validation, allows invalid data, breaks data integrity
- **Action**: NOT RECOMMENDED

## Recommended Solution

**Keep the CHECK constraint and update it** (what migration 166 does):

1. ✅ Drop existing constraint (handles both inline and named)
2. ✅ Recreate with all valid values including 'page'
3. ✅ Future migrations can easily add new entity types

This is the simplest, safest approach that maintains data integrity.

## Migration History

| Migration | Constraint Values | Status |
|-----------|------------------|--------|
| 130 | `('post', 'article', 'city', 'county', 'account', 'business')` | ❌ Missing 'page' |
| 155 | Added 'feed' | ❌ Still missing 'page' |
| 161 | Should add 'page' and 'map' | ⚠️ May not have applied |
| **166** | **All values including 'page'** | ✅ **FIXES IT** |

## After Migration 166

The constraint will be:
```sql
CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business', 'page', 'feed', 'map'))
```

This allows:
- ✅ Recording page views for individual pages (`entity_type='page'`, `entity_id=<page-id>`)
- ✅ Recording page views for landing pages (`entity_type='page'`, `entity_slug='business'`)
- ✅ All existing entity types continue to work

## Verification

After running migration 166, verify with:
```sql
-- Check constraint exists and includes 'page'
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.page_views'::regclass
AND conname = 'page_views_entity_type_check';

-- Should return:
-- page_views_entity_type_check | CHECK (entity_type = ANY (ARRAY['post'::text, 'article'::text, 'city'::text, 'county'::text, 'account'::text, 'business'::text, 'page'::text, 'feed'::text, 'map'::text]))
```

