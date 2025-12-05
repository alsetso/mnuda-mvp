-- ============================================================================
-- CONSOLIDATED RLS POLICIES
-- This file represents the CURRENT STATE of RLS policies after all migrations
-- Use this as a reference for understanding security policies
-- DO NOT run this on existing databases - migrations handle the history
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ACCOUNTS TABLE POLICIES
-- ============================================================================

-- Users can view their own account
CREATE POLICY "Users can view own account"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own account
CREATE POLICY "Users can update own account"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own account
CREATE POLICY "Users can insert own account"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
  ON public.accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all accounts
CREATE POLICY "Admins can update all accounts"
  ON public.accounts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert accounts
CREATE POLICY "Admins can insert accounts"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profiles (via account ownership)
CREATE POLICY "Users can view own profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can delete their own profiles
CREATE POLICY "Users can delete own profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = profiles.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PINS TABLE POLICIES
-- ============================================================================

-- Everyone can view pins (they're public reference data)
CREATE POLICY "Anyone can view pins"
  ON public.pins
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- AREAS TABLE POLICIES
-- ============================================================================

-- Users can view public areas or their own areas (via profile ownership)
CREATE POLICY "Users can view public areas or own areas"
  ON public.areas
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Anonymous users can view public areas
CREATE POLICY "Anonymous can view public areas"
  ON public.areas
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Users can insert their own areas (via profile ownership)
CREATE POLICY "Users can insert own areas"
  ON public.areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can update their own areas (via profile ownership)
CREATE POLICY "Users can update own areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own areas (via profile ownership)
CREATE POLICY "Users can delete own areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = areas.profile_id
      AND EXISTS (
        SELECT 1 FROM public.accounts
        WHERE accounts.id = profiles.account_id
        AND accounts.user_id = auth.uid()
      )
    )
  );

-- Admins can view all areas
CREATE POLICY "Admins can view all areas"
  ON public.areas
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all areas
CREATE POLICY "Admins can update all areas"
  ON public.areas
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete all areas
CREATE POLICY "Admins can delete all areas"
  ON public.areas
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- MY_HOMES TABLE POLICIES
-- ============================================================================

-- Users can view their own homes (via profile)
CREATE POLICY "Users can view own homes"
  ON public.my_homes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert their own homes
CREATE POLICY "Users can insert own homes"
  ON public.my_homes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own homes
CREATE POLICY "Users can update own homes"
  ON public.my_homes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can delete their own homes
CREATE POLICY "Users can delete own homes"
  ON public.my_homes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = my_homes.profile_id
      AND profiles.account_id IN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all homes
CREATE POLICY "Admins can view all homes"
  ON public.my_homes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.role = 'admin'
    )
  );

-- ============================================================================
-- ONBOARDING_QUESTIONS TABLE POLICIES
-- ============================================================================

-- All authenticated users can view onboarding questions (they're reference data)
CREATE POLICY "Authenticated users can view onboarding questions"
  ON public.onboarding_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert onboarding questions
CREATE POLICY "Admins can insert onboarding questions"
  ON public.onboarding_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update onboarding questions
CREATE POLICY "Admins can update onboarding questions"
  ON public.onboarding_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete onboarding questions
CREATE POLICY "Admins can delete onboarding questions"
  ON public.onboarding_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- PAGES TABLE POLICIES
-- ============================================================================

-- Users can view their own pages (via account ownership)
CREATE POLICY "Users can view own pages"
  ON public.pages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = pages.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can insert their own pages
CREATE POLICY "Users can insert own pages"
  ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = pages.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can update their own pages
CREATE POLICY "Users can update own pages"
  ON public.pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = pages.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = pages.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Users can delete their own pages
CREATE POLICY "Users can delete own pages"
  ON public.pages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = pages.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Public can view all pages (for public directory)
CREATE POLICY "Public can view all pages"
  ON public.pages
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
  ON public.pages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all pages
CREATE POLICY "Admins can update all pages"
  ON public.pages
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert pages
CREATE POLICY "Admins can insert pages"
  ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete all pages
CREATE POLICY "Admins can delete all pages"
  ON public.pages
  FOR DELETE
  TO authenticated
  USING (public.is_admin());



