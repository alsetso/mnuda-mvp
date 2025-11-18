# Ads Carousel Scalability Analysis

## Current Implementation

### Current Limits
- **Default**: 5 ads per carousel
- **Configurable**: Via `maxAds` prop
- **No hard limit**: Can technically show unlimited ads

### Current Selection Strategy
- **Order**: `created_at DESC` (newest first)
- **Filter**: Active ads matching placement/article
- **Limit**: Applied in JavaScript after fetching ALL ads

## Problems with 1000+ Ads

### 1. Performance Issues

**Current Flow:**
```
1. Fetch ALL active ads from database (could be 1000+)
2. Filter by date range in JavaScript
3. Slice to limit in JavaScript
4. Send to frontend
```

**Problems:**
- ❌ Fetches 1000+ ads when only need 5
- ❌ Network overhead (transferring unused data)
- ❌ Memory usage (storing all ads in state)
- ❌ Slow initial load
- ❌ Database query overhead

### 2. User Experience Issues

**Current Behavior:**
- Always shows same 5 newest ads
- No variety for returning users
- No performance-based selection
- No fair rotation

### 3. Database Load

- Full table scan on every page load
- No query optimization for large datasets
- No caching strategy

---

## Required Updates

### 1. Database Query Optimization (CRITICAL)

**Current (Inefficient):**
```typescript
// Fetches ALL ads, then filters in JS
let query = supabase
  .from('ads')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

const { data } = await query;
// Then filter and slice in JavaScript
```

**Should Be:**
```typescript
// Apply limit and date filters in database
let query = supabase
  .from('ads')
  .select('*')
  .eq('status', 'active')
  .or(`placement.eq.${placement},placement.eq.article_both`)
  .lte('start_date', now) // Filter dates in DB
  .or(`end_date.is.null,end_date.gte.${now}`)
  .order('created_at', { ascending: false })
  .limit(limit); // Apply limit in database
```

### 2. Smart Ad Selection Strategies

**Option A: Random Selection**
- Show different ads each time
- Good for variety
- Simple to implement

**Option B: Performance-Based (CTR)**
- Show ads with higher click-through rates
- Rewards successful ads
- Better for advertisers

**Option C: Round-Robin**
- Rotate through all ads fairly
- Ensures all ads get shown
- Good for fairness

**Option D: Weighted Random**
- Combine performance + randomness
- Best of both worlds
- Most complex

### 3. Pagination / Infinite Rotation

**Current:** Loads 5 ads, rotates through them

**Better:** 
- Load initial 5 ads
- When user reaches end, fetch next 5
- Infinite rotation through all ads

### 4. Caching Strategy

**Options:**
- Cache active ads list (refresh every 5 minutes)
- Cache per placement/article combination
- Use Next.js ISR (Incremental Static Regeneration)

---

## Recommended Implementation

### Phase 1: Fix Database Query (Immediate)

**Priority: HIGH**

Move filtering and limiting to database:

```typescript
static async getActiveAds(
  placement: 'article_left' | 'article_right',
  articleSlug?: string | null,
  limit: number = 5
): Promise<Ad[]> {
  const now = new Date().toISOString();
  
  let query = supabase
    .from('ads')
    .select('*')
    .eq('status', 'active')
    .or(`placement.eq.${placement},placement.eq.article_both`)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Filter by article slug
  if (articleSlug) {
    query = query.or(`target_article_slug.is.null,target_article_slug.eq.${articleSlug}`);
  } else {
    query = query.is('target_article_slug', null);
  }

  // Filter dates in database (if possible) or keep in JS for complex OR logic
  const { data, error } = await query;
  
  // Final date filter in JS (for complex OR conditions)
  const filtered = (data || []).filter(ad => {
    const startValid = !ad.start_date || new Date(ad.start_date) <= new Date(now);
    const endValid = !ad.end_date || new Date(ad.end_date) >= new Date(now);
    return startValid && endValid;
  });

  return filtered;
}
```

**Impact:**
- ✅ Only fetches 5 ads instead of 1000+
- ✅ 99% reduction in data transfer
- ✅ Faster queries
- ✅ Lower database load

### Phase 2: Add Selection Strategy (Short-term)

**Priority: MEDIUM**

Add strategy parameter:

```typescript
type AdSelectionStrategy = 'newest' | 'random' | 'performance' | 'round_robin';

static async getActiveAds(
  placement: 'article_left' | 'article_right',
  articleSlug?: string | null,
  limit: number = 5,
  strategy: AdSelectionStrategy = 'newest'
): Promise<Ad[]> {
  // ... base query ...
  
  switch (strategy) {
    case 'random':
      // Order by random() in database
      query = query.order('random()');
      break;
    case 'performance':
      // Order by CTR (click_count / impression_count)
      query = query.order('click_count', { ascending: false });
      break;
    case 'round_robin':
      // Use modulo with timestamp for rotation
      // More complex, requires tracking last shown
      break;
    default:
      // 'newest' - default behavior
      query = query.order('created_at', { ascending: false });
  }
  
  return filtered;
}
```

### Phase 3: Infinite Rotation (Long-term)

**Priority: LOW**

Load more ads as user navigates:

```typescript
// In carousel component
const [loadedAds, setLoadedAds] = useState<Ad[]>([]);
const [page, setPage] = useState(0);

const loadMoreAds = async () => {
  const nextPage = page + 1;
  const newAds = await AdService.getActiveAds(
    placement,
    articleSlug,
    5, // limit
    'newest',
    nextPage // offset
  );
  setLoadedAds([...loadedAds, ...newAds]);
  setPage(nextPage);
};

// When reaching end of carousel
useEffect(() => {
  if (currentIndex >= loadedAds.length - 2) {
    loadMoreAds();
  }
}, [currentIndex]);
```

---

## Frontend Updates Needed

### Current State
- ✅ Already has `maxAds` prop (configurable)
- ✅ Already limits ads client-side
- ❌ No pagination/infinite scroll
- ❌ No strategy selection

### Required Changes

1. **Database Query Fix** (Backend)
   - Move `.limit()` to database query
   - Filter dates in database when possible

2. **Selection Strategy** (Backend + Frontend)
   - Add strategy parameter to API
   - Add strategy prop to carousel component

3. **Infinite Rotation** (Frontend)
   - Load more ads as user navigates
   - Track loaded ads vs displayed ads

---

## Performance Comparison

### Current (1000 ads)
- **Database Query**: Fetches 1000 rows
- **Network Transfer**: ~500KB (estimated)
- **Memory**: Stores 1000 ad objects
- **Query Time**: ~200-500ms

### Optimized (1000 ads, limit 5)
- **Database Query**: Fetches 5 rows
- **Network Transfer**: ~2.5KB
- **Memory**: Stores 5 ad objects
- **Query Time**: ~10-50ms

**Improvement: 10-50x faster, 200x less data**

---

## Recommendations

### Immediate (Do Now)
1. ✅ Move `.limit()` to database query
2. ✅ Add date filtering in database where possible
3. ✅ Set reasonable default limit (5 is good)

### Short-term (Next Sprint)
1. Add random selection strategy
2. Add caching (5-minute TTL)
3. Monitor query performance

### Long-term (Future)
1. Performance-based selection (CTR)
2. Infinite rotation
3. A/B testing different strategies

---

## Answer to Your Questions

### "How many ads can the carousel hold?"
- **Technically**: Unlimited (no hard limit)
- **Practically**: 5-10 is optimal for UX
- **Configurable**: Via `maxAds` prop

### "What if we have 1000 ads?"
- **Current**: Would fetch all 1000, very slow
- **After fix**: Only fetches 5, fast
- **Need updates**: Yes, database query optimization required

### "Would we need frontend updates?"
- **Critical**: No (backend fix handles it)
- **Recommended**: Yes (add selection strategies)
- **Optional**: Infinite rotation for better UX


