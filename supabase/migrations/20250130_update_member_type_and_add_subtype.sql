-- Update member_type enum to 6 core roles and add member_subtype column
-- These 6 roles cover every human entering the platform

-- Step 1: Add member_subtype column (optional text field for specialization)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS member_subtype TEXT;

-- Step 2: Create new member_type enum with 6 core values
CREATE TYPE public.member_type_new AS ENUM (
  'homeowner',
  'investor',
  'agent',
  'contractor',
  'lender',
  'advisor'
);

-- Step 3: Drop the old column default and convert to text first
ALTER TABLE public.members
  ALTER COLUMN member_type DROP DEFAULT;

-- Convert column to text temporarily
ALTER TABLE public.members
  ALTER COLUMN member_type TYPE TEXT USING member_type::text;

-- Step 4: Update existing data to map to new enum values
-- Map old values to new ones where possible, default to 'homeowner' for unmapped
UPDATE public.members
SET member_type = CASE
  WHEN member_type = 'developer' THEN 'contractor'
  WHEN member_type = 'investor' THEN 'investor'
  WHEN member_type = 'agent' THEN 'agent'
  WHEN member_type = 'builder' THEN 'contractor'
  WHEN member_type = 'contractor' THEN 'contractor'
  WHEN member_type = 'lender' THEN 'lender'
  WHEN member_type = 'attorney' THEN 'advisor'
  WHEN member_type = 'inspector' THEN 'advisor'
  WHEN member_type = 'appraiser' THEN 'advisor'
  WHEN member_type = 'wholesaler' THEN 'investor'
  WHEN member_type = 'homeowner' THEN 'homeowner'
  WHEN member_type = 'neighbor' THEN 'homeowner'
  WHEN member_type = 'consultant' THEN 'advisor'
  WHEN member_type = 'service_provider' THEN 'advisor'
  WHEN member_type = 'general' THEN 'homeowner'
  ELSE 'homeowner'
END;

-- Step 5: Convert column to new enum type
ALTER TABLE public.members
  ALTER COLUMN member_type TYPE public.member_type_new USING member_type::public.member_type_new;

-- Step 6: Drop old enum and rename new one
DROP TYPE IF EXISTS public.member_type CASCADE;
ALTER TYPE public.member_type_new RENAME TO member_type;

-- Set default after rename
ALTER TABLE public.members
  ALTER COLUMN member_type SET DEFAULT 'homeowner'::public.member_type;

-- Step 7: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, name, role, state, member_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'general'::public.member_role,
    'MN',
    'homeowner'::public.member_type
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add index for member_subtype (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_members_member_subtype ON public.members(member_subtype) WHERE member_subtype IS NOT NULL;

-- Step 9: Update comments
COMMENT ON COLUMN public.members.member_type IS 'Core member role: homeowner, investor, agent, contractor, lender, or advisor';
COMMENT ON COLUMN public.members.member_subtype IS 'Optional specialization within member_type (e.g., contractor → "roofer", investor → "flipper", advisor → "attorney")';

