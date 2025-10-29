import { supabase } from '@/lib/supabase';
import { SessionData, NodeData } from './sessionStorage';
import { Json } from '@/types/supabase';
// Teams feature removed

// Database types matching the actual schema
interface SupabaseSession {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  location_tracking_active: boolean;
  active_user_found_node_id?: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Json;
}

interface SupabaseNode {
  id: string;
  session_id: string;
  user_id: string;
  node_type: string;
  status: string;
  api_name?: string | null;
  title?: string | null;
  custom_title?: string | null;
  has_completed: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
  coordinates?: string | null; // PostGIS POINT as string
  address_data?: Json | null;
  raw_response?: Json | null;
  parsed_data?: Json | null;
  person_data?: Json | null;
  metadata: Json;
  error_message?: string | null;
  processing_time_ms?: number | null;
}

// Input validation types
interface CreateSessionInput {
  name: string;
  description?: string;
}

interface UpdateSessionInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  location_tracking_active?: boolean;
  active_user_found_node_id?: string | null;
}

interface CreateNodeInput {
  type: 'start' | 'userFound' | 'api-result' | 'people-result' | 'end';
  status?: 'pending' | 'ready' | 'processing' | 'completed' | 'error';
  apiName?: string;
  title?: string;
  customTitle?: string;
  hasCompleted?: boolean;
  timestamp?: string | number;
  coordinates?: string | { lat: number; lng: number };
  addressData?: Json;
  rawResponse?: Json;
  parsedData?: Json;
  personData?: Json;
  metadata?: Json;
  errorMessage?: string;
  processingTimeMs?: number;
}

// Error types
class SessionServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SessionServiceError';
  }
}

export class SupabaseSessionService {
  private static readonly MAX_SESSIONS_PER_PAGE = 50;
  private static readonly MAX_NODES_PER_PAGE = 100;

  /**
   * Get all sessions for a user with pagination (includes owned + team-shared sessions)
   */
  static async getSessions(
    userId: string,
    page: number = 1,
    limit: number = this.MAX_SESSIONS_PER_PAGE
  ): Promise<{ sessions: SessionData[]; total: number; hasMore: boolean }> {
    try {
      this.validateUserId(userId);
      this.validatePagination(page, limit);

      const offset = (page - 1) * limit;

      // Get owned sessions
      const { data: ownedSessions, error: ownedError, count: ownedCount } = await supabase
        .from('sessions' as never)
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (ownedError) {
        throw new SessionServiceError(
          'Failed to fetch owned sessions',
          'FETCH_SESSIONS_ERROR',
          ownedError
        );
      }

      // No team-shared sessions in simplified app
      const allSessions = ((ownedSessions || []) as SupabaseSession[]).map((session) => ({
        id: session.id,
        user_id: session.user_id,
        name: session.name,
        description: session.description,
        is_active: session.is_active,
        location_tracking_active: session.location_tracking_active,
        active_user_found_node_id: session.active_user_found_node_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        last_accessed_at: session.last_accessed_at,
        metadata: session.metadata,
        is_owned: true,
        team: null,
      }));

      // Remove duplicates and sort by last accessed
      const uniqueSessions = allSessions
        .filter((session, index, self) => index === self.findIndex((s) => s.id === session.id))
        .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime());

      const total = ownedCount || 0;
      const hasMore = offset + limit < total;

      return {
        sessions: uniqueSessions.map(this.convertSupabaseSessionToSessionData),
        total,
        hasMore
      };
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error fetching sessions',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Get a specific session with its nodes using a single JOIN query
   */
  static async getSessionWithNodes(
    sessionId: string,
    userId: string,
    nodeLimit: number = this.MAX_NODES_PER_PAGE
  ): Promise<SessionData | null> {
    try {
      this.validateSessionId(sessionId);
      this.validateUserId(userId);

      // Get session with nodes in a single query
      const { data, error } = await supabase
        .from('sessions' as never)
        .select(`
          *,
          nodes!inner(
            id,
            session_id,
            user_id,
            node_type,
            status,
            api_name,
            title,
            custom_title,
            has_completed,
            timestamp,
            created_at,
            updated_at,
            coordinates,
            address_data,
            raw_response,
            parsed_data,
            person_data,
            metadata,
            error_message,
            processing_time_ms
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .eq('nodes.user_id', userId)
        .order('created_at', { foreignTable: 'nodes', ascending: true })
        .limit(nodeLimit, { foreignTable: 'nodes' })
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Session not found
        }
        throw new SessionServiceError(
          'Failed to fetch session with nodes',
          'FETCH_SESSION_ERROR',
          error
        );
      }

      const sessionData = this.convertSupabaseSessionToSessionData(data as SupabaseSession);
      sessionData.nodes = (((data as unknown as { nodes?: SupabaseNode[] }).nodes) || []).map(this.convertSupabaseNodeToNodeData);
      
      return sessionData;
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error fetching session with nodes',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Create a new session
   */
  static async createSession(
    userId: string,
    input: CreateSessionInput
  ): Promise<SessionData> {
    try {
      this.validateUserId(userId);
      this.validateCreateSessionInput(input);

      const { data: session, error } = await supabase
        .from('sessions' as never)
        .insert({
          user_id: userId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          is_active: false,
          location_tracking_active: false,
          metadata: {}
        } as never)
        .select()
        .single();

      if (error) {
        throw new SessionServiceError(
          'Failed to create session',
          'CREATE_SESSION_ERROR',
          error
        );
      }

      return this.convertSupabaseSessionToSessionData(session);
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error creating session',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Update session
   */
  static async updateSession(
    sessionId: string,
    userId: string,
    updates: UpdateSessionInput
  ): Promise<SessionData> {
    try {
      this.validateSessionId(sessionId);
      this.validateUserId(userId);
      this.validateUpdateSessionInput(updates);

      const updateData: Partial<SupabaseSession> = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || null;
      }
      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }
      if (updates.location_tracking_active !== undefined) {
        updateData.location_tracking_active = updates.location_tracking_active;
      }
      if (updates.active_user_found_node_id !== undefined) {
        updateData.active_user_found_node_id = updates.active_user_found_node_id;
      }

      const { data: session, error } = await supabase
        .from('sessions' as never)
        .update(updateData as never)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new SessionServiceError(
            'Session not found',
            'SESSION_NOT_FOUND'
          );
        }
        throw new SessionServiceError(
          'Failed to update session',
          'UPDATE_SESSION_ERROR',
          error
        );
      }

      return this.convertSupabaseSessionToSessionData(session);
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error updating session',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Delete a session and all its nodes
   */
  static async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      this.validateSessionId(sessionId);
      this.validateUserId(userId);

      const { error } = await supabase
        .from('sessions' as never)
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new SessionServiceError(
          'Failed to delete session',
          'DELETE_SESSION_ERROR',
          error
        );
      }
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error deleting session',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Add a node to a session
   */
  static async addNode(
    sessionId: string,
    userId: string,
    input: CreateNodeInput
  ): Promise<NodeData> {
    try {
      this.validateSessionId(sessionId);
      this.validateUserId(userId);
      this.validateCreateNodeInput(input);

      const supabaseNode: Omit<SupabaseNode, 'id' | 'created_at' | 'updated_at'> = {
        session_id: sessionId,
        user_id: userId,
        node_type: input.type,
        status: input.status || 'pending',
        api_name: input.apiName || null,
        title: input.title || null,
        custom_title: input.customTitle || null,
        has_completed: input.hasCompleted || false,
        timestamp: this.normalizeTimestamp(input.timestamp),
        coordinates: this.normalizeCoordinates(input.coordinates),
        address_data: input.addressData || null,
        raw_response: input.rawResponse || null,
        parsed_data: input.parsedData || null,
        person_data: input.personData || null,
        metadata: input.metadata || {},
        error_message: input.errorMessage || null,
        processing_time_ms: input.processingTimeMs || null
      };

      const { data, error } = await supabase
        .from('nodes' as never)
        .insert(supabaseNode as never)
        .select()
        .single();

      if (error) {
        throw new SessionServiceError(
          'Failed to create node',
          'CREATE_NODE_ERROR',
          error
        );
      }

      return this.convertSupabaseNodeToNodeData(data);
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error creating node',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Delete a node
   */
  static async deleteNode(nodeId: string, userId: string): Promise<void> {
    try {
      this.validateNodeId(nodeId);
      this.validateUserId(userId);

      const { error } = await supabase
        .from('nodes' as never)
        .delete()
        .eq('id', nodeId)
        .eq('user_id', userId);

      if (error) {
        throw new SessionServiceError(
          'Failed to delete node',
          'DELETE_NODE_ERROR',
          error
        );
      }
    } catch (error) {
      if (error instanceof SessionServiceError) {
        throw error;
      }
      throw new SessionServiceError(
        'Unexpected error deleting node',
        'UNEXPECTED_ERROR',
        error
      );
    }
  }

  /**
   * Update session's last accessed time (with debouncing)
   */
  private static lastAccessedUpdateCache = new Map<string, NodeJS.Timeout>();

  static async updateLastAccessed(sessionId: string, userId: string): Promise<void> {
    try {
      this.validateSessionId(sessionId);
      this.validateUserId(userId);

      // Debounce updates to prevent excessive database calls
      const cacheKey = `${sessionId}-${userId}`;
      const existingTimeout = this.lastAccessedUpdateCache.get(cacheKey);
      
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('sessions' as never)
            .update({
              last_accessed_at: new Date().toISOString()
            } as never)
            .eq('id', sessionId)
            .eq('user_id', userId);

          if (error) {
            console.error('Failed to update last accessed time:', error);
          }
        } catch (error) {
          console.error('Error updating last accessed time:', error);
        } finally {
          this.lastAccessedUpdateCache.delete(cacheKey);
        }
      }, 1000); // 1 second debounce

      this.lastAccessedUpdateCache.set(cacheKey, timeout);
    } catch (error) {
      // Don't throw for last accessed updates - it's not critical
      console.error('Error in updateLastAccessed:', error);
    }
  }

  // Private conversion methods
  private static convertSupabaseSessionToSessionData(
    session: SupabaseSession & Partial<{ is_owned: boolean; team: { id: string; name: string; description?: string }; shared_at: string; shared_by: string }>
  ): SessionData {
    return {
      id: session.id,
      name: session.name,
      isActive: session.is_active,
      createdAt: new Date(session.created_at).getTime(),
      lastAccessed: new Date(session.last_accessed_at).getTime(),
      locationTrackingActive: session.location_tracking_active,
      activeUserFoundNodeId: session.active_user_found_node_id || undefined,
      nodes: [], // Will be populated by getSessionWithNodes
      metadata: session.metadata as Record<string, unknown> || {},
      // Team-related fields
      isOwned: session.is_owned !== false, // default to true if not specified
      team: session.team ? {
        id: session.team.id,
        name: session.team.name,
        description: session.team.description,
      } : undefined,
      sharedAt: session.shared_at ? new Date(session.shared_at).getTime() : undefined,
      sharedBy: session.shared_by,
    };
  }

  private static convertSupabaseNodeToNodeData(node: SupabaseNode): NodeData {
    return {
      id: node.id,
      sessionId: node.session_id,
      userId: node.user_id,
      type: node.node_type as NodeData['type'],
      status: node.status as NodeData['status'],
      apiName: node.api_name || undefined,
      title: node.title || undefined,
      customTitle: node.custom_title || undefined,
      hasCompleted: node.has_completed,
      timestamp: node.timestamp,
      createdAt: node.created_at,
      updatedAt: node.updated_at,
      coordinates: node.coordinates || undefined,
      addressData: node.address_data || undefined,
      rawResponse: node.raw_response || undefined,
      parsedData: node.parsed_data || undefined,
      personData: node.person_data || undefined,
      metadata: node.metadata as Record<string, unknown> || {},
      errorMessage: node.error_message || undefined,
      processingTimeMs: node.processing_time_ms || undefined,
      // Legacy fields for compatibility
      mnNodeId: node.id, // Use database ID as mnNodeId
      parentNodeId: undefined,
      clickedEntityId: undefined,
      clickedEntityData: undefined
    };
  }

  // Validation methods
  private static validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new SessionServiceError('Invalid user ID', 'INVALID_USER_ID');
    }
  }

  private static validateSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new SessionServiceError('Invalid session ID', 'INVALID_SESSION_ID');
    }
  }

  private static validateNodeId(nodeId: string): void {
    if (!nodeId || typeof nodeId !== 'string' || nodeId.trim().length === 0) {
      throw new SessionServiceError('Invalid node ID', 'INVALID_NODE_ID');
    }
  }

  private static validatePagination(page: number, limit: number): void {
    if (page < 1 || limit < 1 || limit > this.MAX_SESSIONS_PER_PAGE) {
      throw new SessionServiceError('Invalid pagination parameters', 'INVALID_PAGINATION');
    }
  }

  private static validateCreateSessionInput(input: CreateSessionInput): void {
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new SessionServiceError('Session name is required', 'INVALID_SESSION_NAME');
    }
    if (input.name.length > 255) {
      throw new SessionServiceError('Session name too long', 'SESSION_NAME_TOO_LONG');
    }
    if (input.description && input.description.length > 1000) {
      throw new SessionServiceError('Session description too long', 'SESSION_DESCRIPTION_TOO_LONG');
    }
  }

  private static validateUpdateSessionInput(input: UpdateSessionInput): void {
    if (input.name !== undefined && (!input.name || input.name.trim().length === 0)) {
      throw new SessionServiceError('Session name cannot be empty', 'INVALID_SESSION_NAME');
    }
    if (input.name && input.name.length > 255) {
      throw new SessionServiceError('Session name too long', 'SESSION_NAME_TOO_LONG');
    }
    if (input.description && input.description.length > 1000) {
      throw new SessionServiceError('Session description too long', 'SESSION_DESCRIPTION_TOO_LONG');
    }
  }

  private static validateCreateNodeInput(input: CreateNodeInput): void {
    if (!input.type || !['start', 'userFound', 'api-result', 'people-result', 'end'].includes(input.type)) {
      throw new SessionServiceError('Invalid node type', 'INVALID_NODE_TYPE');
    }
    if (input.status && !['pending', 'ready', 'processing', 'completed', 'error'].includes(input.status)) {
      throw new SessionServiceError('Invalid node status', 'INVALID_NODE_STATUS');
    }
    if (input.title && input.title.length > 255) {
      throw new SessionServiceError('Node title too long', 'NODE_TITLE_TOO_LONG');
    }
    if (input.customTitle && input.customTitle.length > 255) {
      throw new SessionServiceError('Node custom title too long', 'NODE_CUSTOM_TITLE_TOO_LONG');
    }
  }

  // Utility methods
  private static normalizeTimestamp(timestamp?: string | number): string {
    if (!timestamp) {
      return new Date().toISOString();
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toISOString();
    }
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    
    return date.toISOString();
  }

  private static normalizeCoordinates(coordinates?: string | { lat: number; lng: number }): string | null {
    if (!coordinates) {
      return null;
    }
    
    if (typeof coordinates === 'string') {
      return coordinates;
    }
    
    if (typeof coordinates === 'object' && 'lat' in coordinates && 'lng' in coordinates) {
      return `${coordinates.lng},${coordinates.lat}`; // PostGIS uses lng,lat format
    }
    
    return null;
  }
}

// Export error class for external use
export { SessionServiceError };