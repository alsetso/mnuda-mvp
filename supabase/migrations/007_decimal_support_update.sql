-- Decimal Support Update - Convert existing integer fields to decimal
-- This migration safely updates your existing database to support decimal pricing

-- ============================================================================
-- ALTER EXISTING TABLES TO SUPPORT DECIMALS
-- ============================================================================

-- Update credit_balance table to support decimals
ALTER TABLE billing.credit_balance 
ALTER COLUMN remaining_credits TYPE NUMERIC(10,2) USING remaining_credits::NUMERIC(10,2),
ALTER COLUMN total_credits_allocated TYPE NUMERIC(10,2) USING total_credits_allocated::NUMERIC(10,2);

-- Update credit_transactions table to support decimals
ALTER TABLE billing.credit_transactions 
ALTER COLUMN amount TYPE NUMERIC(10,2) USING amount::NUMERIC(10,2),
ALTER COLUMN balance_before TYPE NUMERIC(10,2) USING balance_before::NUMERIC(10,2),
ALTER COLUMN balance_after TYPE NUMERIC(10,2) USING balance_after::NUMERIC(10,2);

-- ============================================================================
-- UPDATE EXISTING FUNCTIONS TO SUPPORT DECIMALS
-- ============================================================================

-- Update get_user_credits function
CREATE OR REPLACE FUNCTION public.get_user_credits(user_uuid UUID)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  credit_balance NUMERIC(10,2);
BEGIN
  SELECT remaining_credits INTO credit_balance
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(credit_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update deduct_user_credits function
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  user_uuid UUID,
  credits_to_deduct NUMERIC(10,2),
  description TEXT DEFAULT 'API usage'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  credit_balance_id UUID;
BEGIN
  -- Get current balance and the ID of the most recent credit balance record
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if user has enough credits
  IF current_balance < credits_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - credits_to_deduct;
  
  -- Update credit balance using the specific ID
  UPDATE billing.credit_balance
  SET 
    remaining_credits = new_balance,
    updated_at = NOW()
  WHERE id = credit_balance_id;
  
  -- Record transaction
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    user_uuid,
    -credits_to_deduct,
    'usage',
    description,
    current_balance,
    new_balance
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update add_user_credits function
CREATE OR REPLACE FUNCTION public.add_user_credits(
  user_uuid UUID,
  credits_to_add NUMERIC(10,2),
  description TEXT DEFAULT 'Credits added'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  credit_balance_id UUID;
BEGIN
  -- Get current balance and the ID of the most recent credit balance record
  SELECT remaining_credits, id INTO current_balance, credit_balance_id
  FROM billing.credit_balance
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new balance
  new_balance := current_balance + credits_to_add;
  
  -- Update credit balance using the specific ID
  UPDATE billing.credit_balance
  SET 
    remaining_credits = new_balance,
    updated_at = NOW()
  WHERE id = credit_balance_id;
  
  -- Record transaction
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    user_uuid,
    credits_to_add,
    'credit',
    description,
    current_balance,
    new_balance
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE GRANTS FOR NEW FUNCTION SIGNATURES
-- ============================================================================

-- Update grants to reflect new function signatures
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(UUID, NUMERIC(10,2), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(UUID, NUMERIC(10,2), TEXT) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that decimal functions work
-- SELECT public.get_user_credits('your-user-id-here');
-- SELECT public.deduct_user_credits('your-user-id-here', 0.75, 'Test decimal deduction');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- ✅ Decimal support has been added to your existing database!
-- ✅ All existing data has been preserved
-- ✅ Functions now support decimal pricing
-- ✅ Ready to run the API management migration next
