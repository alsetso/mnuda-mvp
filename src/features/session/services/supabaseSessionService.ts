'use client';

import { supabase } from '@/lib/supabase';
import { SessionData, NodeData } from './sessionStorage';

export interface SupabaseSession {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  location_tracking_active: boolean;
  active_user_found_node_id?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

export interface SupabaseNode {
  id: string;
  session_id: string;
  user_id: string;
  node_type: string;
  status: string;
  api_type_id?: string;
  api_name?: string;
  title?: string;
  custom_title?: string;
  has_completed: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
  coordinates?: { lat: number; lng: number };
  address_data?: Record<string, unknown>;
  raw_response?: Record<string, unknown>;
  parsed_data?: Record<string, unknown>;
  parent_node_id?: string;
  error_message?: string;
  processing_time_ms?: number;
  metadata: Record<string, unknown>;
}

export class SupabaseSessionService {
  /**
   * Fetch all sessions for the current user
   */
  static async getSessions(userId: string): Promise<SessionData[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }

      return (sessions || []).map(this.convertSupabaseSessionToSessionData);
    } catch (error) {
      console.error('Error in getSessions:', error);
      return [];
    }
  }

  /**
   * Fetch a specific session with its nodes
   */
  static async getSessionWithNodes(sessionId: string, userId: string): Promise<SessionData | null> {
    try {
      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching session:', sessionError);
        return null;
      }

      // Get nodes for this session
      const { data: nodes, error: nodesError } = await supabase
        .from('nodes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (nodesError) {
        console.error('Error fetching nodes:', nodesError);
        return null;
      }

      const sessionData = this.convertSupabaseSessionToSessionData(session);
      sessionData.nodes = (nodes || []).map(this.convertSupabaseNodeToNodeData);
      
      return sessionData;
    } catch (error) {
      console.error('Error in getSessionWithNodes:', error);
      return null;
    }
  }

  /**
   * Create a new session
   */
  static async createSession(
    userId: string, 
    name: string, 
    description?: string
  ): Promise<SessionData | null> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          name,
          description,
          is_active: false,
          location_tracking_active: false,
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      return this.convertSupabaseSessionToSessionData(session);
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  /**
   * Update session (rename, description, etc.)
   */
  static async updateSession(
    sessionId: string, 
    userId: string, 
    updates: Partial<Pick<SupabaseSession, 'name' | 'description' | 'is_active' | 'location_tracking_active'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating session:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSession:', error);
      return false;
    }
  }

  /**
   * Delete a session and all its nodes
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Delete session (nodes will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting session:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  /**
   * Add a node to a session
   */
  static async addNode(sessionId: string, userId: string, node: Omit<NodeData, 'id'>): Promise<NodeData | null> {
    try {
      console.log('🔍 SupabaseSessionService.addNode called:', {
        sessionId,
        userId,
        nodeType: node.type,
        nodeId: node.id
      });

      const supabaseNode: Omit<SupabaseNode, 'id' | 'created_at' | 'updated_at'> = {
        session_id: sessionId,
        user_id: userId,
        node_type: node.type,
        status: node.status || 'pending',
        api_name: node.apiName,
        title: node.title,
        custom_title: node.customTitle,
        has_completed: node.hasCompleted || false,
        timestamp: new Date(node.timestamp).toISOString(),
        coordinates: node.address?.coordinates ? {
          lat: node.address.coordinates.latitude,
          lng: node.address.coordinates.longitude
        } : undefined,
        address_data: node.address ? {
          street: node.address.street,
          city: node.address.city,
          state: node.address.state,
          zip: node.address.zip,
          coordinates: node.address.coordinates
        } : undefined,
        raw_response: node.response as Record<string, unknown>,
        parsed_data: node.personData as Record<string, unknown>,
        parent_node_id: node.parentNodeId,
        error_message: node.errorMessage,
        processing_time_ms: node.processingTimeMs,
        metadata: node.metadata || {}
      };

      console.log('📤 Inserting node into Supabase:', {
        session_id: supabaseNode.session_id,
        user_id: supabaseNode.user_id,
        node_type: supabaseNode.node_type,
        api_name: supabaseNode.api_name
      });

      const { data, error } = await supabase
        .from('nodes')
        .insert(supabaseNode)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Node inserted successfully:', data.id);
      const convertedNode = this.convertSupabaseNodeToNodeData(data);
      console.log('🔄 Converted node:', convertedNode.id);
      
      return convertedNode;
    } catch (error) {
      console.error('❌ Error in SupabaseSessionService.addNode:', error);
      return null;
    }
  }

  /**
   * Delete a node
   */
  static async deleteNode(nodeId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting node:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNode:', error);
      return false;
    }
  }

  /**
   * Update session's last accessed time
   */
  static async updateLastAccessed(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating last accessed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLastAccessed:', error);
      return false;
    }
  }

  /**
   * Convert Supabase session to SessionData format
   */
  private static convertSupabaseSessionToSessionData(session: SupabaseSession): SessionData {
    return {
      id: session.id,
      name: session.name,
      createdAt: new Date(session.created_at).getTime(),
      lastAccessed: new Date(session.last_accessed_at).getTime(),
      nodes: [], // Will be populated separately
      locationTrackingActive: session.location_tracking_active,
      description: session.description,
      isActive: session.is_active,
      metadata: session.metadata
    };
  }

  /**
   * Convert Supabase node to NodeData format
   */
  private static convertSupabaseNodeToNodeData(node: SupabaseNode): NodeData {
    return {
      id: node.id,
      type: node.node_type as 'userFound' | 'api-result' | 'people-result' | 'start' | 'end',
      status: node.status as 'pending' | 'processing' | 'ready' | 'completed' | 'error',
      apiName: node.api_name,
      title: node.title,
      customTitle: node.custom_title,
      hasCompleted: node.has_completed,
      timestamp: new Date(node.timestamp).getTime(),
      address: node.address_data ? {
        street: node.address_data.street as string,
        city: node.address_data.city as string,
        state: node.address_data.state as string,
        zip: node.address_data.zip as string,
        coordinates: node.address_data.coordinates as { latitude: number; longitude: number }
      } : undefined,
      response: node.raw_response,
      personData: node.parsed_data,
      parentNodeId: node.parent_node_id,
      errorMessage: node.error_message,
      processingTimeMs: node.processing_time_ms,
      metadata: node.metadata
    };
  }
}
