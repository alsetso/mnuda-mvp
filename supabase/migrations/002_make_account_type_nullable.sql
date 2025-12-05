-- Make account_type nullable so users can choose during onboarding
-- Remove default value to allow NULL

ALTER TABLE public.accounts
  ALTER COLUMN account_type DROP DEFAULT;

-- Note: account_type can now be NULL until user completes onboarding



