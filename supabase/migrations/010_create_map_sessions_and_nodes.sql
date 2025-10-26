-- Create map.sessions table for user sessions
CREATE TABLE IF NOT EXISTS map.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    location_tracking_active BOOLEAN DEFAULT false,
    active_user_found_node_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create map.nodes table for session nodes/pins
CREATE TABLE IF NOT EXISTS map.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES map.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL, -- 'userFound', 'api-result', 'people-result', 'start', 'end'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'completed', 'error'
    api_name TEXT, -- 'Skip Trace', 'Zillow Search', 'Person API', etc.
    title TEXT,
    custom_title TEXT,
    has_completed BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Geographic data
    coordinates POINT, -- PostGIS point for lat/lng
    address_data JSONB, -- Structured address information
    
    -- API response data
    raw_response JSONB, -- Full API response
    parsed_data JSONB, -- Processed/structured data
    
    -- Person-specific data (for people-result nodes)
    person_data JSONB,
    
    -- Metadata and tracking
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    processing_time_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON map.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON map.sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON map.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_accessed ON map.sessions(last_accessed_at);

CREATE INDEX IF NOT EXISTS idx_nodes_session_id ON map.nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_nodes_user_id ON map.nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON map.nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON map.nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_api_name ON map.nodes(api_name);
CREATE INDEX IF NOT EXISTS idx_nodes_created_at ON map.nodes(created_at);
CREATE INDEX IF NOT EXISTS idx_nodes_coordinates ON map.nodes USING GIST (coordinates);

-- Enable RLS
ALTER TABLE map.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE map.nodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own sessions" ON map.sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own nodes" ON map.nodes
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON map.sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at 
    BEFORE UPDATE ON map.nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
