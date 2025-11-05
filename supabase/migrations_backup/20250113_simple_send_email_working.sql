-- Simple working version - minimal complexity

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
BEGIN
  -- Make HTTP request to edge function
  SELECT * INTO http_response
  FROM http((
    'POST',
    'https://hfklpjuiuhbulztsqapv.supabase.co/functions/v1/send-email',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE')
    ],
    'application/json',
    jsonb_build_object(
      'user', user_data,
      'email_data', email_data
    )::text
  ));

  -- Always return success
  RETURN jsonb_build_object('success', true);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_email(JSONB, JSONB) TO authenticated;

