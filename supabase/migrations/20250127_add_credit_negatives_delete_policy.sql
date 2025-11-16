-- Add DELETE policy and permission for credit_negatives

-- Users can delete negative items from their own profile
CREATE POLICY "Users can delete own credit negatives"
  ON public.credit_negatives
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.credit_profiles cp
      JOIN public.members m ON m.id = cp.member_id
      WHERE cp.id = credit_negatives.credit_profile_id
      AND m.id = auth.uid()
    )
  );

-- Grant DELETE permission
GRANT DELETE ON public.credit_negatives TO authenticated;

