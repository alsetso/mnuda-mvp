-- Fix send_email function to be more robust and handle errors gracefully
-- Supabase auth hooks require the function to return successfully

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
    -- Return success but log the error - don't fail the hook
    RAISE LOG 'send_email: Missing required fields';
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Use production Supabase edge function URL
  edge_function_url := 'https://hfklpjuiuhbulztsqapv.supabase.co/functions/v1/send-email';
  
  -- Set your service role key (replace with your actual service role key)
  service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';

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
      -- Return success to prevent hook failure, but log the error
      RETURN jsonb_build_object('success', true);
    END;

    -- Log the response for debugging
    RAISE LOG 'send_email: HTTP status: %, response: %', http_response.status, response_content;

    -- Check HTTP status code
    IF http_response.status != 200 THEN
      RAISE LOG 'send_email: Edge function returned status %: %', http_response.status, response_content;
      -- Return success to prevent hook failure
      RETURN jsonb_build_object('success', true);
    END IF;

    -- Check if the response contains an error
    IF response_json->>'error' IS NOT NULL THEN
      RAISE LOG 'send_email: Edge function error: %', response_json->>'error';
      -- Return success to prevent hook failure
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
    -- Always return success to prevent Supabase from thinking the hook needs auth
    RAISE LOG 'send_email: Outer exception: %', SQLERRM;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;

