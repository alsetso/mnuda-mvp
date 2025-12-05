# PageStatsCard Verification Guide

## Implementation Summary

### ✅ Features Added
1. **Auto-refresh**: Stats automatically refresh every 30 seconds
2. **Manual refresh**: Refresh button in header to manually update stats
3. **Error handling**: Displays error messages if stats fail to load
4. **Data validation**: Validates API response structure
5. **Loading states**: Shows loading skeleton while fetching

### 🔍 How It Works

#### Data Flow
1. **Page View Tracking**: 
   - `/business/[id]` page calls `usePageView({ entity_type: 'page', entity_id: business.id })`
   - This calls `/api/analytics/view` which inserts into `page_views` table
   - Record has: `entity_type='page'`, `entity_id=<page_id>`, `viewed_at`, `account_id`, `ip_address`

2. **Stats Fetching**:
   - `PageStatsCard` calls `/api/analytics/business-stats?id=<page_id>&hours=24`
   - API calls `get_page_stats_by_id(p_entity_id, p_hours)`
   - Function queries `page_views` WHERE `entity_type='page'` AND `entity_id=<page_id>`

3. **Auto-Refresh**:
   - Component fetches stats on mount
   - Refreshes every 30 seconds automatically
   - Manual refresh button available

### 🧪 Testing Checklist

#### 1. Verify Database Function Exists
```sql
SELECT proname, proargnames, prorettype 
FROM pg_proc 
WHERE proname = 'get_page_stats_by_id';
```

#### 2. Test Function Directly
```sql
-- Replace with actual page ID
SELECT * FROM get_page_stats_by_id('your-page-id-here'::uuid, 24);
```

#### 3. Test API Endpoint
```bash
# Test with page ID
curl "http://localhost:3000/api/analytics/business-stats?id=<page-id>&hours=24"

# Should return:
# {
#   "total_loads": <number>,
#   "unique_visitors": <number>,
#   "accounts_active": <number>
# }
```

#### 4. Verify Page Views Are Being Tracked
```sql
-- Check if page views are being recorded
SELECT 
  entity_type,
  entity_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT account_id) as unique_accounts,
  COUNT(DISTINCT ip_address) as unique_ips
FROM page_views
WHERE entity_type = 'page'
  AND entity_id = 'your-page-id-here'::uuid
GROUP BY entity_type, entity_id;
```

#### 5. Component Testing
- [ ] Component loads without errors
- [ ] Stats display correctly (not all zeros if views exist)
- [ ] Time period toggle works (24h ↔ 7d)
- [ ] Manual refresh button works
- [ ] Auto-refresh happens every 30 seconds
- [ ] Error messages display if API fails
- [ ] Loading state shows while fetching

### 🐛 Common Issues & Fixes

#### Issue: Stats show all zeros
**Possible causes:**
1. Migration not run - `get_page_stats_by_id` function doesn't exist
2. No page views recorded yet - check `page_views` table
3. Wrong entity_id - verify the page ID matches

**Fix:**
```sql
-- Check if function exists
\df get_page_stats_by_id

-- Check if views are being recorded
SELECT * FROM page_views 
WHERE entity_type = 'page' 
  AND entity_id = 'your-page-id'::uuid
ORDER BY viewed_at DESC
LIMIT 10;
```

#### Issue: Function doesn't exist error
**Fix:** Run migration 163
```bash
supabase migration up
# or manually apply supabase/migrations/163_add_page_stats_by_id.sql
```

#### Issue: Stats not updating
**Possible causes:**
1. Auto-refresh interval not working
2. API returning cached data
3. Page views not being tracked

**Fix:**
- Check browser console for errors
- Verify `usePageView` is being called on page load
- Check network tab for API calls
- Verify page views are in database

### 📊 Expected Behavior

1. **On Page Load:**
   - Component shows loading skeleton
   - Fetches stats from API
   - Displays stats (or zeros if no views)

2. **After 30 Seconds:**
   - Automatically refreshes stats
   - Updates counts if new views occurred

3. **On Time Period Toggle:**
   - Immediately fetches new stats for selected period
   - Updates all three metrics

4. **On Manual Refresh:**
   - Shows loading state
   - Fetches latest stats
   - Updates display

### 🔧 Debugging

Enable console logging:
```javascript
// In PageStatsCard component, check console for:
// - "Error fetching page stats:" - API errors
// - Network tab - API request/response
// - React DevTools - Component state updates
```

Check database:
```sql
-- Verify views are being tracked
SELECT 
  entity_type,
  entity_id,
  COUNT(*) as total,
  MIN(viewed_at) as first_view,
  MAX(viewed_at) as last_view
FROM page_views
WHERE entity_type = 'page'
GROUP BY entity_type, entity_id
ORDER BY total DESC;
```

