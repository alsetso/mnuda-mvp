-- Add subscription-related fields to accounts table
-- Adds: subscription_status, plan, billing_mode, stripe_subscription_id

-- ============================================================================
-- STEP 1: Add columns to accounts table
-- ============================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'hobby' CHECK (plan IN ('hobby', 'pro')),
  ADD COLUMN IF NOT EXISTS billing_mode TEXT DEFAULT 'standard' CHECK (billing_mode IN ('standard', 'trial')),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ============================================================================
-- STEP 2: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_subscription_status ON public.accounts(subscription_status) WHERE subscription_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_plan ON public.accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_billing_mode ON public.accounts(billing_mode);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_subscription_id ON public.accounts(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON COLUMN public.accounts.subscription_status IS 'Stripe subscription status: active, canceled, past_due, trialing, incomplete, etc.';
COMMENT ON COLUMN public.accounts.plan IS 'Account plan: hobby or pro';
COMMENT ON COLUMN public.accounts.billing_mode IS 'Billing mode: standard or trial';
COMMENT ON COLUMN public.accounts.stripe_subscription_id IS 'Stripe subscription ID - links to subscriptions table';

