'use client';

import { useState, useEffect, useCallback } from 'react';
import { sessionStorageService, SessionData, NodeData } from '../services/sessionStorage';
import { SupabaseSessionService } from '../services/supabaseSessionService';
import { useAuth } from '@/features/auth';

export function useSessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize sessions on mount - SUPABASE IMPLEMENTATION
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSession(null);
      setLoading(false);
      return;
    }

    const loadSessions = async () => {
      try {
        setLoading(true);
        const allSessions = await SupabaseSessionService.getSessions(user.id);
        setSessions(allSessions);
        
        // Set the most recently accessed session as current
        if (allSessions.length > 0) {
          const mostRecent = allSessions[0]; // Already sorted by last_accessed_at desc
          const sessionWithNodes = await SupabaseSessionService.getSessionWithNodes(mostRecent.id, user.id);
          setCurrentSession(sessionWithNodes);
        } else {
          setCurrentSession(null);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
        setCurrentSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  // Force refresh sessions list - SUPABASE IMPLEMENTATION
  const refreshSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setCurrentSession(null);
      return;
    }

    try {
      const allSessions = await SupabaseSessionService.getSessions(user.id);
      setSessions(allSessions);
      
      // Update current session if it exists
      if (currentSession) {
        const updatedSession = await SupabaseSessionService.getSessionWithNodes(currentSession.id, user.id);
        setCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  }, [user, currentSession]);

  // Add node and trigger refresh - SUPABASE IMPLEMENTATION
  const addNode = useCallback(async (node: NodeData) => {
    console.log('🔍 addNode called with:', { 
      nodeId: node.id, 
      nodeType: node.type, 
      userId: user?.id, 
      sessionId: currentSession?.id 
    });
    
    if (!user || !currentSession) {
      console.warn('❌ Cannot add node: user not authenticated or no current session');
      return;
    }

    try {
      console.log('📤 Calling SupabaseSessionService.addNode...');
      const addedNode = await SupabaseSessionService.addNode(currentSession.id, user.id, node);
      
      if (addedNode) {
        console.log('✅ Node added to database:', addedNode.id);
        
        // Update current session with the new node
        console.log('🔄 Refreshing session with nodes...');
        const updatedSession = await SupabaseSessionService.getSessionWithNodes(currentSession.id, user.id);
        
        if (updatedSession) {
          console.log('✅ Session refreshed, nodes count:', updatedSession.nodes.length);
          setCurrentSession(updatedSession);
        } else {
          console.warn('⚠️ Session refresh returned null');
        }
      } else {
        console.warn('⚠️ addNode returned null - node may not have been saved');
      }
    } catch (error) {
      console.error('❌ Error adding node:', error);
    }
  }, [user, currentSession]);

  // Create new session and trigger refresh - SUPABASE IMPLEMENTATION
  const createNewSession = useCallback(async (name?: string) => {
    if (!user) {
      console.warn('Cannot create session: user not authenticated');
      return null;
    }

    try {
      const sessionName = name || `Session ${new Date().toLocaleDateString()}`;
      const newSession = await SupabaseSessionService.createSession(user.id, sessionName);
      
      if (newSession) {
        // Refresh sessions list
        const allSessions = await SupabaseSessionService.getSessions(user.id);
        setSessions(allSessions);
        
        // Set the new session as current
        const sessionWithNodes = await SupabaseSessionService.getSessionWithNodes(newSession.id, user.id);
        setCurrentSession(sessionWithNodes);
        return sessionWithNodes;
      }
      return null;
    } catch (error) {
      console.error('Error creating new session:', error);
      return null;
    }
  }, [user]);

  // Switch session and trigger refresh - SUPABASE IMPLEMENTATION
  const switchSession = useCallback(async (sessionId: string) => {
    if (!user) {
      console.warn('Cannot switch session: user not authenticated');
      return;
    }

    try {
      // Update last accessed time for the session
      await SupabaseSessionService.updateLastAccessed(sessionId, user.id);
      
      // Load the session with its nodes
      const sessionWithNodes = await SupabaseSessionService.getSessionWithNodes(sessionId, user.id);
      if (sessionWithNodes) {
        setCurrentSession(sessionWithNodes);
      }
    } catch (error) {
      console.error('Error switching session:', error);
    }
  }, [user]);

  // Rename session and trigger refresh - SUPABASE IMPLEMENTATION
  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    if (!user) {
      console.warn('Cannot rename session: user not authenticated');
      return;
    }

    try {
      const success = await SupabaseSessionService.updateSession(sessionId, user.id, { name: newName });
      if (success) {
        // Refresh sessions list
        const allSessions = await SupabaseSessionService.getSessions(user.id);
        setSessions(allSessions);
        
        // Update current session if it's the one being renamed
        if (currentSession && currentSession.id === sessionId) {
          const updatedSession = await SupabaseSessionService.getSessionWithNodes(sessionId, user.id);
          if (updatedSession) {
            setCurrentSession(updatedSession);
          }
        }
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  }, [user, currentSession]);

  // Delete session and trigger refresh - SUPABASE IMPLEMENTATION
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) {
      console.warn('Cannot delete session: user not authenticated');
      return;
    }

    try {
      const success = await SupabaseSessionService.deleteSession(sessionId, user.id);
      if (success) {
        // Refresh sessions list
        const allSessions = await SupabaseSessionService.getSessions(user.id);
        setSessions(allSessions);
        
        // Clear current session if it was deleted
        if (currentSession && currentSession.id === sessionId) {
          setCurrentSession(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [user, currentSession]);

  // Delete node and trigger refresh - SUPABASE IMPLEMENTATION
  const deleteNode = useCallback(async (nodeId: string) => {
    if (!user) {
      console.warn('Cannot delete node: user not authenticated');
      return;
    }

    try {
      const success = await SupabaseSessionService.deleteNode(nodeId, user.id);
      if (success && currentSession) {
        // Update current session without the deleted node
        const updatedSession = await SupabaseSessionService.getSessionWithNodes(currentSession.id, user.id);
        if (updatedSession) {
          setCurrentSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  }, [user, currentSession]);

  // Update session settings - SUPABASE IMPLEMENTATION
  const updateSession = useCallback(async (updates: {
    name: string;
    description: string;
    isActive: boolean;
    locationTrackingActive: boolean;
  }) => {
    if (!user || !currentSession) {
      console.warn('Cannot update session: user not authenticated or no current session');
      return;
    }

    try {
      const success = await SupabaseSessionService.updateSession(currentSession.id, user.id, {
        name: updates.name,
        description: updates.description,
        is_active: updates.isActive,
        location_tracking_active: updates.locationTrackingActive,
      });

      if (success) {
        // Refresh sessions list
        const allSessions = await SupabaseSessionService.getSessions(user.id);
        setSessions(allSessions);
        
        // Update current session
        const updatedSession = await SupabaseSessionService.getSessionWithNodes(currentSession.id, user.id);
        if (updatedSession) {
          setCurrentSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }, [user, currentSession]);

  // Get current session nodes - STUB IMPLEMENTATION
  const getCurrentNodes = useCallback(() => {
    if (!user) {
      console.warn('Cannot get nodes: user not authenticated');
      return [];
    }

    // TODO: Replace with Supabase query
    console.warn('useSessionManager.getCurrentNodes - localStorage removed, using stub implementation');
    return sessionStorageService.getNodes();
  }, [user]);

  return {
    // State
    sessions,
    currentSession,
    loading,
    
    // Actions
    addNode,
    deleteNode,
    createNewSession,
    switchSession,
    renameSession,
    deleteSession,
    updateSession,
    
    // Utilities
    refreshSessions,
    getCurrentNodes,
  };
}
