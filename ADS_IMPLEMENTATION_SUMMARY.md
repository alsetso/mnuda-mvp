# Ads System Implementation Summary

## What Was Built

### 1. Ad Events Table (`ad_events`)
- **Purpose**: Track detailed impressions and clicks with member attribution
- **Fields**:
  - `ad_id` - Which ad was viewed/clicked
  - `event_type` - 'impression' or 'click'
  - `placement` - 'article_left', 'article_right', or 'article_both'
  - `article_slug` - Which article the ad appeared on (NULL = all articles)
  - `member_id` - Which member viewed/clicked (NULL for anonymous)
  - `created_at` - Timestamp of event

### 2. Enhanced Tracking
- **Member Attribution**: Tracks which members viewed/clicked ads
- **Placement Tracking**: Knows which side (left/right) the ad appeared on
- **Article Tracking**: Knows which article the ad appeared on
- **Event Logging**: All events stored in `ad_events` table for analytics
- **Counter Updates**: Still maintains `impression_count` and `click_count` on ads table for fast queries

### 3. Carousel Improvements

#### Auto-Rotation
- **Default Interval**: 8 seconds (8000ms)
- **Configurable**: Can be customized via `rotationInterval` prop
- **Smart Reset**: Timer resets when user manually navigates

#### Ad Limits
- **Default Limit**: 5 ads per carousel
- **Configurable**: Can be customized via `maxAds` prop
- **Server-Side**: Limit applied in API query for efficiency

#### Indexing & Rotation
- **Circular Rotation**: Ads cycle through continuously
- **Manual Navigation**: Users can click arrows or indicators
- **Auto-Resume**: Auto-rotation resumes after manual navigation
- **Proper Indexing**: Uses modulo arithmetic for seamless looping

### 4. API Enhancements

#### `/api/ads/public`
- Added `limit` parameter to control how many ads to fetch
- Example: `/api/ads/public?placement=article_left&limit=5`

#### `/api/ads/[id]/track`
- Now requires `placement` parameter
- Optionally accepts `articleSlug` parameter
- Automatically captures `member_id` if user is authenticated
- Uses new `track_ad_event` RPC function

## Configuration

### Carousel Props
```typescript
<AdsPublicCarousel
  placement="article_left"
  articleSlug="under-dev-and-acq"
  maxAds={5}              // Default: 5
  rotationInterval={8000} // Default: 8000ms (8 seconds)
/>
```

### Defaults
- **Max Ads**: 5 per carousel
- **Rotation Interval**: 8 seconds
- **Event Tracking**: Automatic (impressions on view, clicks on click)

## Database Schema

### `ad_events` Table
```sql
- id (UUID)
- ad_id (UUID, FK → ads)
- event_type (ENUM: 'impression', 'click')
- placement (ENUM: 'article_left', 'article_right', 'article_both')
- article_slug (TEXT, nullable)
- member_id (UUID, FK → members, nullable)
- created_at (TIMESTAMP)
```

### RPC Function: `track_ad_event`
- Inserts event into `ad_events` table
- Updates counter on `ads` table atomically
- Handles both authenticated and anonymous users

## Analytics Capabilities

### What You Can Now Track
1. **Member-Level Analytics**: See which members viewed/clicked ads
2. **Placement Performance**: Compare left vs right side performance
3. **Article Performance**: See which articles drive engagement
4. **Time-Based Trends**: Historical data via `created_at` timestamps
5. **Anonymous vs Authenticated**: Distinguish between logged-in and anonymous users

### Example Queries

**Get impressions by member:**
```sql
SELECT member_id, COUNT(*) 
FROM ad_events 
WHERE event_type = 'impression' 
GROUP BY member_id;
```

**Compare placement performance:**
```sql
SELECT placement, COUNT(*) 
FROM ad_events 
WHERE event_type = 'impression' 
GROUP BY placement;
```

**Article-specific analytics:**
```sql
SELECT article_slug, COUNT(*) 
FROM ad_events 
WHERE article_slug IS NOT NULL 
GROUP BY article_slug;
```

## Migration Files

1. `20250131_create_ads_table.sql` - Original ads table
2. `20250131_create_ad_events_table.sql` - New events tracking table

## Next Steps (Optional Enhancements)

1. **Analytics Dashboard**: Build UI to visualize ad performance
2. **Member Deduplication**: Prevent same member from inflating counts (session-based)
3. **A/B Testing**: Track different ad variations
4. **Performance Metrics**: Calculate CTR, conversion rates, etc.


