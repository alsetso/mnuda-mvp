# Ads Tracking Analysis

## Current Implementation

### What is Currently Tracked

1. **Impression Count** (`impression_count`)
   - Incremented when ad appears in carousel
   - Tracks once per carousel instance (uses `Set` to prevent duplicates)
   - No visibility verification (ad might be below fold)
   - No time-based validation

2. **Click Count** (`click_count`)
   - Incremented when user clicks ad link
   - Simple counter

### Current Impression Definition

**Current behavior:** An impression is counted when:
- Ad is loaded into carousel
- Ad becomes the `currentIndex` in carousel
- Only once per carousel instance (client-side deduplication)

**Problem:** This doesn't verify the ad is actually visible on screen.

---

## Industry Standard Impression Definition

According to IAB (Interactive Advertising Bureau) standards:
- **Viewable Impression:** Ad must be at least 50% visible in viewport for at least 1 continuous second
- **Served Impression:** Ad is loaded/rendered (what we currently track)

Most ad platforms use **viewable impressions** for billing and analytics.

---

## Current Schema Analysis

### ✅ What Works

1. **Basic counters** - `impression_count` and `click_count` are sufficient for simple metrics
2. **Atomic increments** - RPC functions prevent race conditions
3. **Client-side deduplication** - Prevents multiple counts per session

### ❌ What's Missing

1. **No visibility detection** - Can't verify ad is actually seen
2. **No time tracking** - Can't see when impressions/clicks occurred
3. **No user/session tracking** - Same user refreshing counts multiple times
4. **No placement analytics** - Can't compare left vs right performance
5. **No article analytics** - Can't see which articles drive engagement
6. **No view duration** - Can't measure engagement quality
7. **No geographic data** - Can't see location-based performance
8. **No device/browser data** - Can't optimize for specific platforms

---

## Recommendations

### Option 1: Minimal Enhancement (Recommended for MVP)

**Add visibility detection using Intersection Observer:**

```typescript
// Enhanced impression tracking
- Use Intersection Observer API to detect when ad is 50%+ visible
- Track only after 1 second of visibility
- Still use simple counters (no schema changes needed)
```

**Benefits:**
- More accurate impressions
- No database changes
- Industry-standard definition
- Minimal code changes

**Schema changes:** None

---

### Option 2: Enhanced Analytics (Future)

**Add detailed tracking table:**

```sql
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'impression', 'click', 'view_time'
  placement TEXT, -- 'article_left', 'article_right'
  article_slug TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  view_duration_ms INTEGER,
  is_viewable BOOLEAN, -- 50% visible for 1+ second
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Benefits:**
- Historical data
- User-level analytics
- Placement/article performance
- Time-based trends
- Better fraud detection

**Trade-offs:**
- More complex queries
- More storage
- Requires migration

---

### Option 3: Hybrid Approach (Best Long-term)

**Keep simple counters + add event log:**

1. Keep `impression_count` and `click_count` for fast queries
2. Add `ad_events` table for detailed analytics
3. Aggregate events into counters periodically

**Benefits:**
- Fast dashboard queries (counters)
- Detailed analytics when needed (events)
- Best of both worlds

---

## Immediate Action Items

### 1. Fix Impression Tracking (High Priority)

**Current Issue:** Impressions counted even if ad is below fold or not visible.

**Solution:** Add Intersection Observer to `AdsPublicCarousel.tsx`:

```typescript
// Track only when ad is actually visible
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Ad is 50%+ visible
          // Wait 1 second, then track
          const timer = setTimeout(() => {
            if (entry.isIntersecting) {
              trackImpression(ad.id);
            }
          }, 1000);
          return () => clearTimeout(timer);
        }
      });
    },
    { threshold: 0.5 } // 50% visibility
  );
  
  // Observe ad element
  // ...
}, [ad]);
```

### 2. Add Session Deduplication (Medium Priority)

**Current Issue:** Same user refreshing page counts multiple impressions.

**Solution:** Use localStorage to track impressions per session:

```typescript
const hasTrackedInSession = localStorage.getItem(`ad_impression_${adId}`);
if (!hasTrackedInSession) {
  trackImpression(adId);
  localStorage.setItem(`ad_impression_${adId}`, 'true');
}
```

### 3. Add Time-based Analytics (Low Priority - Future)

**When needed:** Add `ad_events` table for detailed tracking.

---

## Current Schema Assessment

### ✅ Sufficient For:
- Basic impression/click counts
- Simple CTR calculation
- MVP analytics

### ❌ Insufficient For:
- Viewable impression verification
- Historical trends
- User-level analytics
- Placement/article performance
- Fraud detection
- Time-based analysis

---

## Conclusion

**Current implementation is adequate for MVP** but has limitations:

1. **Impression definition is too loose** - counts even if not visible
2. **No historical data** - can't see trends over time
3. **No user deduplication** - same user can inflate counts

**Recommended next steps:**
1. ✅ Add Intersection Observer for viewable impressions (no schema change)
2. ✅ Add session-based deduplication (no schema change)
3. ⏳ Add `ad_events` table when detailed analytics are needed

The current schema is **minimal but functional**. Enhance tracking logic first, then add database complexity only when needed.

