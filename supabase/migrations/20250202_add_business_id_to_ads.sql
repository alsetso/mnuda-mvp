-- Add business_id to ads table
-- Ads are now created by businesses (which are created by members)

-- Add business_id column (nullable for backward compatibility)
ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Add index for business_id
CREATE INDEX IF NOT EXISTS idx_ads_business_id ON public.ads(business_id) WHERE business_id IS NOT NULL;

-- Update RLS policies to allow viewing ads by business ownership
-- Users can view ads for businesses they own
CREATE POLICY "Users can view ads for their businesses"
  ON public.ads
  FOR SELECT
  TO authenticated
  USING (
    business_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = ads.business_id 
      AND businesses.member_id = auth.uid()
    )
  );

-- Users can create ads for their businesses
CREATE POLICY "Users can create ads for their businesses"
  ON public.ads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = ads.business_id 
      AND businesses.member_id = auth.uid()
    )
  );

-- Users can update ads for their businesses
CREATE POLICY "Users can update ads for their businesses"
  ON public.ads
  FOR UPDATE
  TO authenticated
  USING (
    business_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = ads.business_id 
      AND businesses.member_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = ads.business_id 
      AND businesses.member_id = auth.uid()
    )
  );

-- Users can delete ads for their businesses
CREATE POLICY "Users can delete ads for their businesses"
  ON public.ads
  FOR DELETE
  TO authenticated
  USING (
    business_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = ads.business_id 
      AND businesses.member_id = auth.uid()
    )
  );


