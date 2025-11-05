-- Create skip_tracing table for storing skip trace API results
-- Stores results from name, address, phone, and email searches

CREATE TYPE public.skip_trace_api_type AS ENUM ('name', 'address', 'phone', 'email');

CREATE TABLE IF NOT EXISTS public.skip_tracing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_type public.skip_trace_api_type NOT NULL,
  search_query TEXT NOT NULL,
  developer_data JSONB,
  raw_response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skip_tracing_user_id ON public.skip_tracing(user_id);
CREATE INDEX IF NOT EXISTS idx_skip_tracing_api_type ON public.skip_tracing(api_type);
CREATE INDEX IF NOT EXISTS idx_skip_tracing_created_at ON public.skip_tracing(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skip_tracing_search_query ON public.skip_tracing(search_query);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_skip_tracing_updated_at 
    BEFORE UPDATE ON public.skip_tracing 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skip_tracing TO authenticated;

-- Enable RLS
ALTER TABLE public.skip_tracing ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own skip trace results
CREATE POLICY "Users can view own skip trace results"
  ON public.skip_tracing
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own skip trace results
CREATE POLICY "Users can insert own skip trace results"
  ON public.skip_tracing
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own skip trace results
CREATE POLICY "Users can update own skip trace results"
  ON public.skip_tracing
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own skip trace results
CREATE POLICY "Users can delete own skip trace results"
  ON public.skip_tracing
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

