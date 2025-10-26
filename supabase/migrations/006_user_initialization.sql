-- User Initialization and Data Setup
-- This migration ensures users get proper initial data when they sign up

-- ============================================================================
-- CREATE USER INITIALIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_user_data()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
  free_plan_credits NUMERIC(10,2);
  new_subscription_id UUID;
  user_full_name TEXT;
BEGIN
  -- Extract full name from user metadata
  user_full_name := COALESCE(
    TRIM(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ),
    'User'
  );

  -- Get the free plan
  SELECT id, credits_per_period INTO free_plan_id, free_plan_credits 
  FROM billing.plans 
  WHERE name = 'Free' AND is_active = true
  LIMIT 1;

  -- If no free plan exists, create one
  IF free_plan_id IS NULL THEN
    INSERT INTO billing.plans (name, description, price_cents, billing_interval, credits_per_period, is_active)
    VALUES ('Free', 'Free tier with limited daily credits', 0, 'daily', 5, true)
    RETURNING id, credits_per_period INTO free_plan_id, free_plan_credits;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, subscription_status, user_type)
  VALUES (NEW.id, NEW.email, user_full_name, 'free', 'buyer');

  -- Create free subscription
  INSERT INTO billing.subscriptions (
    user_id, 
    plan_id, 
    status, 
    current_period_start, 
    current_period_end
  )
  VALUES (
    NEW.id,
    free_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 day'
  )
  RETURNING id INTO new_subscription_id;

  -- Initialize credit balance
  INSERT INTO billing.credit_balance (
    user_id,
    plan_id,
    remaining_credits,
    total_credits_allocated,
    period_start,
    period_end,
    last_reset_at
  )
  VALUES (
    NEW.id,
    free_plan_id,
    free_plan_credits,
    free_plan_credits,
    NOW(),
    NOW() + INTERVAL '1 day',
    NOW()
  );

  -- Create initial credit transaction record
  INSERT INTO billing.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_before,
    balance_after
  )
  VALUES (
    NEW.id,
    free_plan_credits,
    'credit',
    'Initial free tier credits',
    0,
    free_plan_credits
  );

  -- Link subscription to profile
  UPDATE public.profiles
  SET active_subscription_id = new_subscription_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGER FOR USER INITIALIZATION
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user initialization
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_data();

-- ============================================================================
-- CREATE FUNCTION TO ENSURE USER HAS DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_has_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
  credit_balance_exists BOOLEAN;
  subscription_exists BOOLEAN;
  free_plan_id UUID;
  free_plan_credits NUMERIC(10,2);
  new_subscription_id UUID;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_uuid) INTO profile_exists;
  
  -- Check if credit balance exists
  SELECT EXISTS(SELECT 1 FROM billing.credit_balance WHERE user_id = user_uuid) INTO credit_balance_exists;
  
  -- Check if subscription exists
  SELECT EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id = user_uuid) INTO subscription_exists;
  
  -- If any are missing, initialize them
  IF NOT profile_exists OR NOT credit_balance_exists OR NOT subscription_exists THEN
    -- Get the free plan
    SELECT id, credits_per_period INTO free_plan_id, free_plan_credits 
    FROM billing.plans 
    WHERE name = 'Free' AND is_active = true
    LIMIT 1;

    -- If no free plan exists, create one
    IF free_plan_id IS NULL THEN
      INSERT INTO billing.plans (name, description, price_cents, billing_interval, credits_per_period, is_active)
      VALUES ('Free', 'Free tier with limited daily credits', 0, 'daily', 5, true)
      RETURNING id, credits_per_period INTO free_plan_id, free_plan_credits;
    END IF;

    -- Create profile if missing
    IF NOT profile_exists THEN
      INSERT INTO public.profiles (id, email, full_name, subscription_status, user_type)
      VALUES (user_uuid, (SELECT email FROM auth.users WHERE id = user_uuid), 'User', 'free', 'buyer');
    END IF;

    -- Create subscription if missing
    IF NOT subscription_exists THEN
      INSERT INTO billing.subscriptions (
        user_id, 
        plan_id, 
        status, 
        current_period_start, 
        current_period_end
      )
      VALUES (
        user_uuid,
        free_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '1 day'
      )
      RETURNING id INTO new_subscription_id;

      -- Link subscription to profile
      UPDATE public.profiles
      SET active_subscription_id = new_subscription_id
      WHERE id = user_uuid;
    END IF;

    -- Create credit balance if missing
    IF NOT credit_balance_exists THEN
      INSERT INTO billing.credit_balance (
        user_id,
        plan_id,
        remaining_credits,
        total_credits_allocated,
        period_start,
        period_end,
        last_reset_at
      )
      VALUES (
        user_uuid,
        free_plan_id,
        free_plan_credits,
        free_plan_credits,
        NOW(),
        NOW() + INTERVAL '1 day',
        NOW()
      );

      -- Create initial credit transaction record
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
        free_plan_credits,
        'credit',
        'Initial free tier credits',
        0,
        free_plan_credits
      );
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
