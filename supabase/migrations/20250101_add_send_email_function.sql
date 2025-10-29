-- Add send_email function for custom OTP email handling
-- This function will be called by Supabase auth hooks to send custom branded emails

-- Create the send_email function
CREATE OR REPLACE FUNCTION public.send_email(
  user_data JSONB,
  email_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  response JSONB;
  http_response JSONB;
BEGIN
  -- Validate required fields
  IF NOT (user_data ? 'email' AND email_data ? 'token') THEN
    RETURN jsonb_build_object('error', 'Missing required fields: user.email or email_data.token');
  END IF;

  -- Make HTTP request to the edge function
  SELECT content::JSONB INTO http_response
  FROM http((
    'POST',
    'http://127.0.0.1:54321/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEND_EMAIL FUNCTION CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Function: public.send_email(JSONB, JSONB)';
  RAISE NOTICE 'Purpose: Custom OTP email handling via edge function';
  RAISE NOTICE 'Hook configured in supabase/config.toml';
  RAISE NOTICE '========================================';
END $$;
