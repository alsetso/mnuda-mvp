-- Allow anonymous users to view public pins
-- This enables non-authenticated users to see public pins on the community map

-- Grant SELECT permission to anonymous role
GRANT SELECT ON public.pins TO anon;

-- Create RLS policy for anonymous users to view public pins only
CREATE POLICY "Anonymous users can view public pins"
  ON public.pins
  FOR SELECT
  TO anon
  USING (visibility = 'public'::public.pin_visibility);

