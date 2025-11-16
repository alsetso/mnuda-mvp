# Community Feed Table Column Assessment

## Current Schema
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, REFERENCES auth.users)
- message (TEXT, 1-500 chars)
- created_at (TIMESTAMP WITH TIME ZONE)
```

## Recommended Additions

### 1. **updated_at** (High Priority)
**Purpose**: Track when messages are edited
**Type**: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
**Use Case**: Allow users to edit their messages, show "(edited)" indicator
**Migration Impact**: Low - just add column and trigger

### 2. **edited** (Medium Priority)
**Purpose**: Boolean flag to indicate if message was edited
**Type**: `BOOLEAN DEFAULT FALSE`
**Use Case**: Quick check without comparing timestamps
**Migration Impact**: Low

### 3. **deleted_at** (Medium Priority)
**Purpose**: Soft delete support
**Type**: `TIMESTAMP WITH TIME ZONE NULL`
**Use Case**: Allow deletion without hard delete (preserve data, hide from feed)
**Migration Impact**: Medium - requires filtering logic changes

### 4. **parent_id** (Low Priority - Future Feature)
**Purpose**: Threading/replies to messages
**Type**: `UUID REFERENCES community_feed(id) ON DELETE CASCADE NULL`
**Use Case**: Allow replies to specific messages
**Migration Impact**: Medium - requires UI changes

### 5. **reactions** (Low Priority - Future Feature)
**Purpose**: Store reaction counts (likes, etc.)
**Type**: `JSONB DEFAULT '{}'::jsonb` OR separate `community_feed_reactions` table
**Use Case**: Allow users to react to messages
**Migration Impact**: High - separate table is better for scalability

### 6. **is_pinned** (Low Priority)
**Purpose**: Pin important messages to top
**Type**: `BOOLEAN DEFAULT FALSE`
**Use Case**: Pin announcements or important messages
**Migration Impact**: Low

### 7. **metadata** (Low Priority)
**Purpose**: Flexible JSON storage for future features
**Type**: `JSONB DEFAULT '{}'::jsonb`
**Use Case**: Store mentions, links, attachments metadata
**Migration Impact**: Low

## Recommendations by Use Case

### Minimal Chat (Current)
✅ Current schema is sufficient for basic public chat

### Chat with Edit/Delete
✅ Add: `updated_at`, `edited`, `deleted_at`

### Full-Featured Chat
✅ Add: `updated_at`, `edited`, `deleted_at`, `parent_id`, `is_pinned`

### Social Feed Style
✅ Add: `updated_at`, `edited`, separate `community_feed_reactions` table

## Migration Priority

**Phase 1 (Essential)**: None - current schema works
**Phase 2 (Nice to Have)**: `updated_at`, `edited`
**Phase 3 (Advanced)**: `deleted_at`, `parent_id`, `is_pinned`

