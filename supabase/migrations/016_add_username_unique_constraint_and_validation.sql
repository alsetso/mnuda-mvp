-- Add UNIQUE constraint to username and validation
-- Generate unique random usernames when needed
-- Add username availability check function

-- ============================================================================
-- STEP 1: Add UNIQUE constraint to username
-- ============================================================================

-- First, ensure no duplicate usernames exist
UPDATE public.accounts
SET username = username || '_' || substr(md5(random()::text), 1, 6)
WHERE username IN (
  SELECT username
  FROM public.accounts
  WHERE username IS NOT NULL
  GROUP BY username
  HAVING COUNT(*) > 1
);

-- Add UNIQUE constraint
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_username_unique UNIQUE (username);

-- ============================================================================
-- STEP 2: Add check constraint for minimum length
-- ============================================================================

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_username_length CHECK (
    username IS NULL OR char_length(username) > 4
  );

-- ============================================================================
-- STEP 3: Create function to generate unique random username
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_unique_username(base_username TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  attempt_count INT := 0;
  max_attempts INT := 10;
BEGIN
  -- If base_username provided and available, use it
  IF base_username IS NOT NULL AND char_length(base_username) > 4 THEN
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE username = base_username) THEN
      RETURN base_username;
    END IF;
  END IF;

  -- Generate random username
  LOOP
    -- Generate random username: base + random 6 chars (if base provided) or fully random
    IF base_username IS NOT NULL AND char_length(base_username) > 0 THEN
      new_username := base_username || '_' || substr(md5(random()::text), 1, 6);
    ELSE
      new_username := 'user_' || substr(md5(random()::text), 1, 8);
    END IF;

    -- Ensure minimum length
    IF char_length(new_username) <= 4 THEN
      new_username := new_username || substr(md5(random()::text), 1, 4);
    END IF;

    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE username = new_username) THEN
      RETURN new_username;
    END IF;

    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      -- Fallback: use timestamp-based username
      new_username := 'user_' || substr(md5(extract(epoch from now())::text || random()::text), 1, 10);
      IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE username = new_username) THEN
        RETURN new_username;
      END IF;
      -- Last resort: throw error
      RAISE EXCEPTION 'Unable to generate unique username after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_unique_username IS 
  'Generates a unique username. If base_username is provided and available, uses it. Otherwise generates random unique username.';

-- ============================================================================
-- STEP 4: Create function to check username availability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate length
  IF check_username IS NULL OR char_length(check_username) <= 4 THEN
    RETURN false;
  END IF;

  -- Check if username exists
  RETURN NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE username = check_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_username_available IS 
  'Checks if a username is available (not taken and meets length requirements). Returns true if available, false otherwise.';

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_unique_username TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available TO authenticated;

-- ============================================================================
-- STEP 6: Update handle_new_user trigger to use unique username generation
-- ============================================================================

-- Find and update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- Generate unique username from email
  new_username := public.generate_unique_username(
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.accounts (user_id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    'general'::public.account_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 
  'Creates account record for new user with unique username generated from email.';

