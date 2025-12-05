-- Remove unused subscription columns from accounts table
-- Keeps: plan, billing_mode
-- Drops: subscription_status, trial_ends_at

ALTER TABLE public.accounts
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS trial_ends_at;

COMMENT ON TABLE public.accounts IS 'User accounts table - subscription status columns removed, plan and billing_mode kept';

