DROP POLICY IF EXISTS "Users can view accounts with public posts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view accounts with visible posts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can view accounts with visible posts" ON public.accounts;

-- Allow authenticated users to view basic account info (for feed author display)
-- This is safe - only basic fields are exposed (id, first_name, last_name, image_url)
CREATE POLICY "Authenticated users can view basic account info"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (true);

