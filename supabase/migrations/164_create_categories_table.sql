-- Create categories table - standalone table for user-created categories
-- Any authenticated user can add new categories

-- ============================================================================
-- STEP 1: Create categories table
-- ============================================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  
  -- Ensure unique category names
  CONSTRAINT categories_name_unique UNIQUE (name)
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_created_by ON public.categories(created_by);
CREATE INDEX idx_categories_created_at ON public.categories(created_at DESC);

-- ============================================================================
-- STEP 3: Create trigger function to set created_by
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_category_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by to the current user's account_id if not already set
  IF NEW.created_by IS NULL THEN
    SELECT id INTO NEW.created_by
    FROM public.accounts
    WHERE accounts.user_id = auth.uid()
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set created_by on insert
CREATE TRIGGER set_category_created_by_trigger
  BEFORE INSERT ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_category_created_by();

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS Policies
-- ============================================================================

-- Policy: Anyone can read categories (public reference data)
CREATE POLICY "Anyone can read categories"
  ON public.categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Any authenticated user can insert categories
CREATE POLICY "Authenticated users can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
    )
  );

-- Policy: Users can update categories they created
CREATE POLICY "Users can update own categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.id = categories.created_by
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.id = categories.created_by
    )
  );

-- Policy: Users can delete categories they created
CREATE POLICY "Users can delete own categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.user_id = auth.uid()
      AND accounts.id = categories.created_by
    )
  );

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- ============================================================================
-- STEP 7: Seed initial categories
-- ============================================================================

-- Insert seed categories (created_by will be NULL for seed data)
INSERT INTO public.categories (name) VALUES
('Acquisitions'),
('Agent'),
('Appraiser'),
('Architect'),
('Assessor'),
('Attorney'),
('Broker'),
('Builder'),
('Buyer'),
('Contractor'),
('Consultant'),
('Developer'),
('Dispositions'),
('Electrician'),
('Evaluator'),
('Designer'),
('Dispatcher'),
('Drafter'),
('Driver'),
('Engineer'),
('Estimator'),
('Examiner'),
('Facilitator'),
('Flipper'),
('Foreman'),
('Framer'),
('Fund'),
('Generalist'),
('Groundskeeper'),
('Handyman'),
('Homebuilder'),
('Host'),
('Inspector'),
('Installer'),
('Investor'),
('Janitor'),
('Landscaper'),
('Lender'),
('Loader'),
('Locksmith'),
('Manager'),
('Marketer'),
('Mentor'),
('Merchant'),
('Mover'),
('Negotiator'),
('Notary'),
('Operator'),
('Organizer'),
('Owner'),
('Painter'),
('Planner'),
('Plumber'),
('Producer'),
('Promoter'),
('Provider'),
('Qualifier'),
('Realtor'),
('Remodeler'),
('Renovator'),
('Researcher'),
('Restorer'),
('Roofer'),
('Seller'),
('Servicer'),
('Stager'),
('Surveyor'),
('Technician'),
('Titleholder'),
('Tradesman'),
('Trainer'),
('Underwriter'),
('Valuator'),
('Vendor'),
('Videographer'),
('Wholesaler'),
('Welder'),
('Worker'),
('Writer'),
('Yielder')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON TABLE public.categories IS 'Standalone table for user-created categories. Any authenticated user can add new categories.';
COMMENT ON COLUMN public.categories.id IS 'Unique category ID (UUID)';
COMMENT ON COLUMN public.categories.name IS 'Category name (unique)';
COMMENT ON COLUMN public.categories.created_at IS 'Timestamp when category was created';
COMMENT ON COLUMN public.categories.created_by IS 'Account ID of user who created the category (NULL for seed data)';

