# Database Table Cleanup Summary

## Tables Dropped
- ✅ `profiles` - User profiles table
- ✅ `my_homes` - User-owned homes
- ✅ `projects` - Projects linked to homes
- ✅ `areas` - User-drawn geographic areas
- ✅ `skip_tracing` - Skip trace API results storage
- ✅ `tags` - Tag management table

## Files Deleted
- ✅ `src/app/my-homes/` - Entire directory
- ✅ `src/app/u/homeowner/my-homes/` - Entire directory
- ✅ `src/features/my-homes/` - Entire directory
- ✅ `src/features/projects/` - Entire directory
- ✅ `src/features/areas/` - Entire directory
- ✅ `src/app/map/areas/` - Entire directory
- ✅ `src/app/map/skip-trace/` - Page deleted (API service kept)
- ✅ `src/features/tags/` - Entire directory
- ✅ `src/app/admin/tags/` - Entire directory
- ✅ `src/app/api/admin/tags/` - Entire directory
- ✅ `src/features/profiles/` - Service and pages deleted (stub context kept)
- ✅ `src/app/account/profiles/` - Entire directory
- ✅ `src/app/api/profiles/` - Entire directory
- ✅ `src/lib/profileServer.ts` - Server-side profile functions
- ✅ `src/features/admin/services/areaAdminService.ts` - Admin service for areas

## Files Updated
- ✅ `src/components/app/AppWrapperServer.tsx` - Removed profileServer import
- ✅ `src/components/app/AppTopServer.tsx` - Removed profileServer import
- ✅ `src/components/app/AppSearch.tsx` - Removed my-homes page references
- ✅ `src/features/profiles/contexts/ProfileContext.tsx` - Created stub implementation
- ✅ `src/features/admin/index.ts` - Removed AdminAreaService export

## Files That Still Need Updates

### Critical - Will Break Application
1. **Components using AreaService/Area types:**
   - `src/components/map/CompactAreaForm.tsx` - Uses AreaService
   - `src/components/map/InlineAreaSaveForm.tsx` - Uses AreaService
   - `src/components/map/InlineAreaEditForm.tsx` - Uses AreaService
   - `src/features/map/hooks/useMapRendering.ts` - Uses Area type
   - `src/features/map/hooks/useMapData.ts` - Uses AreaService
   - `src/features/map/components/DrawCoordinatesDisplay.tsx` - Uses Area type
   - `src/components/MapDeleteModal.tsx` - References area deletion
   - `src/components/GlobalFloatingMenu.tsx` - References area deletion

2. **Components using TagService/Tag types:**
   - `src/app/map/page.tsx` - Extensive tag usage
   - `src/features/map/hooks/useMapData.ts` - Uses TagService
   - `src/features/map-pins/services/mapPinService.ts` - Uses Tag type
   - `src/features/pins/services/pinService.ts` - Uses Tag type
   - `src/components/map/CompactPinForm.tsx` - Uses TagService
   - `src/components/map/TagSelectorModal.tsx` - Uses TagService
   - `src/components/map/CompactFilterForm.tsx` - Uses TagService
   - `src/components/map/InlinePinCreationForm.tsx` - Uses TagService
   - `src/components/map/TagsFilterDropdown.tsx` - Uses TagService
   - `src/components/PinCreationForm.tsx` - Uses TagService
   - `src/features/map/components/MapFilters.tsx` - Uses TagService

3. **Components using ProfileService (now stub):**
   - `src/components/feed/ProfileCard.tsx` - Uses profile data
   - `src/components/feed/FeedPost.tsx` - Uses profile data
   - `src/components/feed/CreatePostForm.tsx` - Uses profile data
   - `src/components/ProfilePhoto.tsx` - Uses profile data
   - `src/features/session/components/ProfileDropdown.tsx` - Uses profile data
   - `src/app/(app)/profile/page.tsx` - Profile page
   - `src/app/u/[profile_type]/page.tsx` - Profile type page

### Medium Priority - Navigation/Routing
- Update navigation configs to remove deleted routes
- Update admin pages to remove tags/areas references
- Update map page to remove area/tag functionality

### Low Priority - Cleanup
- Remove unused imports
- Update type definitions
- Clean up unused utilities

## Migration Notes

### Posts Table
- ✅ Migration 120: Updated `posts.profile_id` to reference `accounts.id`
- Posts now use `account_id` instead of `profile_id`

### Location Searches Table
- ✅ Migration 122: Updated `location_searches.profile_id` to `account_id`
- Location searches now use `account_id` instead of `profile_id`

### Pins Table
- Migration 121: Dropped `profile_id` foreign key constraint
- `profile_id` column still exists but no longer references profiles table
- Consider removing `profile_id` column entirely or updating to `account_id`

## Recommendations

1. **Remove Tag Functionality from Pins:**
   - Pins can still have `tag_id` column but tag service is gone
   - Either remove tag selection from pin creation forms or create a new tag system

2. **Remove Area Functionality from Map:**
   - Areas table is dropped, so all area drawing/editing should be removed
   - Update map page to remove area-related UI

3. **Profile Context:**
   - Currently stubbed to return empty/null values
   - Decide if profiles concept is needed or if everything should use accounts directly
   - If profiles are needed, create new implementation without database table

4. **Skip Trace:**
   - Page deleted but API service (`src/features/api/services/skipTraceService.ts`) kept
   - Service can still make API calls, just doesn't store results in database

## Next Steps

1. Update all components that use AreaService/TagService to remove or stub functionality
2. Update map page to remove area/tag features
3. Update pin creation/editing to remove tag requirements (or create new tag system)
4. Update navigation to remove deleted routes
5. Test application to ensure no broken imports
6. Consider removing `profile_id` column from pins table entirely



