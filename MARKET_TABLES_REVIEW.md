# Market/Marketplace Database Tables Review

## Overview
The market functionality uses the `marketplace_listings` table (note: table name still uses "marketplace" but routes use "market"). This table stores listings for both physical and digital items that can be connected to location pins.

---

## Table: `marketplace_listings`

### Columns

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique identifier |
| `created_by` | UUID | NOT NULL, FK → `auth.users(id)` | - | Creator user ID (cascades on delete) |
| `title` | TEXT | NOT NULL, CHECK (3-200 chars) | - | Listing title (3-200 characters) |
| `description` | TEXT | CHECK (≤2000 chars) | - | Optional description (max 2000 chars) |
| `listing_type` | ENUM | NOT NULL | `'physical'` | Type: `'physical'` or `'digital'` |
| `price` | DECIMAL(10,2) | NOT NULL, CHECK (≥0) | `0.00` | Price in dollars (2 decimal places) |
| `is_free` | BOOLEAN | NOT NULL | `false` | Whether listing is free |
| `status` | ENUM | NOT NULL | `'active'` | Status: `'active'`, `'sold'`, `'expired'`, `'draft'` |
| `image_urls` | TEXT[] | - | `ARRAY[]::TEXT[]` | Array of image URLs |
| `pin_id` | UUID | FK → `pins(id)`, SET NULL on delete | - | Optional location pin reference |
| `visit_count` | INTEGER | NOT NULL | `0` | Page view counter (added in migration) |
| `created_at` | TIMESTAMPTZ | - | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | - | `NOW()` | Last update timestamp (auto-updated) |

### Custom Types

#### `listing_type` ENUM
- `'physical'` - Physical items requiring shipping/pickup
- `'digital'` - Digital items (downloads, services, etc.)

#### `listing_status` ENUM
- `'active'` - Currently available for purchase
- `'sold'` - Item has been sold
- `'expired'` - Listing has expired
- `'draft'` - Not yet published

### Foreign Keys

1. **`created_by` → `auth.users(id)`**
   - ON DELETE CASCADE
   - Also has FK to `members(id)` for PostgREST joins

2. **`pin_id` → `pins(id)`**
   - ON DELETE SET NULL
   - Optional location reference

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_marketplace_listings_created_by` | `created_by` | Fast lookup by creator |
| `idx_marketplace_listings_status` | `status` | Filter active listings |
| `idx_marketplace_listings_listing_type` | `listing_type` | Filter by type |
| `idx_marketplace_listings_created_at` | `created_at DESC` | Sort by newest |
| `idx_marketplace_listings_pin_id` | `pin_id` | Join with pins table |
| `idx_marketplace_listings_price` | `price` | Sort/filter by price |
| `idx_marketplace_listings_visit_count` | `visit_count DESC` | Sort by popularity |

### Triggers

**`update_marketplace_listings_updated_at`**
- Fires: BEFORE UPDATE
- Action: Updates `updated_at` to current timestamp
- Function: `public.update_updated_at_column()`

### Row Level Security (RLS) Policies

#### For Authenticated Users

1. **"Anyone can view active listings"**
   - Operation: SELECT
   - Condition: `status = 'active'`
   - Purpose: Public browsing of active listings

2. **"Users can view their own listings"**
   - Operation: SELECT
   - Condition: `auth.uid() = created_by`
   - Purpose: Users can see their own listings regardless of status

3. **"Authenticated users can create listings"**
   - Operation: INSERT
   - Condition: `auth.uid() = created_by`
   - Purpose: Users can create listings for themselves

4. **"Users can update their own listings"**
   - Operation: UPDATE
   - Condition: `auth.uid() = created_by` (both USING and WITH CHECK)
   - Purpose: Users can only update their own listings

5. **"Users can delete their own listings"**
   - Operation: DELETE
   - Condition: `auth.uid() = created_by`
   - Purpose: Users can only delete their own listings

#### For Anonymous Users

6. **"Anonymous users can view active listings"**
   - Operation: SELECT
   - Condition: `status = 'active'`
   - Purpose: Allow public browsing without authentication

### RPC Functions

**`increment_listing_visit_count(listing_id UUID)`**
- Purpose: Atomically increment visit count
- Security: SECURITY DEFINER
- Permissions: Available to `authenticated` and `anon`
- Usage: Called when listing detail page is viewed

### Storage Bucket

**`marketplace-images`**
- Type: Public bucket
- Purpose: Store listing images
- Size Limit: 5MB per file
- RLS Policies:
  - Authenticated users can upload
  - Anyone can view (public)
  - Users can update/delete their own images

---

## Data Validation Rules

### Title
- Required: Yes
- Min Length: 3 characters
- Max Length: 200 characters
- Validation: Database CHECK constraint

### Description
- Required: No (nullable)
- Max Length: 2000 characters
- Validation: Database CHECK constraint

### Price
- Required: Yes (defaults to 0.00)
- Min Value: 0 (cannot be negative)
- Decimal Places: 2
- Validation: Database CHECK constraint
- Note: If `is_free = true`, price should be 0

### Image URLs
- Type: Array of text
- Default: Empty array
- Storage: URLs point to `marketplace-images` bucket

---

## Relationships

### With `pins` Table
- **Relationship**: Optional one-to-many (pin can have multiple listings)
- **Foreign Key**: `pin_id`
- **Behavior**: SET NULL on pin deletion (listing remains, just loses location)
- **Use Case**: Link listings to specific locations on the map

### With `members` Table
- **Relationship**: One-to-many (member can create many listings)
- **Foreign Key**: `created_by` (via `members(id)`)
- **Behavior**: CASCADE on member deletion
- **Use Case**: Show seller information, ownership checks

### With `auth.users` Table
- **Relationship**: One-to-many (user can create many listings)
- **Foreign Key**: `created_by` (via `auth.users(id)`)
- **Behavior**: CASCADE on user deletion
- **Use Case**: Authentication and authorization

---

## Query Patterns

### Common Queries

1. **Get all active listings** (public view)
   ```sql
   SELECT * FROM marketplace_listings 
   WHERE status = 'active' 
   ORDER BY created_at DESC;
   ```

2. **Get user's listings** (all statuses)
   ```sql
   SELECT * FROM marketplace_listings 
   WHERE created_by = auth.uid() 
   ORDER BY created_at DESC;
   ```

3. **Get listing with related data** (PostgREST)
   ```sql
   SELECT *, 
     pin:pins(id, name, address, lat, long),
     user:members!marketplace_listings_created_by_members_fk(id, name, avatar_url)
   FROM marketplace_listings
   WHERE id = :listing_id;
   ```

4. **Increment visit count**
   ```sql
   SELECT increment_listing_visit_count(:listing_id);
   ```

---

## Potential Improvements

### Missing Fields
1. **Category/Tags**: No categorization system for listings
2. **Contact Info**: No seller contact information (relies on user profile)
3. **Expiration Date**: No automatic expiration mechanism
4. **Featured/Promoted**: No way to highlight important listings
5. **Condition**: For physical items, no condition field (new, used, etc.)
6. **Quantity**: No inventory tracking for multiple items
7. **Shipping Info**: No shipping details for physical items
8. **Payment Methods**: No payment method specification

### Index Considerations
- Consider composite index on `(status, created_at DESC)` for common active listings query
- Consider composite index on `(status, listing_type)` if filtering by both is common
- Consider full-text search index on `title` and `description` for search functionality

### RLS Policy Considerations
- Current policies allow viewing all active listings (good for discovery)
- Consider adding policy for users to view their own draft listings more explicitly
- Consider adding policy for moderators/admins to view all listings

### Data Integrity
- No constraint ensuring `is_free = true` when `price = 0`
- No constraint preventing `price > 0` when `is_free = true`
- Consider adding CHECK constraint: `(is_free = false AND price > 0) OR (is_free = true AND price = 0)`

---

## Migration History

1. **20250122_create_marketplace_listings.sql**
   - Initial table creation
   - Core columns and RLS policies

2. **20250123_add_visit_counts.sql**
   - Added `visit_count` column
   - Created increment function
   - Added visit count index

---

## Notes

- Table name uses "marketplace" but application routes use "market"
- Consider renaming table to `market_listings` for consistency (would require migration)
- Storage bucket name also uses "marketplace-images" - consider renaming for consistency

