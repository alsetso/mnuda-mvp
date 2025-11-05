-- Add created_by field to opportunities table
-- This tracks which user created each opportunity

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON public.opportunities(created_by);

-- Update RLS policy to allow users to update their own opportunities
DROP POLICY IF EXISTS "Authenticated users can update opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can update their own opportunities"
  ON public.opportunities
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own opportunities
DROP POLICY IF EXISTS "Authenticated users can delete opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can delete their own opportunities"
  ON public.opportunities
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Add comment
COMMENT ON COLUMN public.opportunities.created_by IS 'User ID of the member who created this opportunity';

