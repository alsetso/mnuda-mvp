# Jobs System Strategy

## Overview
Simple, straightforward job posting and inquiry system where:
- Any user with an account that owns a business can create jobs
- Jobs appear in a feed (similar to posts feed)
- Other accounts can inquire on jobs
- Jobs extend from businesses (business_id foreign key)

## Database Schema

### 1. Jobs Table

```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Job details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT, -- 'full_time', 'part_time', 'contract', 'temporary', 'internship'
  location_type TEXT, -- 'remote', 'on_site', 'hybrid'
  location TEXT, -- Address or location description
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  county_id UUID REFERENCES public.counties(id) ON DELETE SET NULL,
  lat NUMERIC,
  lng NUMERIC,
  
  -- Compensation (optional)
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT, -- 'hourly', 'monthly', 'yearly'
  
  -- Status and visibility
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'draft')),
  
  -- Application details
  application_email TEXT,
  application_url TEXT,
  application_instructions TEXT,
  
  -- Metadata
  inquiries_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT jobs_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT jobs_description_length CHECK (char_length(description) >= 1 AND char_length(description) <= 5000),
  CONSTRAINT jobs_inquiries_count_non_negative CHECK (inquiries_count >= 0),
  CONSTRAINT jobs_view_count_non_negative CHECK (view_count >= 0)
);
```

### 2. Job Inquiries Table

```sql
CREATE TABLE public.job_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Inquiry content
  message TEXT,
  resume_url TEXT, -- Optional resume file URL
  cover_letter TEXT,
  
  -- Contact information (optional, can use account info)
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'rejected', 'accepted')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT job_inquiries_message_length CHECK (message IS NULL OR char_length(message) <= 2000),
  CONSTRAINT job_inquiries_cover_letter_length CHECK (cover_letter IS NULL OR char_length(cover_letter) <= 5000),
  
  -- Prevent duplicate inquiries from same account
  CONSTRAINT job_inquiries_unique_account_job UNIQUE (job_id, account_id)
);
```

## Indexes

```sql
-- Jobs indexes
CREATE INDEX jobs_business_id_idx ON public.jobs(business_id);
CREATE INDEX jobs_status_idx ON public.jobs(status) WHERE status = 'open';
CREATE INDEX jobs_visibility_idx ON public.jobs(visibility) WHERE visibility = 'public';
CREATE INDEX jobs_city_id_idx ON public.jobs(city_id) WHERE city_id IS NOT NULL;
CREATE INDEX jobs_county_id_idx ON public.jobs(county_id) WHERE county_id IS NOT NULL;
CREATE INDEX jobs_created_at_idx ON public.jobs(created_at DESC);
CREATE INDEX jobs_expires_at_idx ON public.jobs(expires_at) WHERE expires_at IS NOT NULL;

-- Job inquiries indexes
CREATE INDEX job_inquiries_job_id_idx ON public.job_inquiries(job_id);
CREATE INDEX job_inquiries_account_id_idx ON public.job_inquiries(account_id);
CREATE INDEX job_inquiries_status_idx ON public.job_inquiries(status);
CREATE INDEX job_inquiries_created_at_idx ON public.job_inquiries(created_at DESC);
```

## RLS Policies

### Jobs Table Policies

```sql
-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public can view open, public jobs
CREATE POLICY "Public can view open public jobs"
  ON public.jobs FOR SELECT
  TO authenticated, anon
  USING (status = 'open' AND visibility = 'public');

-- Business owners can view all their jobs (including drafts and closed)
CREATE POLICY "Business owners can view own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = jobs.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Business owners can create jobs
CREATE POLICY "Business owners can create jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = jobs.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Business owners can update their jobs
CREATE POLICY "Business owners can update own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = jobs.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = jobs.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Business owners can delete their jobs
CREATE POLICY "Business owners can delete own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = jobs.business_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );
```

### Job Inquiries Table Policies

```sql
-- Enable RLS
ALTER TABLE public.job_inquiries ENABLE ROW LEVEL SECURITY;

-- Job owners can view all inquiries for their jobs
CREATE POLICY "Job owners can view inquiries"
  ON public.job_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.businesses ON businesses.id = jobs.business_id
      WHERE jobs.id = job_inquiries.job_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Account owners can view their own inquiries
CREATE POLICY "Account owners can view own inquiries"
  ON public.job_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = job_inquiries.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Authenticated users can create inquiries for open, public jobs
CREATE POLICY "Users can create inquiries for open jobs"
  ON public.job_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = job_inquiries.account_id
      AND accounts.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_inquiries.job_id
      AND jobs.status = 'open'
      AND jobs.visibility = 'public'
    )
  );

-- Job owners can update inquiry status
CREATE POLICY "Job owners can update inquiry status"
  ON public.job_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.businesses ON businesses.id = jobs.business_id
      WHERE jobs.id = job_inquiries.job_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.businesses ON businesses.id = jobs.business_id
      WHERE jobs.id = job_inquiries.job_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Account owners can update their own inquiries (limited fields)
CREATE POLICY "Account owners can update own inquiries"
  ON public.job_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = job_inquiries.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = job_inquiries.account_id
      AND accounts.user_id = auth.uid()
    )
    -- Only allow updating message, cover_letter, resume_url (not status)
    AND OLD.status = NEW.status
  );
```

## Triggers

### Update inquiries_count on job_inquiries changes

```sql
CREATE OR REPLACE FUNCTION public.update_job_inquiries_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs
    SET inquiries_count = inquiries_count + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET inquiries_count = GREATEST(0, inquiries_count - 1)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_job_inquiries_count_trigger
  AFTER INSERT OR DELETE ON public.job_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_inquiries_count();
```

### Update updated_at timestamp

```sql
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_inquiries_updated_at
  BEFORE UPDATE ON public.job_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## Feed Integration

### Option 1: Extend Posts Feed
- Add `entity_type` column to posts (if not exists) or use a separate jobs feed
- Jobs appear alongside posts in main feed
- Filter by `entity_type = 'job'`

### Option 2: Separate Jobs Feed (Recommended)
- Create `/api/jobs` endpoint similar to `/api/feed`
- Jobs feed at `/jobs` route
- Can be filtered by location, job_type, etc.

**Recommendation**: Separate feed for cleaner separation and easier filtering.

## API Endpoints

### 1. GET /api/jobs
- List jobs (with pagination)
- Query params: `limit`, `offset`, `city_id`, `county_id`, `job_type`, `location_type`, `status`
- Returns: Array of jobs with business info

### 2. GET /api/jobs/[id]
- Get single job details
- Returns: Job with business info and inquiry count

### 3. POST /api/jobs
- Create new job
- Body: job fields
- Requires: User owns the business

### 4. PUT /api/jobs/[id]
- Update job
- Requires: User owns the business

### 5. DELETE /api/jobs/[id]
- Delete job
- Requires: User owns the business

### 6. POST /api/jobs/[id]/inquiries
- Create inquiry for a job
- Body: `message`, `cover_letter`, `resume_url` (optional)`
- Requires: Authenticated user, job is open and public

### 7. GET /api/jobs/[id]/inquiries
- Get inquiries for a job
- Requires: User owns the business

### 8. PUT /api/jobs/inquiries/[id]
- Update inquiry status (for job owners)
- Body: `status`
- Requires: User owns the business

### 9. GET /api/jobs/my-inquiries
- Get current user's inquiries
- Returns: Array of inquiries with job info

## UI Components

### 1. Jobs Feed Page (`/jobs`)
- Similar to `/feed` but for jobs
- Filter by location, job type, etc.
- Job cards showing: title, business name, location, job type, salary range

### 2. Job Detail Page (`/jobs/[id]`)
- Full job description
- Business info
- Apply/Inquire button
- Inquiry form modal

### 3. Create Job Form
- Accessible from business dashboard
- Form fields: title, description, job_type, location_type, location, salary, etc.

### 4. Job Inquiry Modal
- Message/cover letter textarea
- Optional resume upload
- Submit inquiry

### 5. Business Dashboard - Jobs Section
- List of jobs for the business
- View inquiries per job
- Update job status
- Manage inquiries (status updates)

## Integration Systems Check

### 1. Page Views System Integration

#### Update page_views table CHECK constraint
```sql
-- Migration: Add 'job' to page_views entity_type constraint
-- Note: Migration 155 already added 'feed', so we're adding 'job' to the existing list
ALTER TABLE public.page_views
  DROP CONSTRAINT IF EXISTS page_views_entity_type_check;

ALTER TABLE public.page_views
  ADD CONSTRAINT page_views_entity_type_check 
  CHECK (entity_type IN ('post', 'article', 'city', 'county', 'account', 'business', 'feed', 'job'));

-- Note: page_views table has constraint requiring either entity_id OR entity_slug
-- Jobs always use entity_id (UUID), never entity_slug, so this constraint is satisfied
```

#### Update record_page_view function
```sql
-- Migration: Update record_page_view to support 'job' entity type
CREATE OR REPLACE FUNCTION public.record_page_view(
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER;
  v_table_name TEXT;
  v_entity_id_for_update UUID;
BEGIN
  -- Validate entity_type (now includes 'job')
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'business', 'feed', 'job') THEN
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;
  
  -- Map entity_type to table name
  v_table_name := CASE p_entity_type
    WHEN 'post' THEN 'posts'
    WHEN 'article' THEN 'articles'
    WHEN 'city' THEN 'cities'
    WHEN 'county' THEN 'counties'
    WHEN 'account' THEN 'accounts'
    WHEN 'business' THEN 'businesses'
    WHEN 'job' THEN 'jobs'
    WHEN 'feed' THEN NULL -- Feed doesn't have a table with view_count
    ELSE NULL
  END;
  
  -- Resolve entity_id based on entity_type and provided identifiers
  IF p_entity_id IS NOT NULL THEN
    -- Direct entity_id provided - use it
    v_entity_id_for_update := p_entity_id;
  ELSIF p_entity_slug IS NOT NULL THEN
    IF p_entity_type = 'account' THEN
      -- Resolve username to account ID
      SELECT id INTO v_entity_id_for_update
      FROM public.accounts
      WHERE username = p_entity_slug
      LIMIT 1;
      
      IF v_entity_id_for_update IS NULL THEN
        RAISE EXCEPTION 'Account not found for username: %', p_entity_slug;
      END IF;
    ELSIF p_entity_type IN ('post', 'article') THEN
      -- Resolve slug to entity ID for posts/articles
      EXECUTE format(
        'SELECT id FROM public.%I WHERE slug = $1 LIMIT 1',
        v_table_name
      )
      USING p_entity_slug
      INTO v_entity_id_for_update;
      
      IF v_entity_id_for_update IS NULL THEN
        RAISE EXCEPTION '% not found for slug: %', p_entity_type, p_entity_slug;
      END IF;
    ELSIF p_entity_type IN ('city', 'county') THEN
      -- Resolve slug to id for cities/counties
      EXECUTE format('SELECT id FROM public.%I WHERE slug = $1 LIMIT 1', v_table_name)
      USING p_entity_slug
      INTO v_entity_id_for_update;
    ELSIF p_entity_type = 'business' THEN
      -- Business pages: 'business' or 'directory' slugs don't resolve to entity_id
      v_entity_id_for_update := NULL;
    ELSIF p_entity_type = 'feed' THEN
      -- Feed doesn't need entity_id resolution, use NULL
      v_entity_id_for_update := NULL;
    ELSIF p_entity_type = 'job' THEN
      -- Jobs use entity_id only (no slug support)
      RAISE EXCEPTION 'Jobs require entity_id, slug lookup not supported';
    ELSE
      -- For other entity types, slug resolution not supported
      RAISE EXCEPTION 'Slug lookup not supported for entity_type: %', p_entity_type;
    END IF;
  ELSE
    -- For feed and business page slugs, allow NULL entity_id
    IF p_entity_type IN ('feed', 'business') THEN
      v_entity_id_for_update := NULL;
    ELSIF p_entity_type = 'job' THEN
      RAISE EXCEPTION 'Jobs require entity_id';
    ELSE
      RAISE EXCEPTION 'Either entity_id or entity_slug must be provided';
    END IF;
  END IF;
  
  -- Insert page view record
  INSERT INTO public.page_views (
    entity_type,
    entity_id,
    entity_slug,
    account_id,
    ip_address,
    viewed_at
  )
  VALUES (
    p_entity_type,
    v_entity_id_for_update,
    CASE 
      WHEN p_entity_type = 'account' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      WHEN p_entity_type IN ('post', 'article') AND p_entity_slug IS NOT NULL THEN p_entity_slug
      WHEN p_entity_type = 'feed' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      WHEN p_entity_type = 'business' AND p_entity_slug IS NOT NULL THEN p_entity_slug
      ELSE NULL
    END,
    p_account_id,
    p_ip_address,
    NOW()
  );
  
  -- Update view_count on entity table (only if table exists and has view_count column)
  IF v_entity_id_for_update IS NOT NULL AND v_table_name IS NOT NULL THEN
    BEGIN
      EXECUTE format(
        'UPDATE public.%I SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1 RETURNING view_count',
        v_table_name
      )
      USING v_entity_id_for_update
      INTO v_view_count;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip update but still record the page view
        v_view_count := 0;
        RAISE WARNING 'view_count column does not exist on table %', v_table_name;
    END;
  ELSE
    -- For feed or entities without tables, return 0 (we track in page_views table)
    v_view_count := 0;
  END IF;
  
  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Update get_entity_visitors function
```sql
-- Migration: Update get_entity_visitors to support 'job' entity type
CREATE OR REPLACE FUNCTION public.get_entity_visitors(
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_slug TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  account_id UUID,
  account_username TEXT,
  account_first_name TEXT,
  account_last_name TEXT,
  account_image_url TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER
) AS $$
DECLARE
  v_entity_id_resolved UUID;
BEGIN
  -- Validate entity_type (now includes 'job')
  IF p_entity_type NOT IN ('post', 'article', 'city', 'county', 'account', 'business', 'job') THEN
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;
  
  -- Resolve entity_id if slug provided
  IF p_entity_type = 'account' AND p_entity_slug IS NOT NULL AND p_entity_id IS NULL THEN
    SELECT id INTO v_entity_id_resolved
    FROM public.accounts
    WHERE username = p_entity_slug
    LIMIT 1;
  ELSIF p_entity_type = 'job' AND p_entity_slug IS NOT NULL THEN
    RAISE EXCEPTION 'Jobs require entity_id, slug lookup not supported';
  ELSE
    v_entity_id_resolved := p_entity_id;
  END IF;
  
  -- Return visitors with account info
  RETURN QUERY
  SELECT DISTINCT ON (pv.account_id)
    a.id AS account_id,
    a.username AS account_username,
    a.first_name AS account_first_name,
    a.last_name AS account_last_name,
    a.image_url AS account_image_url,
    MAX(pv.viewed_at) AS viewed_at,
    COUNT(*)::INTEGER AS view_count
  FROM public.page_views pv
  INNER JOIN public.accounts a ON pv.account_id = a.id
  WHERE pv.entity_type = p_entity_type
    AND (
      (v_entity_id_resolved IS NOT NULL AND pv.entity_id = v_entity_id_resolved) OR
      (p_entity_slug IS NOT NULL AND pv.entity_slug = p_entity_slug)
    )
    AND pv.account_id IS NOT NULL
  GROUP BY a.id, a.username, a.first_name, a.last_name, a.image_url, pv.account_id
  ORDER BY pv.account_id, MAX(pv.viewed_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Update page_views RLS policies for job owners
```sql
-- Migration: Add RLS policy for job owners to view visitors
-- Update existing policy to include jobs
DROP POLICY IF EXISTS "Users can view visitors to own content" ON public.page_views;

CREATE POLICY "Users can view visitors to own content"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (
    -- For account profiles, check if viewing own profile's visitors
    (entity_type = 'account' AND entity_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)) OR
    -- For posts/articles, check ownership via account_id
    (entity_type IN ('post', 'article') AND EXISTS (
      SELECT 1 FROM public.posts WHERE id = page_views.entity_id AND account_id = (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1)
    )) OR
    -- For jobs, check ownership via business -> account
    (entity_type = 'job' AND EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.businesses ON businesses.id = jobs.business_id
      WHERE jobs.id = page_views.entity_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = businesses.account_id
        AND accounts.user_id = auth.uid()
      )
    ))
  );
```

### 2. Analytics API Integration

#### Update /api/analytics/view route
```typescript
// src/app/api/analytics/view/route.ts
type EntityType = 'post' | 'article' | 'city' | 'county' | 'account' | 'business' | 'feed' | 'job';

// In POST handler - already supports any entity_type via RPC call, just need to update validation
const validTypes: EntityType[] = ['post', 'article', 'city', 'county', 'account', 'business', 'feed', 'job'];

// In GET handler - add jobs to tableMap
const tableMap: Record<EntityType, string> = {
  post: 'posts',
  article: 'articles',
  city: 'cities',
  county: 'counties',
  account: 'accounts',
  business: 'businesses',
  job: 'jobs',
  feed: '', // Feed doesn't have a table
};
```

### 3. Jobs Feed Integration

Jobs use **separate feed** (not integrated into posts feed):
- `/api/jobs` endpoint (similar to `/api/feed`)
- `/jobs` route (separate from `/feed`)
- Jobs use `entity_id` (UUID) for page tracking, not slugs
- Jobs have `view_count` column (already in schema)

### 4. Integration Summary

✅ **Page Views System**
- Jobs added to `page_views.entity_type` CHECK constraint
- `record_page_view()` function updated to handle 'job' entity type
- `get_entity_visitors()` function updated to support jobs
- RLS policies updated for job owners to view visitors
- Jobs use `entity_id` (UUID) only, no slug support

✅ **Analytics API**
- `/api/analytics/view` route updated to accept 'job' entity type
- Jobs added to tableMap for view_count queries

✅ **View Count Column**
- Jobs table includes `view_count INTEGER NOT NULL DEFAULT 0`
- `record_page_view()` automatically increments jobs.view_count

✅ **RLS Integration**
- Job owners can view visitors (via business ownership check)
- Matches existing pattern for posts/articles

✅ **No Feed Integration**
- Jobs remain separate from posts feed
- Separate `/api/jobs` endpoint and `/jobs` route

## Migration Strategy

1. **Migration 160**: Create jobs table
2. **Migration 161**: Create job_inquiries table
3. **Migration 162**: Add indexes and triggers
4. **Migration 163**: Add RLS policies for jobs and job_inquiries
5. **Migration 164**: Integrate with page_views system
   - Update page_views CHECK constraint
   - Update record_page_view function
   - Update get_entity_visitors function
   - Update page_views RLS policies
6. **Migration 165**: Update analytics API (TypeScript changes, no migration needed)

## Helper Functions

### Check if user owns business

```sql
CREATE OR REPLACE FUNCTION public.user_owns_business(business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_id
    AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = businesses.account_id
      AND accounts.user_id = auth.uid()
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_owns_business(UUID) TO authenticated, anon;
```

**Note**: This function follows the same pattern as `user_owns_account()` used in posts RLS policies. It uses `SECURITY DEFINER` to bypass RLS when checking business ownership.

## Permissions

```sql
-- Grant permissions
GRANT SELECT ON public.jobs TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.job_inquiries TO authenticated;
GRANT INSERT, UPDATE ON public.job_inquiries TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_business(UUID) TO authenticated, anon;
```

## Integration Verification Checklist

### Database Schema ✅
- [x] Jobs table created with all required columns
- [x] Job inquiries table created
- [x] Foreign keys properly set (business_id, account_id)
- [x] Indexes created for performance
- [x] Triggers for auto-updating counts and timestamps
- [x] Constraints for data validation

### RLS Policies ✅
- [x] Jobs: Public can view open/public jobs
- [x] Jobs: Business owners can manage their jobs
- [x] Job Inquiries: Job owners can view inquiries
- [x] Job Inquiries: Account owners can view own inquiries
- [x] Job Inquiries: Users can create inquiries for open jobs
- [x] Job Inquiries: Job owners can update inquiry status

### Page Views Integration ✅
- [x] 'job' added to page_views.entity_type CHECK constraint
- [x] record_page_view() function updated for 'job' entity type
- [x] get_entity_visitors() function updated for jobs
- [x] page_views RLS policies updated for job owners
- [x] Jobs use entity_id (UUID) only, no slug support

### Analytics API Integration ✅
- [x] /api/analytics/view route accepts 'job' entity type
- [x] Jobs added to tableMap for view_count queries
- [x] TypeScript types updated

### Helper Functions ✅
- [x] user_owns_business() function created
- [x] Function uses SECURITY DEFINER pattern (matches user_owns_account)
- [x] Permissions granted

### API Endpoints (To Implement)
- [ ] GET /api/jobs - List jobs with filters
- [ ] GET /api/jobs/[id] - Get single job
- [ ] POST /api/jobs - Create job
- [ ] PUT /api/jobs/[id] - Update job
- [ ] DELETE /api/jobs/[id] - Delete job
- [ ] POST /api/jobs/[id]/inquiries - Create inquiry
- [ ] GET /api/jobs/[id]/inquiries - Get inquiries (job owner only)
- [ ] PUT /api/jobs/inquiries/[id] - Update inquiry status
- [ ] GET /api/jobs/my-inquiries - Get user's inquiries

### UI Components (To Implement)
- [ ] Jobs feed page (/jobs)
- [ ] Job detail page (/jobs/[id])
- [ ] Create job form (business dashboard)
- [ ] Job inquiry modal
- [ ] Business dashboard - jobs section
- [ ] Job card component

## Notes

- Jobs extend from businesses via `business_id` foreign key
- Simple inquiry system (not full application tracking)
- Jobs can be public or draft (similar to posts)
- Inquiries are one-per-account-per-job (prevent spam)
- Business owners manage inquiries through status field
- Jobs can expire (optional `expires_at` field)
- Location support via city_id, county_id, or lat/lng
- View tracking similar to posts/articles
- **Jobs use entity_id (UUID) for page tracking, not slugs** - matches businesses pattern
- **Separate feed from posts** - cleaner separation and easier filtering

