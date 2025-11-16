-- Rename negative_items to credit_negatives
-- Update foreign key from credit_restoration_request_id to credit_profile_id

-- First, drop existing foreign key constraint
ALTER TABLE public.negative_items
DROP CONSTRAINT IF EXISTS negative_items_credit_restoration_request_id_fkey;

-- Drop existing indexes that reference the old column name
DROP INDEX IF EXISTS idx_negative_items_request_id;

-- Rename the table
ALTER TABLE public.negative_items RENAME TO credit_negatives;

-- Rename the foreign key column
ALTER TABLE public.credit_negatives
RENAME COLUMN credit_restoration_request_id TO credit_profile_id;

-- Add new foreign key constraint to credit_profiles
ALTER TABLE public.credit_negatives
ADD CONSTRAINT credit_negatives_credit_profile_id_fkey
FOREIGN KEY (credit_profile_id) REFERENCES public.credit_profiles(id) ON DELETE CASCADE;

-- Recreate index with new column name
CREATE INDEX IF NOT EXISTS idx_credit_negatives_profile_id ON public.credit_negatives(credit_profile_id);

-- Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own negative items" ON public.credit_negatives;
DROP POLICY IF EXISTS "Service can insert negative items" ON public.credit_negatives;
DROP POLICY IF EXISTS "Users can update own negative items" ON public.credit_negatives;

-- Create new policies for credit_negatives
-- Users can view negative items from their own profile
CREATE POLICY "Users can view own credit negatives"
  ON public.credit_negatives
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_negatives.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can insert negative items for their own profile
CREATE POLICY "Users can insert own credit negatives"
  ON public.credit_negatives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_negatives.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Users can update negative items for their own profile
CREATE POLICY "Users can update own credit negatives"
  ON public.credit_negatives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_negatives.credit_profile_id
      AND m.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_negatives.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Update grant permissions (table name changed)
GRANT SELECT, INSERT, UPDATE ON public.credit_negatives TO authenticated;

