-- Create counties table for Minnesota counties reference data
-- Standalone table that can be referenced by other tables

-- ============================================================================
-- STEP 1: Create counties table
-- ============================================================================

CREATE TABLE public.counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  population INTEGER NOT NULL,
  area_sq_mi NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX idx_counties_name ON public.counties(name);
CREATE INDEX idx_counties_population ON public.counties(population);

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_counties_updated_at 
  BEFORE UPDATE ON public.counties 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies
-- ============================================================================

-- Everyone can view counties (public reference data)
CREATE POLICY "Anyone can view counties"
  ON public.counties
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can modify counties
CREATE POLICY "Admins can insert counties"
  ON public.counties
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update counties"
  ON public.counties
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete counties"
  ON public.counties
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

GRANT SELECT ON public.counties TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.counties TO authenticated;

-- ============================================================================
-- STEP 7: Insert county data
-- ============================================================================

INSERT INTO public.counties (name, population, area_sq_mi) VALUES
  ('Aitkin County', 16335, 1819.30),
  ('Anoka County', 376840, 423.61),
  ('Becker County', 35444, 1310.42),
  ('Beltrami County', 46762, 2505.27),
  ('Benton County', 41881, 408.28),
  ('Big Stone County', 5067, 496.95),
  ('Blue Earth County', 70700, 752.36),
  ('Brown County', 25710, 610.86),
  ('Carlton County', 36745, 860.33),
  ('Carver County', 112628, 357.04),
  ('Cass County', 31442, 2017.60),
  ('Chippewa County', 12299, 582.80),
  ('Chisago County', 59105, 417.63),
  ('Clay County', 66848, 1045.24),
  ('Clearwater County', 8630, 994.71),
  ('Cook County', 5571, 1450.60),
  ('Cottonwood County', 11338, 639.99),
  ('Crow Wing County', 68642, 996.57),
  ('Dakota County', 453156, 569.58),
  ('Dodge County', 21242, 439.50),
  ('Douglas County', 39933, 634.32),
  ('Faribault County', 13886, 713.63),
  ('Fillmore County', 21502, 861.25),
  ('Freeborn County', 30314, 707.64),
  ('Goodhue County', 47982, 758.27),
  ('Grant County', 6109, 546.41),
  ('Hennepin County', 1273334, 556.62),
  ('Houston County', 18352, 558.41),
  ('Hubbard County', 22050, 922.46),
  ('Isanti County', 43687, 439.07),
  ('Itasca County', 45442, 2665.06),
  ('Jackson County', 9861, 701.69),
  ('Kanabec County', 16608, 524.93),
  ('Kandiyohi County', 44674, 796.06),
  ('Kittson County', 3992, 1097.08),
  ('Koochiching County', 11594, 3102.36),
  ('Lac qui Parle County', 6636, 764.87),
  ('Lake County', 10698, 2099.16),
  ('Lake of the Woods County', 3797, 1296.70),
  ('Le Sueur County', 29458, 448.50),
  ('Lincoln County', 5564, 537.03),
  ('Lyon County', 25577, 714.17),
  ('McLeod County', 36780, 491.91),
  ('Mahnomen County', 5296, 556.14),
  ('Marshall County', 8771, 1772.24),
  ('Martin County', 19561, 709.34),
  ('Meeker County', 23491, 608.54),
  ('Mille Lacs County', 27577, 574.47),
  ('Morrison County', 34520, 1124.50),
  ('Mower County', 40900, 711.50),
  ('Murray County', 8044, 704.43),
  ('Nicollet County', 34493, 452.29),
  ('Nobles County', 21969, 715.39),
  ('Norman County', 6284, 876.27),
  ('Olmsted County', 166424, 653.01),
  ('Otter Tail County', 60884, 1979.71),
  ('Pennington County', 13652, 616.54),
  ('Pine County', 30319, 1411.04),
  ('Pipestone County', 9100, 465.89),
  ('Polk County', 30413, 1970.37),
  ('Pope County', 11495, 670.14),
  ('Ramsey County', 542015, 155.78),
  ('Red Lake County', 3882, 432.43),
  ('Redwood County', 15254, 879.73),
  ('Renville County', 14453, 982.92),
  ('Rice County', 69025, 497.57),
  ('Rock County', 9525, 482.61),
  ('Roseau County', 15265, 1662.51),
  ('Saint Louis County', 200794, 6225.16),
  ('Scott County', 157206, 356.68),
  ('Sherburne County', 103059, 436.30),
  ('Sibley County', 15194, 588.65),
  ('Stearns County', 163997, 1344.52),
  ('Steele County', 37434, 429.55),
  ('Stevens County', 9819, 562.06),
  ('Swift County', 9666, 743.53),
  ('Todd County', 25955, 942.02),
  ('Traverse County', 3134, 574.09),
  ('Wabasha County', 21574, 525.01),
  ('Wadena County', 14437, 535.02),
  ('Waseca County', 18684, 423.25),
  ('Washington County', 283960, 391.70),
  ('Watonwan County', 11204, 434.51),
  ('Wilkin County', 6268, 751.43),
  ('Winona County', 49973, 626.30),
  ('Wright County', 154593, 660.75),
  ('Yellow Medicine County', 9373, 757.96)
ON CONFLICT (name) DO UPDATE SET
  population = EXCLUDED.population,
  area_sq_mi = EXCLUDED.area_sq_mi,
  updated_at = NOW();

-- ============================================================================
-- STEP 8: Add comments
-- ============================================================================

COMMENT ON TABLE public.counties IS 'Standalone reference table for Minnesota counties with population and area data';
COMMENT ON COLUMN public.counties.id IS 'Unique county ID (UUID)';
COMMENT ON COLUMN public.counties.name IS 'County name (e.g., "Hennepin County")';
COMMENT ON COLUMN public.counties.population IS 'County population';
COMMENT ON COLUMN public.counties.area_sq_mi IS 'County area in square miles';
COMMENT ON COLUMN public.counties.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN public.counties.updated_at IS 'Last update timestamp (auto-updated)';







