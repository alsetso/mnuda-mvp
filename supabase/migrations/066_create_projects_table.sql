-- Create projects table for storing projects linked to homes
-- Projects represent work, renovations, or activities related to a specific home

-- ============================================================================
-- STEP 1: Create project_status enum
-- ============================================================================

CREATE TYPE public.project_status AS ENUM (
  'planning',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold'
);

-- ============================================================================
-- STEP 2: Create projects table
-- ============================================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  my_home_id UUID NOT NULL
    REFERENCES public.my_homes(id) ON DELETE CASCADE,
  
  -- Project details
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'planning'::public.project_status,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Financials
  budget NUMERIC(12, 2),
  actual_cost NUMERIC(12, 2),
  
  -- Additional metadata
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo objects: [{url, filename, uploaded_at, ...}]
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT projects_end_date_after_start_date CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT projects_budget_positive CHECK (
    budget IS NULL OR budget >= 0
  ),
  CONSTRAINT projects_actual_cost_positive CHECK (
    actual_cost IS NULL OR actual_cost >= 0
  )
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX projects_my_home_id_idx
  ON public.projects (my_home_id);

CREATE INDEX projects_status_idx
  ON public.projects (status);

CREATE INDEX projects_start_date_idx
  ON public.projects (start_date) WHERE start_date IS NOT NULL;

CREATE INDEX projects_created_at_idx
  ON public.projects (created_at);

-- ============================================================================
-- STEP 4: Create trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies
-- ============================================================================

-- Users can view projects for their own homes (via profile)
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.my_homes
      WHERE my_homes.id = projects.my_home_id
      AND my_homes.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert projects for their own homes
CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.my_homes
      WHERE my_homes.id = projects.my_home_id
      AND my_homes.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can update projects for their own homes
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.my_homes
      WHERE my_homes.id = projects.my_home_id
      AND my_homes.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can delete projects for their own homes
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.my_homes
      WHERE my_homes.id = projects.my_home_id
      AND my_homes.profile_id IN (
        SELECT profiles.id FROM public.profiles
        WHERE profiles.account_id IN (
          SELECT id FROM public.accounts
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON public.projects
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
-- STEP 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON TABLE public.projects IS 'Projects linked to user homes - renovations, repairs, improvements, etc.';
COMMENT ON COLUMN public.projects.my_home_id IS 'References my_homes.id - the home this project is associated with';
COMMENT ON COLUMN public.projects.name IS 'Project name/title';
COMMENT ON COLUMN public.projects.description IS 'Detailed description of the project';
COMMENT ON COLUMN public.projects.status IS 'Current status of the project';
COMMENT ON COLUMN public.projects.start_date IS 'Project start date';
COMMENT ON COLUMN public.projects.end_date IS 'Project completion date (nullable)';
COMMENT ON COLUMN public.projects.budget IS 'Planned budget for the project';
COMMENT ON COLUMN public.projects.actual_cost IS 'Actual cost of the project';
COMMENT ON COLUMN public.projects.notes IS 'Additional notes about the project';
COMMENT ON COLUMN public.projects.photos IS 'Array of photo objects stored in project-photos bucket';

