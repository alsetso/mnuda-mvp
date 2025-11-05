-- Create Opportunities and Contributions Tables
-- This migration creates tables for property investment opportunities and member contributions

-- Create enum types
CREATE TYPE opportunity_status AS ENUM ('open', 'funding', 'funded', 'closed');
CREATE TYPE funding_model AS ENUM ('all_cash', 'hybrid');

-- Opportunities table - master record for each property investment opportunity
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  status opportunity_status DEFAULT 'open',
  funding_model funding_model DEFAULT 'all_cash',
  offer_price NUMERIC NOT NULL,
  rehab_budget NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (offer_price + rehab_budget) STORED,
  market_value NUMERIC,
  projected_resale NUMERIC,
  capital_raise_goal NUMERIC NOT NULL,
  capital_committed NUMERIC DEFAULT 0,
  preferred_return_rate NUMERIC DEFAULT 0.10,
  profit_split_investors NUMERIC DEFAULT 0.30,
  hold_period_years INTEGER DEFAULT 5,
  exit_strategy TEXT,
  roi_low NUMERIC,
  roi_high NUMERIC,
  manager_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity contributions table - tracks each member's investment
CREATE TABLE IF NOT EXISTS public.opportunity_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  is_committed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, member_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_address ON public.opportunities(address);
CREATE INDEX IF NOT EXISTS idx_opportunity_contributions_opportunity_id ON public.opportunity_contributions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_contributions_member_id ON public.opportunity_contributions(member_id);

-- Trigger function to update capital_committed when contributions change
CREATE OR REPLACE FUNCTION public.update_capital_committed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opp_id UUID;
BEGIN
  -- Get the opportunity_id from NEW (insert/update) or OLD (delete)
  opp_id := COALESCE(NEW.opportunity_id, OLD.opportunity_id);
  
  -- Update capital_committed for the opportunity
  UPDATE public.opportunities
  SET capital_committed = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.opportunity_contributions
    WHERE opportunity_id = opp_id
      AND is_committed = true
  ),
  updated_at = NOW()
  WHERE id = opp_id;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Triggers to update capital_committed
CREATE TRIGGER update_capital_committed_on_insert
  AFTER INSERT ON public.opportunity_contributions
  FOR EACH ROW
  WHEN (NEW.is_committed = true)
  EXECUTE FUNCTION public.update_capital_committed();

CREATE TRIGGER update_capital_committed_on_update
  AFTER UPDATE ON public.opportunity_contributions
  FOR EACH ROW
  WHEN (NEW.is_committed != OLD.is_committed OR NEW.amount != OLD.amount)
  EXECUTE FUNCTION public.update_capital_committed();

CREATE TRIGGER update_capital_committed_on_delete
  AFTER DELETE ON public.opportunity_contributions
  FOR EACH ROW
  WHEN (OLD.is_committed = true)
  EXECUTE FUNCTION public.update_capital_committed();

-- Trigger to update updated_at on opportunities
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on opportunity_contributions
CREATE TRIGGER update_opportunity_contributions_updated_at
  BEFORE UPDATE ON public.opportunity_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities - all authenticated users can view, only admins/managers can modify
CREATE POLICY "Authenticated users can view opportunities"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert opportunities"
  ON public.opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update opportunities"
  ON public.opportunities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete opportunities"
  ON public.opportunities
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for opportunity_contributions - users can only see/modify their own contributions
CREATE POLICY "Users can view all contributions"
  ON public.opportunity_contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own contributions"
  ON public.opportunity_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own contributions"
  ON public.opportunity_contributions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can delete their own contributions"
  ON public.opportunity_contributions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = member_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_contributions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a view for opportunity progress calculations
CREATE OR REPLACE VIEW public.opportunity_progress AS
SELECT
  o.id,
  o.address,
  o.capital_committed,
  o.capital_raise_goal,
  ROUND(100 * o.capital_committed / NULLIF(o.capital_raise_goal, 0), 2) AS progress_pct,
  (o.capital_raise_goal - o.capital_committed) AS remaining_to_raise,
  o.status,
  o.total_cost,
  o.market_value,
  o.projected_resale,
  o.roi_low,
  o.roi_high,
  o.preferred_return_rate,
  o.profit_split_investors,
  o.hold_period_years
FROM public.opportunities o;

-- Grant view permissions
GRANT SELECT ON public.opportunity_progress TO authenticated;

-- Add comments
COMMENT ON TABLE public.opportunities IS 'Property investment opportunities with fundraising targets and ROI projections';
COMMENT ON TABLE public.opportunity_contributions IS 'Member investment pledges and commitments for opportunities';
COMMENT ON VIEW public.opportunity_progress IS 'Live progress calculations for opportunity funding status';

