-- Fix send_email function to properly handle HTTP response
-- The http() extension returns a table, not JSONB directly

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
    RETURN jsonb_build_object('error', 'Missing required fields: user.email or email_data.token');
  END IF;

  -- Use production Supabase edge function URL
  edge_function_url := 'https://hfklpjuiuhbulztsqapv.supabase.co/functions/v1/send-email';
  
  -- Set your service role key (replace with your actual service role key)
  service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';

  -- Make HTTP request to the edge function
  -- The http() function returns a table with columns: status, content_type, content, headers
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
  
  -- Parse the JSON response
  BEGIN
    response_json := response_content::JSONB;
  EXCEPTION WHEN OTHERS THEN
    -- If parsing fails, return error
    RETURN jsonb_build_object('error', 'Failed to parse edge function response: ' || response_content);
  END;

  -- Check HTTP status code
  IF http_response.status != 200 THEN
    RETURN jsonb_build_object('error', 'Edge function returned status ' || http_response.status || ': ' || COALESCE(response_json->>'error', response_content));
  END IF;

  -- Check if the response contains an error
  IF response_json->>'error' IS NOT NULL THEN
    RETURN jsonb_build_object('error', response_json->>'error');
  END IF;

  -- Return success response
  RETURN jsonb_build_object('success', true, 'messageId', response_json->>'id');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return a generic error message
    RAISE LOG 'Error in send_email function: %', SQLERRM;
    RETURN jsonb_build_object('error', 'Failed to send email: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;

