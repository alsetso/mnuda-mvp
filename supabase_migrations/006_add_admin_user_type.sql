-- Add 'admin' as a valid user_type option
-- This migration updates the profiles table to include admin as a valid user type

-- Update the check constraint to include 'admin'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('realtor', 'investor', 'wholesaler', 'buyer', 'owner', 'lender', 'appraiser', 'contractor', 'other', 'admin'));

-- Update the resources table RLS policies to allow admin users to manage resources
-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can manage resources" ON public.resources;

-- Create new policy that allows admin users to manage resources
CREATE POLICY "Admin users can manage resources" ON public.resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Allow admin users to view unpublished resources
CREATE POLICY "Admin users can view unpublished resources" ON public.resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Add comment for clarity
COMMENT ON CONSTRAINT profiles_user_type_check ON public.profiles IS 'Validates user_type includes admin for help center management';
