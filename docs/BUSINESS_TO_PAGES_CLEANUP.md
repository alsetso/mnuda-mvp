# Business to Pages Cleanup Plan

## Files to Rename/Update

### Services
1. **`src/features/admin/services/businessAdminService.ts`** → `pageAdminService.ts`
   - Fix broken import: `@/features/business/services/businessService` (doesn't exist)
   - Rename class: `AdminBusinessService` → `AdminPageService`
   - Rename interface: `AdminBusiness` → `AdminPage`
   - Update all references

### Components (Optional - keep for backward compatibility or rename)
2. **`src/components/business/BusinessStatsCard.tsx`**
   - Rename interface: `BusinessStats` → `PageStats`
   - Update references to "business" in text
   - Consider renaming file to `PageStatsCard.tsx`

3. **`src/components/business/BusinessSetupGuide.tsx`**
   - Already updated text, but could rename to `PageSetupGuide.tsx`

4. **`src/components/businesses/BusinessesListClient.tsx`**
   - Rename to `PagesListClient.tsx`
   - Update interface names

5. **`src/components/businesses/CreateBusinessForm.tsx`**
   - Rename to `CreatePageForm.tsx`
   - Update interface names

### Client Components
6. **`src/app/business/BusinessPageClient.tsx`**
   - Rename to `PageClient.tsx` (optional)

7. **`src/app/business/[id]/BusinessDetailClient.tsx`**
   - Rename to `PageDetailClient.tsx` (optional)

8. **`src/app/business/dashboard/BusinessDashboardClient.tsx`**
   - Rename to `PagesDashboardClient.tsx` (optional)

9. **`src/app/business/dashboard/[id]/edit/EditBusinessClient.tsx`**
   - Rename to `EditPageClient.tsx` (optional)

10. **`src/app/business/registration/NewBusinessClient.tsx`**
    - Rename to `NewPageClient.tsx` (optional)

## Type Definitions Needed

### Missing Types (currently imported from non-existent service)
- `Business` interface → Define as `Page` interface
- `UpdateBusinessData` interface → Define as `UpdatePageData` interface

## Export Updates

### `src/features/admin/index.ts`
- Update exports from `businessAdminService` to `pageAdminService`
- Update type exports: `AdminBusiness` → `AdminPage`
- Update class exports: `AdminBusinessService` → `AdminPageService`

## API Route Updates

Check for any API routes that import/use:
- `AdminBusinessService` → `AdminPageService`
- `AdminBusiness` type → `AdminPage` type

## Summary

**Critical (broken imports):**
- ✅ Fix `businessAdminService.ts` import error
- ✅ Rename service and types

**Recommended:**
- ✅ Update component names and interfaces
- ✅ Update all type references

**Optional (for consistency):**
- File renames for client components
- Directory structure cleanup

