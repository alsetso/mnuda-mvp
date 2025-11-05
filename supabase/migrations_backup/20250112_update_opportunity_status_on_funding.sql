-- Update Opportunity Status Based on Funding
-- This migration adds a trigger to automatically update opportunity status when funding changes

-- Function to check and update opportunity status based on funding progress
CREATE OR REPLACE FUNCTION public.update_opportunity_status_on_funding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opp_id UUID;
  opp_record RECORD;
  new_status opportunity_status;
  should_process BOOLEAN := false;
BEGIN
  -- Determine opportunity_id and whether we should process based on operation type
  IF TG_OP = 'DELETE' THEN
    opp_id := OLD.opportunity_id;
    -- Only process if the deleted contribution was committed
    should_process := OLD.is_committed = true;
  ELSIF TG_OP = 'INSERT' THEN
    opp_id := NEW.opportunity_id;
    -- Only process if the new contribution is committed
    should_process := NEW.is_committed = true;
  ELSIF TG_OP = 'UPDATE' THEN
    opp_id := NEW.opportunity_id;
    -- Process if committed status changed or amount changed
    should_process := (
      NEW.is_committed = true AND 
      (NEW.is_committed != OLD.is_committed OR NEW.amount != OLD.amount)
    );
  ELSE
    -- For UPDATE on opportunities table (capital_committed changed)
    opp_id := NEW.id;
    should_process := true;
  END IF;
  
  -- Skip processing if conditions aren't met
  IF NOT should_process THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get the opportunity record
  SELECT * INTO opp_record
  FROM public.opportunities
  WHERE id = opp_id;
  
  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate current capital_committed (will be updated by the capital_committed trigger)
  -- We need to wait for that trigger to complete, so we'll recalculate here
  SELECT COALESCE(SUM(amount), 0) INTO opp_record.capital_committed
  FROM public.opportunity_contributions
  WHERE opportunity_id = opp_id
    AND is_committed = true;
  
  -- Determine new status based on funding progress
  new_status := opp_record.status;
  
  IF opp_record.capital_committed >= opp_record.capital_raise_goal THEN
    -- Fully funded
    IF opp_record.status = 'open' OR opp_record.status = 'funding' THEN
      new_status := 'funded';
    END IF;
  ELSIF opp_record.capital_committed > 0 THEN
    -- Partially funded but not complete
    IF opp_record.status = 'open' THEN
      new_status := 'funding';
    END IF;
  ELSE
    -- No commitments yet
    IF opp_record.status = 'funding' THEN
      new_status := 'open';
    END IF;
  END IF;
  
  -- Update status if it changed
  IF new_status != opp_record.status THEN
    UPDATE public.opportunities
    SET status = new_status,
        updated_at = NOW()
    WHERE id = opp_id;
  END IF;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger to update status after capital_committed is updated
-- This runs AFTER the capital_committed trigger updates the amount
CREATE TRIGGER update_opportunity_status_after_funding
  AFTER UPDATE OF capital_committed ON public.opportunities
  FOR EACH ROW
  WHEN (OLD.capital_committed IS DISTINCT FROM NEW.capital_committed)
  EXECUTE FUNCTION public.update_opportunity_status_on_funding();

-- Also create a trigger that runs after contributions change
-- This provides a backup in case the capital_committed trigger hasn't run yet
-- The function handles filtering internally, so we don't need a WHEN clause
CREATE TRIGGER update_opportunity_status_on_contribution_change
  AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_opportunity_status_on_funding();

-- Add comment
COMMENT ON FUNCTION public.update_opportunity_status_on_funding() IS 'Automatically updates opportunity status based on funding progress: open -> funding (when contributions start) -> funded (when goal reached)';

