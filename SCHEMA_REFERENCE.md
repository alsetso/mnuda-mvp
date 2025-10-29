# Database Schema Reference
Complete schema documentation for all tables, RLS policies, functions, and triggers.

## Tables

### 1. `profiles`
User profiles tied to Supabase auth.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  active_subscription_id TEXT
);
```

**Indexes:**
- `idx_profiles_email` ON profiles(email)
- `idx_profiles_stripe_customer_id` ON profiles(stripe_customer_id)
- `idx_profiles_active_subscription_id` ON profiles(active_subscription_id)

**RLS Policies:**
- `profiles_select_own`: SELECT - Users can view their own profile
  ```sql
  USING (auth.uid() = id)
  ```
- `members_can_view_workspace_member_profiles`: SELECT - Users can view profiles of other workspace members
  ```sql
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      WHERE wm1.profile_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = wm1.workspace_id
        AND wm2.profile_id = profiles.id
      )
    )
  )
  ```
- `profiles_update_own`: UPDATE - Users can only update their own profile
  ```sql
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
  ```
- `profiles_insert_own`: INSERT - Users can only create their own profile
  ```sql
  WITH CHECK (auth.uid() = id)
  ```
- `profiles_delete_own`: DELETE - Users can only delete their own profile
  ```sql
  USING (auth.uid() = id)
  ```

**Triggers:**
- `update_profiles_updated_at`: Updates `updated_at` on UPDATE
- `on_auth_user_created`: Automatically creates profile when user signs up

---

### 2. `workspaces`
Workspace containers for collaborative work.

```sql
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_workspaces_created_by` ON workspaces(created_by)

**RLS Policies:**
- `members_can_view_workspaces`: SELECT - Members and creator can view
  ```sql
  USING (
    public.is_member(id) OR
    created_by = auth.uid()
  )
  ```
- `authenticated_can_create_workspaces`: INSERT - Authenticated users can create workspaces
  ```sql
  WITH CHECK (auth.uid() = created_by)
  ```
- `owners_can_manage_workspaces`: UPDATE/DELETE - Only owners can modify
  ```sql
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = id AND profile_id = auth.uid() AND role = 'owner'
    )
  )
  ```

---

### 3. `workspace_members`
Membership relationships between users and workspaces.

```sql
CREATE TABLE public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT CHECK (role IN ('owner','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraints:**
- Either `profile_id` OR `email` must be provided (not both, not neither)
- Unique index: `workspace_members_unique_profile` ON (workspace_id, profile_id) WHERE profile_id IS NOT NULL
- Unique index: `workspace_members_unique_email` ON (workspace_id, email) WHERE email IS NOT NULL

**Indexes:**
- `idx_workspace_members_workspace_id` ON workspace_members(workspace_id)
- `idx_workspace_members_profile_id` ON workspace_members(profile_id)

**RLS Policies:**
- `members_can_view_their_memberships`: SELECT - Users can see their own memberships
  ```sql
  USING (
    profile_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  ```
- `workspace_owners_can_add_members`: INSERT - Owners can add members, users can add themselves
  ```sql
  WITH CHECK (
    (profile_id IS NOT NULL AND auth.uid() = profile_id) OR
    (email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id 
      AND wm.profile_id = auth.uid() 
      AND wm.role = 'owner'
    ))
  )
  ```
- `members_can_manage_memberships`: UPDATE/DELETE - Members can manage memberships in their workspaces
  ```sql
  USING (public.is_member(workspace_id))
  WITH CHECK (public.is_member(workspace_id))
  ```

---

### 4. `properties`
Real estate properties linked to workspaces.

```sql
CREATE TABLE public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_address TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'Off Market' CHECK (status IN (
    'Preforeclosure', 'Foreclosure', 'Foreclosed', 'Auction', 'Redemption',
    'Bank Owned', 'Short Sale', 'Subject To', 'Deed In Lieu', 'Leaseback',
    'For Sale By Owner', 'Listed On MLS', 'Under Contract', 'Sold', 'Off Market'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_properties_workspace_id` ON properties(workspace_id)
- `idx_properties_full_address` ON properties(full_address)
- `idx_properties_workspace_address` UNIQUE ON (workspace_id, full_address)

**RLS Policies:**
- `Users can view properties from their workspaces`: SELECT
  ```sql
  USING (public.is_member(workspace_id))
  ```
- `Users can insert properties in their workspaces`: INSERT
  ```sql
  WITH CHECK (public.is_member(workspace_id))
  ```
- `Users can update properties in their workspaces`: UPDATE
  ```sql
  USING (public.is_member(workspace_id))
  ```
- `Users can delete properties in their workspaces`: DELETE
  ```sql
  USING (public.is_member(workspace_id))
  ```

**Triggers:**
- `update_properties_updated_at`: Updates `updated_at` on UPDATE

---

### 5. `people_records`
People/contacts associated with properties.

```sql
CREATE TABLE public.people_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  relationship_to_property TEXT CHECK (relationship_to_property IN (
    'owner', 'resident', 'tenant', 'relative', 'contact', 'other'
  )),
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_people_records_property_id` ON people_records(property_id)
- `idx_people_records_workspace_id` ON people_records(workspace_id)

**RLS Policies:**
- `Users can view people records from their workspaces`: SELECT
  ```sql
  USING (public.is_member(workspace_id))
  ```
- `Users can insert people records in their workspaces`: INSERT
  ```sql
  WITH CHECK (public.is_member(workspace_id))
  ```
- `Users can update people records in their workspaces`: UPDATE
  ```sql
  USING (public.is_member(workspace_id))
  ```
- `Users can delete people records in their workspaces`: DELETE
  ```sql
  USING (public.is_member(workspace_id))
  ```

**Triggers:**
- `update_people_records_updated_at`: Updates `updated_at` on UPDATE

---

### 6. `property_notes`
Notes/comments added by profiles to properties.

```sql
CREATE TABLE public.property_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_property_notes_property_id` ON property_notes(property_id)
- `idx_property_notes_profile_id` ON property_notes(profile_id)
- `idx_property_notes_workspace_id` ON property_notes(workspace_id)
- `idx_property_notes_created_at` ON property_notes(created_at DESC)

**RLS Policies:**
- `Members can view property notes from their workspaces`: SELECT
  ```sql
  USING (public.is_member(workspace_id))
  ```
- `Members can insert property notes in their workspaces`: INSERT
  ```sql
  WITH CHECK (
    public.is_member(workspace_id) AND 
    profile_id = auth.uid()
  )
  ```
- `Members can update property notes in their workspaces`: UPDATE
  ```sql
  USING (public.is_member(workspace_id))
  WITH CHECK (public.is_member(workspace_id))
  ```
- `Members can delete property notes in their workspaces`: DELETE
  ```sql
  USING (public.is_member(workspace_id))
  ```

**Triggers:**
- `update_property_notes_updated_at`: Updates `updated_at` on UPDATE

---

## Functions

### `public.is_member(_workspace UUID)`
Checks if the authenticated user is a member of the given workspace.
**CRITICAL**: This function uses `SECURITY DEFINER` to bypass RLS when checking membership.

```sql
CREATE OR REPLACE FUNCTION public.is_member(_workspace UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace 
    AND (
      profile_id = auth.uid() OR
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
$$;
```

**Note**: This function must be `SECURITY DEFINER` to work correctly in RLS policies. Without it, there would be a circular dependency where:
1. RLS policy calls `is_member()`
2. `is_member()` queries `workspace_members`
3. `workspace_members` RLS also calls `is_member()` → infinite loop

---

### `public.update_updated_at_column()`
Generic function to update the `updated_at` timestamp on any table.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

**Used by triggers on:**
- `profiles`
- `properties`
- `people_records`
- `property_notes`

---

### `public.handle_new_user()`
Automatically creates a profile when a new user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;
```

**Trigger:** `on_auth_user_created` on `auth.users` table

---

### `public.send_email(user_data JSONB, email_data JSONB)`
Custom email sending function that calls an edge function for branded OTP emails.

```sql
CREATE OR REPLACE FUNCTION public.send_email(
  user_data JSONB,
  email_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  http_response JSONB;
BEGIN
  -- Validates required fields and makes HTTP request to edge function
  -- Returns JSONB with success/error status
  ...
END;
$$;
```

**Grants:**
- `GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;`

**Note:** Used by Supabase auth hooks for custom email handling. Requires edge function endpoint.

---

## Important Notes

### RLS Policy Dependencies
- All workspace-scoped tables (`properties`, `people_records`, `property_notes`) use `is_member(workspace_id)` in their RLS policies
- The `is_member()` function MUST be `SECURITY DEFINER` to avoid circular dependencies
- The `workspace_members` table has a direct SELECT policy that doesn't use `is_member()` to break the circular dependency

### Email-Based Invitations
- `workspace_members.profile_id` is nullable to support inviting users who don't have accounts yet
- The `is_member()` function checks both `profile_id = auth.uid()` and `email = auth.user.email`
- This allows pending invitations to work once the user creates an account

### Data Integrity
- All workspace-scoped tables cascade delete when workspace is deleted
- Property-scoped tables (`people_records`, `property_notes`) cascade delete when property is deleted
- Unique constraints prevent duplicate properties per workspace and duplicate memberships

---

## Grants

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_notes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

**Important**: GRANT permissions are required even when RLS is enabled. RLS controls which rows users can access, but GRANTs control whether users can access the table at all.

---

Last Updated: 2025-01-03

