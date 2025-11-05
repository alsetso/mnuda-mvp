-- Consolidated send_email function for OTP email handling
-- This function is called by Supabase auth hooks to send custom OTP emails via edge function
-- Always returns success to prevent hook failures (errors are logged)

CREATE OR REPLACE FUNCTION public.send_email(
  user_data JSONB,
  email_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  http_response RECORD;
  edge_function_url TEXT;
  service_role_key TEXT;
  response_content TEXT;
  response_json JSONB;
BEGIN
  -- Validate required fields
  IF NOT (user_data ? 'email' AND email_data ? 'token') THEN
    RAISE LOG 'send_email: Missing required fields';
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Determine edge function URL based on environment
  -- For production: Use production Supabase edge function URL
  -- For local: Use localhost URL (will be overridden by config.toml hook setting)
  edge_function_url := COALESCE(
    current_setting('app.settings.edge_function_url', true),
    'https://hfklpjuiuhbulztsqapv.supabase.co/functions/v1/send-email'
  );
  
  -- Get service role key from Supabase settings with fallback
  service_role_key := COALESCE(
    current_setting('app.settings.service_role_key', true),
    'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'  -- Fallback to local dev service role key
  );

  -- Make HTTP request to the edge function
  BEGIN
    SELECT * INTO http_response
    FROM http((
      'POST',
      edge_function_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || service_role_key)
      ],
      'application/json',
      jsonb_build_object(
        'user', user_data,
        'email_data', email_data
      )::text
    ));

    -- Extract the content from the response
    response_content := http_response.content;
    
    -- Try to parse the JSON response
    BEGIN
      response_json := response_content::JSONB;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'send_email: Failed to parse response: %', response_content;
      RETURN jsonb_build_object('success', true);
    END;

    -- Log the response for debugging
    RAISE LOG 'send_email: HTTP status: %, response: %', http_response.status, response_content;

    -- Check HTTP status code
    IF http_response.status != 200 THEN
      RAISE LOG 'send_email: Edge function returned status %: %', http_response.status, response_content;
      RETURN jsonb_build_object('success', true);
    END IF;

    -- Check if the response contains an error
    IF response_json->>'error' IS NOT NULL THEN
      RAISE LOG 'send_email: Edge function error: %', response_json->>'error';
      RETURN jsonb_build_object('success', true);
    END IF;

    -- Return success response
    RETURN jsonb_build_object('success', true);
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but return success to prevent hook failure
    RAISE LOG 'send_email: Exception in HTTP call: %', SQLERRM;
    RETURN jsonb_build_object('success', true);
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Always return success to prevent Supabase from thinking the hook failed
    RAISE LOG 'send_email: Outer exception: %', SQLERRM;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;
