-- Backfill member records for existing users
-- This migration creates member records for all users in auth.users who don't have one yet
-- Safe to run multiple times (idempotent)
-- Handles username conflicts by generating unique usernames

DO $$
DECLARE
  users_backfilled INTEGER;
  user_record RECORD;
  base_username TEXT;
  final_username TEXT;
  username_counter INTEGER;
BEGIN
  -- Loop through each user and create member record with unique username
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
    -- Start with username from metadata or email prefix
    base_username := COALESCE(
      NULLIF(user_record.raw_user_meta_data->>'username', ''),
      split_part(user_record.email, '@', 1)
    );
    
    -- Ensure username is not empty
    IF base_username IS NULL OR trim(base_username) = '' THEN
      base_username := 'user_' || substr(user_record.id::text, 1, 8);
    END IF;
    
    -- Clean username (lowercase, remove special chars, limit length)
    base_username := lower(regexp_replace(base_username, '[^a-z0-9_]', '', 'g'));
    base_username := substr(base_username, 1, 50);
    
    -- Generate unique username
    final_username := base_username;
    username_counter := 0;
    
    -- Check if username exists, append number if needed
    WHILE EXISTS (
      SELECT 1 FROM public.members m 
      WHERE m.username = final_username
    ) LOOP
      username_counter := username_counter + 1;
      final_username := base_username || '_' || username_counter::text;
      
      -- Safety check to prevent infinite loop
      IF username_counter > 9999 THEN
        final_username := 'user_' || substr(user_record.id::text, 1, 8);
        EXIT;
      END IF;
    END LOOP;
    
    -- Insert member record
    INSERT INTO public.members (
      id, 
      email, 
      username, 
      first_name, 
      last_name, 
      avatar_url, 
      timezone, 
      created_at
    )
    VALUES (
      user_record.id,
      user_record.email,
      final_username,
      NULLIF(user_record.raw_user_meta_data->>'first_name', ''),
      NULLIF(user_record.raw_user_meta_data->>'last_name', ''),
      NULLIF(user_record.raw_user_meta_data->>'avatar_url', ''),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'timezone', ''), 'UTC'),
      user_record.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    
  END LOOP;
  
  GET DIAGNOSTICS users_backfilled = ROW_COUNT;
  
  RAISE NOTICE 'Backfilled % member record(s) for existing users', users_backfilled;
END $$;

