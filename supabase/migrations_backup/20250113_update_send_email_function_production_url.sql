-- Update send_email function to use production edge function URL
-- This replaces the localhost URL with the production Supabase edge function URL

CREATE OR REPLACE FUNCTION public.send_email(
  user_data JSONB,
  email_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  http_response JSONB;
  edge_function_url TEXT;
BEGIN
  -- Validate required fields
  IF NOT (user_data ? 'email' AND email_data ? 'token') THEN
    RETURN jsonb_build_object('error', 'Missing required fields: user.email or email_data.token');
  END IF;

  -- Use production Supabase edge function URL
  -- For local development, this should be overridden or use a different approach
  edge_function_url := 'https://hfklpjuiuhbulztsqapv.supabase.co/functions/v1/send-email';

  -- Make HTTP request to the edge function
  -- Use service role key for internal Supabase calls (required for auth hooks)
  -- The service role key bypasses RLS and is needed for internal operations
  SELECT content::JSONB INTO http_response
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || COALESCE(
        -- Try to get from Supabase settings first
        current_setting('app.settings.service_role_key', true),
        -- Fallback: hardcoded service role key (replace with your actual service role key)
        'YOUR_SERVICE_ROLE_KEY_HERE'
      ))
    ],
    'application/json',
    jsonb_build_object(
      'user', user_data,
      'email_data', email_data
    )::text
  ));

  -- Check if the request was successful
  IF http_response->>'error' IS NOT NULL THEN
    RETURN jsonb_build_object('error', http_response->>'error');
  END IF;

  -- Return success response
  RETURN jsonb_build_object('success', true, 'messageId', http_response->>'id');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return a generic error message
    RAISE LOG 'Error in send_email function: %', SQLERRM;
    RETURN jsonb_build_object('error', 'Failed to send email: ' || SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;

