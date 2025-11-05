-- Backfill simplified members table for existing users
-- Combines first_name and last_name into name field

DO $$
DECLARE
  user_record RECORD;
  combined_name TEXT;
BEGIN
  FOR user_record IN
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.members m
        WHERE m.id = u.id
      )
  LOOP
    -- Combine first_name and last_name into name
    combined_name := NULL;
    
    IF user_record.raw_user_meta_data->>'first_name' IS NOT NULL 
       OR user_record.raw_user_meta_data->>'last_name' IS NOT NULL THEN
      combined_name := trim(
        COALESCE(user_record.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(user_record.raw_user_meta_data->>'last_name', '')
      );
    END IF;

    -- Fallback to email prefix if no name
    IF combined_name IS NULL OR combined_name = '' THEN
      combined_name := split_part(user_record.email, '@', 1);
    END IF;

    INSERT INTO public.members (
      id,
      email,
      name,
      avatar_url,
      role,
      created_at
    )
    VALUES (
      user_record.id,
      user_record.email,
      combined_name,
      NULLIF(user_record.raw_user_meta_data->>'avatar_url', ''),
      'general'::public.member_role, -- Every user gets 'general' role by default
      user_record.created_at
    )
    ON CONFLICT (id) DO NOTHING;

  END LOOP;

  RAISE NOTICE 'Backfilled simplified member records for existing users';
END $$;

