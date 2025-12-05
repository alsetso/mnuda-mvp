-- Fix articles RLS update policy to ensure proper ownership checks
-- The policy should allow updates when account_id OR business_id matches user's ownership

-- ============================================================================
-- STEP 1: Drop existing update policy
-- ============================================================================

DROP POLICY IF EXISTS "articles_update" ON public.articles;

-- ============================================================================
-- STEP 2: Create improved update policy
-- ============================================================================

-- Authenticated: Can update own articles (account_id OR business_id)
CREATE POLICY "articles_update"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    -- User owns the account_id
    (
      account_id IS NOT NULL AND
      account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
      )
    )
    OR
    -- User owns the business (via account_id)
    (
      business_id IS NOT NULL AND
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    -- Ensure the updated values still maintain ownership
    (
      account_id IS NOT NULL AND
      account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
      )
    )
    OR
    (
      business_id IS NOT NULL AND
      business_id IN (
        SELECT id FROM public.businesses 
        WHERE account_id IN (
          SELECT id FROM public.accounts WHERE user_id = auth.uid()
        )
      )
    )
  );

COMMENT ON POLICY "articles_update" ON public.articles IS 
  'Allows authenticated users to update articles they own (via account_id or business_id)';



