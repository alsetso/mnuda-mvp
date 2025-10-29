-- Fix RLS policies for properties and people_records tables
-- This migration updates the existing RLS policies to use the is_member function

-- Drop existing policies on properties table
DROP POLICY IF EXISTS "Users can view properties from their workspaces" ON properties;
DROP POLICY IF EXISTS "Users can insert properties in their workspaces" ON properties;
DROP POLICY IF EXISTS "Users can update properties in their workspaces" ON properties;
DROP POLICY IF EXISTS "Users can delete properties in their workspaces" ON properties;

-- Create new RLS policies using the is_member function for properties
CREATE POLICY "Users can view properties from their workspaces" ON properties
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert properties in their workspaces" ON properties
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update properties in their workspaces" ON properties
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete properties in their workspaces" ON properties
    FOR DELETE USING (public.is_member(workspace_id));

-- Drop existing policies on people_records table
DROP POLICY IF EXISTS "Users can view people records from their workspaces" ON people_records;
DROP POLICY IF EXISTS "Users can insert people records in their workspaces" ON people_records;
DROP POLICY IF EXISTS "Users can update people records in their workspaces" ON people_records;
DROP POLICY IF EXISTS "Users can delete people records in their workspaces" ON people_records;

-- Create new RLS policies using the is_member function for people_records
CREATE POLICY "Users can view people records from their workspaces" ON people_records
    FOR SELECT USING (public.is_member(workspace_id));

CREATE POLICY "Users can insert people records in their workspaces" ON people_records
    FOR INSERT WITH CHECK (public.is_member(workspace_id));

CREATE POLICY "Users can update people records in their workspaces" ON people_records
    FOR UPDATE USING (public.is_member(workspace_id));

CREATE POLICY "Users can delete people records in their workspaces" ON people_records
    FOR DELETE USING (public.is_member(workspace_id));

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICIES UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Properties table policies updated to use is_member()';
  RAISE NOTICE 'People records table policies updated to use is_member()';
  RAISE NOTICE 'This should fix the 403 Forbidden errors';
  RAISE NOTICE '========================================';
END $$;
