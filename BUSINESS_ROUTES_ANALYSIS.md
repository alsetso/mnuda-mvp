# Business & Ads Route Structure Analysis

## Current Route Structure

### Business Routes
- `/account/business` - User's business management (list/create/edit)
- `/business/[id]` - Business detail page (public view)

### Ads Routes
- `/businesses/ads?business=[id]` - Ads management (with query parameter)

## Issues Identified

### 1. Naming Inconsistency
- `/account/business` (singular) - but users can have multiple businesses
- `/business/[id]` (singular) - correct for single business view
- `/businesses/ads` (plural) - inconsistent with other routes

### 2. Hierarchy Problems
- Ads route uses query parameters (`?business=id`) instead of nested routes
- `/businesses/ads` doesn't follow RESTful nesting patterns
- Should be: `/business/[id]/ads` for better hierarchy

### 3. Account vs Public Routes
- `/account/business` - account management route
- `/business/[id]` - public viewing route
- Mixing contexts can be confusing

## Recommended Route Structure

### Option A: Nested Under Business (Recommended)
```
/account/businesses              # List user's businesses
/account/businesses/[id]         # Edit user's own business (with edit controls)
/business/[id]                   # Public view of any business
/business/[id]/ads               # Ads for specific business (owner only)
```

### Option B: Keep Account Context
```
/account/businesses              # List user's businesses
/account/businesses/[id]         # View/edit user's own business
/account/businesses/[id]/ads    # Ads for user's business
/business/[id]                   # Public view (read-only, for sharing)
```

### Option C: Hybrid (Current + Improvements)
```
/account/business                # Keep as-is (user's business list)
/business/[id]                   # Public view
/business/[id]/ads               # Ads nested under business (better hierarchy)
```

## Recommendation: Option C (Minimal Changes)

**Rationale:**
1. `/account/business` is already established and works
2. `/business/[id]` is good for public sharing
3. `/business/[id]/ads` provides proper nesting without query params
4. Minimal breaking changes

## Proposed Changes

1. **Rename `/account/business` → `/account/businesses`** (optional, for consistency)
2. **Move `/businesses/ads` → `/business/[id]/ads`** (nested route)
3. **Update all links** to use new structure
4. **Remove query parameter approach** in favor of path parameters

## Migration Plan

1. Create `/business/[id]/ads/page.tsx`
2. Update all links from `/businesses/ads?business=id` to `/business/[id]/ads`
3. Update business detail page links
4. Remove old `/businesses/ads` route
5. (Optional) Rename `/account/business` to `/account/businesses`


